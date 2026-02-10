'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { removeBackground } from '@imgly/background-removal';

type Point = { x: number; y: number };

const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));

async function setDPI(blob: Blob, dpi: number): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0) !== 0xFFD8) return blob;
    let offset = 2;
    while (offset < view.byteLength) {
        if (view.getUint8(offset) !== 0xFF) break;
        const marker = view.getUint8(offset + 1);
        const length = view.getUint16(offset + 2);
        if (marker === 0xE0) {
            if (view.getUint32(offset + 4) === 0x4A464946 && view.getUint8(offset + 8) === 0) {
                view.setUint8(offset + 13, 1);
                view.setUint16(offset + 14, dpi);
                view.setUint16(offset + 16, dpi);
                return new Blob([arrayBuffer], { type: 'image/jpeg' });
            }
        }
        offset += 2 + length;
    }
    return blob;
}

export default function PassportAnalyzer() {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
    const [mode, setMode] = useState<'crown' | 'chin' | 'none'>('none');
    const [crown, setCrown] = useState<Point | null>(null);
    const [chin, setChin] = useState<Point | null>(null);
    const [faceBox, setFaceBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [faceCenterX, setFaceCenterX] = useState<number | null>(null);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [faceDetected, setFaceDetected] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showInitialPopup, setShowInitialPopup] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);

    const imgRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const OUT_W = 413, OUT_H = 531;
    const TARGET_HEAD_HEIGHT = 380;
    const TARGET_TOP_PX = 30;

    // --- Load FaceAPI models ---
    useEffect(() => {
        const load = async () => {
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                ]);
                setModelsLoaded(true);
            } catch (e) { console.error("FaceAPI load failed:", e); }
        };
        load();
    }, []);

    useEffect(() => {
        if (modelsLoaded && imgRef.current && fileUrl) detectFace();
    }, [modelsLoaded, fileUrl]);

    useEffect(() => {
        return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
    }, [fileUrl]);

    // --- Face Detection ---
    const detectFace = async () => {
        if (!modelsLoaded || !imgRef.current) return;
        setIsDetecting(true);
        setFaceDetected(false);
        try {
            const detection = await faceapi.detectSingleFace(imgRef.current, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
            if (detection) {
                const { box } = detection.detection;
                const lm = detection.landmarks;
                const chinPt = lm.positions[8];
                const eyebrowsY = (lm.positions[19].y + lm.positions[24].y) / 2;
                const noseTip = lm.positions[30];
                const faceLen = chinPt.y - eyebrowsY;

                setFaceCenterX(noseTip.x);
                setFaceBox({ x: box.x, y: box.y, w: box.width, h: box.height });

                const c1 = eyebrowsY - faceLen * 0.68;
                const c2 = box.y + box.height * 0.03;
                const c3 = eyebrowsY - Math.abs(eyebrowsY - noseTip.y) * 1.15;
                const crownY = [c1, c2, c3].sort((a, b) => a - b)[1];

                setCrown({ x: box.x + box.width / 2, y: crownY });
                setChin({ x: chinPt.x, y: chinPt.y + faceLen * 0.06 });
                setFaceDetected(true);
            }
        } catch (e) { console.error("Detection error:", e); }
        setIsDetecting(false);
    };

    // --- Preview Generation with guide lines ---
    const generatePreview = useCallback(() => {
        if (!imgRef.current || !crown || !chin) { setPreviewUrl(null); return; }
        const headLen = Math.abs(chin.y - crown.y);
        if (headLen < 1) return;
        const scale = TARGET_HEAD_HEIGHT / headLen;
        const centerX_src = faceCenterX ?? ((crown.x + chin.x) / 2);
        const dx = (OUT_W / 2) - centerX_src * scale;
        const dy = TARGET_TOP_PX - crown.y * scale;
        const canvas = document.createElement('canvas');
        canvas.width = OUT_W; canvas.height = OUT_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, OUT_W, OUT_H);
        ctx.drawImage(imgRef.current, dx, dy, imgRef.current.naturalWidth * scale, imgRef.current.naturalHeight * scale);

        // Draw guide lines
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2.5; // Thicker for mobile
        ctx.strokeStyle = '#ff4d4d'; // Red for visibility
        ctx.beginPath(); ctx.moveTo(0, TARGET_TOP_PX); ctx.lineTo(OUT_W, TARGET_TOP_PX); ctx.stroke();

        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#ff4d4d';
        ctx.fillText('정수리', 10, TARGET_TOP_PX - 8);

        const chinLineY = TARGET_TOP_PX + TARGET_HEAD_HEIGHT;
        ctx.beginPath(); ctx.moveTo(0, chinLineY); ctx.lineTo(OUT_W, chinLineY); ctx.stroke();
        ctx.fillText('턱끝', 10, chinLineY + 30);
        ctx.setLineDash([]);

        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
    }, [crown, chin, faceCenterX, fileUrl]);

    useEffect(() => { generatePreview(); }, [generatePreview]);

    // --- File Handling ---
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        setIsFileLoading(true);
        const url = URL.createObjectURL(f);
        setFileUrl(url);
        setCrown(null); setChin(null); setFaceBox(null);
        setMode('none'); setPreviewUrl(null); setFaceDetected(false);

        // Brief delay to show loading state
        setTimeout(() => {
            setIsFileLoading(false);
            setShowInitialPopup(true);
        }, 800);
    };

    const nudge = (dir: number) => {
        if (!crown || !chin) return;
        const headLen = Math.abs(chin.y - crown.y);
        const step = Math.max(1, Math.round(headLen * 0.01));
        setCrown({ ...crown, y: crown.y + dir * step });
        setChin({ ...chin, y: chin.y + dir * step });
    };

    // --- Download with 300 DPI ---
    const download = async () => {
        if (!imgRef.current || !crown || !chin) return;
        const canvas = document.createElement('canvas');
        canvas.width = OUT_W; canvas.height = OUT_H;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const headLen = Math.abs(chin.y - crown.y);
        const scale = TARGET_HEAD_HEIGHT / headLen;
        const centerX_src = faceCenterX ?? ((crown.x + chin.x) / 2);
        const dx = (OUT_W / 2) - centerX_src * scale;
        const dy = TARGET_TOP_PX - crown.y * scale;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, OUT_W, OUT_H);
        ctx.drawImage(imgRef.current, dx, dy, imgRef.current.naturalWidth * scale, imgRef.current.naturalHeight * scale);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const highDpiBlob = await setDPI(blob, 300);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(highDpiBlob);
            link.download = `yeonhui_passport_${Date.now()}.jpg`;
            link.click();
        }, 'image/jpeg', 0.98);
    };

    // --- Background Removal ---
    const removeBg = async () => {
        if (!imgRef.current) return;
        setIsRemovingBg(true);
        try {
            const img = imgRef.current;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.naturalWidth;
            tempCanvas.height = img.naturalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) throw new Error("Canvas failed");
            tempCtx.drawImage(img, 0, 0);

            const imageBlob = await new Promise<Blob>((res, rej) => {
                tempCanvas.toBlob(b => b ? res(b) : rej("Blob failed"), 'image/jpeg', 0.95);
            });

            const resultBlob = await removeBackground(imageBlob);

            const bitmap = await createImageBitmap(resultBlob);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width; canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d'); if (!ctx) return;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bitmap, 0, 0);
            canvas.toBlob(b => {
                if (b) setFileUrl(URL.createObjectURL(b));
            }, 'image/jpeg', 0.95);
        } catch (e) {
            console.error("BG removal error:", e);
            alert("배경 제거에 실패했습니다. 다시 시도해 주세요.");
        }
        setIsRemovingBg(false);
    };

    const onImgLoad = () => {
        if (!imgRef.current) return;
        setImgSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
        if (modelsLoaded) detectFace();
    };

    // --- Canvas overlay: green face box + crown/chin markers with labels ---
    const drawCanvas = () => {
        const img = imgRef.current, c = canvasRef.current;
        if (!img || !c || !imgSize) return;
        const rect = img.getBoundingClientRect();
        c.width = rect.width; c.height = rect.height;
        const ctx = c.getContext('2d'); if (!ctx) return;
        const sx = c.width / img.naturalWidth, sy = c.height / img.naturalHeight;

        // Draw green face box (like reference image 4)
        if (faceBox && faceDetected) {
            const bx = faceBox.x * sx, by = faceBox.y * sy;
            const bw = faceBox.w * sx, bh = faceBox.h * sy;

            // Green rectangle
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);

            // Corner accents (thicker lines at corners)
            const cornerLen = Math.min(bw, bh) * 0.15;
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 4;
            // Top-left
            ctx.beginPath(); ctx.moveTo(bx, by + cornerLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerLen, by); ctx.stroke();
            // Top-right
            ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerLen); ctx.stroke();
            // Bottom-left
            ctx.beginPath(); ctx.moveTo(bx, by + bh - cornerLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerLen, by + bh); ctx.stroke();
            // Bottom-right
            ctx.beginPath(); ctx.moveTo(bx + bw - cornerLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerLen); ctx.stroke();

            // "얼굴영역" label at top of face box
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#00e676';
            ctx.fillText('얼굴영역', bx + 4, by - 6);
        }

        // Center vertical line (green, from crown to chin)
        if (crown && chin && faceDetected) {
            const cx = ((crown.x + chin.x) / 2) * sx;
            const crownScreenY = crown.y * sy;
            const chinScreenY = chin.y * sy;

            // Green vertical center line
            ctx.strokeStyle = '#00e676';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(cx, crownScreenY); ctx.lineTo(cx, chinScreenY); ctx.stroke();
            ctx.setLineDash([]);

            // Crown dot + label
            ctx.beginPath(); ctx.arc(cx, crownScreenY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4d4d'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText('정수리', cx + 12, crownScreenY + 4);

            // Chin dot + label
            ctx.beginPath(); ctx.arc(cx, chinScreenY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4d4d'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText('턱끝', cx + 12, chinScreenY + 4);
        }
    };

    useEffect(() => { drawCanvas(); }, [crown, chin, faceBox, faceDetected, fileUrl, imgSize]);

    // ==================== RENDER ====================
    return (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center max-w-6xl mx-auto py-6 px-4">

            {/* HELP MODAL */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowHelp(false)}>
                    <div className="bg-white rounded-[40px] w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 size-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h3 className="text-2xl font-black mb-6">📸 사용법 가이드</h3>
                        <div className="space-y-6 text-zinc-600 font-bold">
                            <div className="flex gap-4">
                                <div className="size-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">1</div>
                                <p>정면 사진을 불러오세요.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="size-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shrink-0">2</div>
                                <p>화면를 터치해 <b>정수리</b>와 <b>턱끝</b> 위치를 정확히 찍어주세요.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="size-8 bg-sky-500 rounded-lg flex items-center justify-center text-white shrink-0">3</div>
                                <p><b>배경 하얗게</b> 버튼을 눌러 배경을 제거하세요.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="size-8 bg-purple-500 rounded-lg flex items-center justify-center text-white shrink-0">4</div>
                                <p><b>3,900원 결제 후 다운로드</b>를 눌러 파일을 받으세요!</p>
                            </div>
                        </div>
                        <button onClick={() => setShowHelp(false)} className="w-full mt-10 h-16 bg-black text-white rounded-2xl font-black text-lg">알겠습니다!</button>
                    </div>
                </div>
            )}

            {/* INITIAL POPUP */}
            {showInitialPopup && (
                <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-6 pointer-events-none">
                    <div className="bg-blue-600 text-white rounded-3xl p-6 shadow-2xl animate-bounce-slow pointer-events-auto">
                        <p className="font-black text-lg text-center leading-tight">
                            분석이 완료되었습니다!<br />
                            <span className="text-blue-200 text-sm">먼저 정수리와 턱끝을 설정해주세요.</span>
                        </p>
                        <button onClick={() => setShowInitialPopup(false)} className="w-full mt-4 h-12 bg-white text-blue-600 rounded-xl font-black">확인</button>
                    </div>
                </div>
            )}

            {/* LEFT: Photo Source Card */}
            <div className="w-full max-w-[420px] lg:flex-shrink-0 z-10">
                <div className="bg-[#2d2d2d] p-4 lg:p-5 rounded-[40px] shadow-2xl relative overflow-hidden ring-4 lg:ring-8 ring-white/20">
                    <div className="relative aspect-[3/4] rounded-[30px] overflow-hidden bg-black/20 flex flex-col">
                        {!fileUrl || isFileLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                {isFileLoading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="size-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <p className="text-white font-black text-lg animate-pulse">사진 불러오는 중...</p>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-6xl text-white/10 mb-4 block">image</span>
                                        <p className="text-sm text-white/30 font-bold uppercase tracking-widest">No Image</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative flex-1">
                                <img
                                    ref={imgRef} src={fileUrl} alt="source"
                                    className="w-full h-full object-contain"
                                    onLoad={onImgLoad}
                                    onClick={(e) => {
                                        const r = e.currentTarget.getBoundingClientRect();
                                        const nx = clamp((e.clientX - r.left) / r.width, 0, 1) * imgRef.current!.naturalWidth;
                                        const ny = clamp((e.clientY - r.top) / r.height, 0, 1) * imgRef.current!.naturalHeight;
                                        if (mode === 'crown') { setCrown({ x: nx, y: ny }); setMode('chin'); }
                                        else if (mode === 'chin') { setChin({ x: nx, y: ny }); setMode('none'); }
                                    }}
                                />
                                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

                                {isDetecting && (
                                    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-[2px]">
                                        <div className="bg-black/80 text-white px-6 py-3 rounded-full font-black text-base shadow-lg flex items-center gap-3">
                                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                            데이터 분석 중...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode !== 'none' && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[80%]">
                                <div className="bg-white text-black px-6 py-4 rounded-3xl font-black text-base shadow-2xl animate-bounce border-4 border-[#f6ab1a] text-center">
                                    {mode === 'crown' ? '📸 머리 맨 위(정수리)를 터치!' : '📸 턱 끝을 터치하세요!'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Phone Mockup */}
            <div className="w-full max-w-[340px] lg:flex-shrink-0">
                <div className="bg-black p-4 rounded-[65px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-[#333] relative w-full h-[680px]">

                    <div className="bg-white rounded-[55px] overflow-hidden h-full flex flex-col relative shadow-inner">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-full z-20 flex items-center justify-center px-3">
                            <p className="text-white text-[10px] font-black tracking-tight">미리보기 (413×531)</p>
                            <div className="size-1.5 rounded-full bg-blue-500 absolute right-3 animate-pulse" />
                        </div>

                        {/* Phone Screen - Minimized scroll */}
                        <div className="flex-1 flex flex-col pt-12 px-6 pb-6 overflow-hidden">

                            {/* PREVIEW CONTAINER */}
                            <div className="flex flex-col items-center mb-6 grow-0 shrink-0">
                                <div className="w-full bg-gray-50 rounded-[2.5rem] border-4 border-gray-100 overflow-hidden shadow-sm relative aspect-[413/531]">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50">
                                            <span className="material-symbols-outlined text-5xl text-zinc-200 mb-3 block">photo_camera</span>
                                            <p className="text-sm text-zinc-300 font-black">사진을 불러오세요</p>
                                        </div>
                                    )}
                                    {isRemovingBg && (
                                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="font-black text-blue-600 text-lg">배경 제거 중...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center mt-3">
                                    <p className="text-xs font-black text-zinc-400">규격 미리보기 (413×531)</p>
                                </div>
                            </div>

                            {/* Action Buttons - Optimized for size */}
                            <div className="space-y-3 w-full mt-auto">
                                {!fileUrl ? (
                                    <div className="space-y-3">
                                        <label className="h-16 w-full bg-blue-600 hover:bg-blue-700 rounded-3xl cursor-pointer shadow-[0_6px_0_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-white font-black text-lg tracking-wider gap-3 group">
                                            <span className="material-symbols-outlined text-2xl group-hover:animate-bounce">cloud_upload</span>
                                            사진 불러오기
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
                                        </label>
                                        <button onClick={() => setShowHelp(true)} className="h-14 w-full bg-zinc-100 hover:bg-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 font-bold text-sm transition-colors border-2 border-zinc-200">
                                            사용법 보기
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            <button
                                                onClick={() => setMode('crown')}
                                                className="h-14 w-full bg-[#f6ab1a] rounded-2xl shadow-[0_4px_0_0_#d97706] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-white font-black text-sm tracking-wider gap-2"
                                            >
                                                <span className="material-symbols-outlined text-xl">ads_click</span>
                                                정수리 턱끝 설정
                                            </button>

                                            <button
                                                onClick={removeBg}
                                                disabled={isRemovingBg || !crown}
                                                className="h-14 w-full bg-[#52a4ff] rounded-2xl shadow-[0_4px_0_0_#2b82e6] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-white font-black text-sm tracking-wider gap-2 disabled:opacity-40"
                                            >
                                                <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                                                배경 하얗게 처리
                                            </button>

                                            <button
                                                onClick={download}
                                                disabled={!crown || !chin || isRemovingBg}
                                                className="h-16 w-full bg-[#a352ff] rounded-3xl shadow-[0_6px_0_0_#7c2be6] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-white font-black text-lg tracking-wider gap-2 disabled:opacity-40"
                                            >
                                                <span className="material-symbols-outlined text-2xl">payments</span>
                                                3,900원 결제 후 다운로드
                                            </button>
                                        </div>

                                        {/* Fine Tuning */}
                                        <div className="flex gap-2 items-center">
                                            <button onClick={() => nudge(-1)} className="flex-1 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 active:bg-zinc-200 border-2 border-zinc-200 transition-colors">
                                                <span className="material-symbols-outlined text-2xl">keyboard_arrow_up</span>
                                            </button>
                                            <button onClick={() => nudge(1)} className="flex-1 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 active:bg-zinc-200 border-2 border-zinc-200 transition-colors">
                                                <span className="material-symbols-outlined text-2xl">keyboard_arrow_down</span>
                                            </button>
                                            <button onClick={() => setShowHelp(true)} className="size-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 border-2 border-zinc-100">
                                                <span className="material-symbols-outlined text-xl">help</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* iPhone Bottom Bar */}
                        <div className="h-1.5 w-32 bg-zinc-200 rounded-full mx-auto mb-5 shrink-0" />
                    </div>
                </div>
            </div>
        </div>
    );
}
