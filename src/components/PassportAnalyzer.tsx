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
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath(); ctx.moveTo(0, TARGET_TOP_PX); ctx.lineTo(OUT_W, TARGET_TOP_PX); ctx.stroke();
        const chinLineY = TARGET_TOP_PX + TARGET_HEAD_HEIGHT;
        ctx.beginPath(); ctx.moveTo(0, chinLineY); ctx.lineTo(OUT_W, chinLineY); ctx.stroke();
        ctx.setLineDash([]);

        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
    }, [crown, chin, faceCenterX, fileUrl]);

    useEffect(() => { generatePreview(); }, [generatePreview]);

    // --- File Handling ---
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        setFileUrl(URL.createObjectURL(f));
        setCrown(null); setChin(null); setFaceBox(null);
        setMode('none'); setPreviewUrl(null); setFaceDetected(false);
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

        // Center vertical line (blue, from crown to chin)
        if (crown && chin && faceDetected) {
            const cx = ((crown.x + chin.x) / 2) * sx;
            const crownScreenY = crown.y * sy;
            const chinScreenY = chin.y * sy;

            // Blue vertical center line
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(cx, crownScreenY); ctx.lineTo(cx, chinScreenY); ctx.stroke();
            ctx.setLineDash([]);

            // Crown dot + label
            ctx.beginPath(); ctx.arc(cx, crownScreenY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#3b82f6';
            ctx.fillText('정수리', cx + 10, crownScreenY + 4);

            // Chin dot + label
            ctx.beginPath(); ctx.arc(cx, chinScreenY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#3b82f6';
            ctx.fillText('턱끝', cx + 10, chinScreenY + 4);
        }
    };

    useEffect(() => { drawCanvas(); }, [crown, chin, faceBox, faceDetected, fileUrl, imgSize]);

    // ==================== RENDER ====================
    return (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center justify-center max-w-6xl mx-auto py-10 px-4">

            {/* LEFT: Photo Source Card */}
            <div className="w-full max-w-[420px] lg:flex-shrink-0 z-10">
                <div className="bg-[#2d2d2d] p-5 rounded-[40px] shadow-2xl relative overflow-hidden ring-8 ring-white/20">
                    <div className="relative aspect-[3/4] rounded-[30px] overflow-hidden bg-black/20 flex flex-col">
                        {!fileUrl ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <span className="material-symbols-outlined text-6xl text-white/10 mb-4 block">image</span>
                                <p className="text-sm text-white/30 font-bold uppercase tracking-widest">No Image</p>
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

                                {/* "얼굴 찾는중..." overlay during detection */}
                                {isDetecting && (
                                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center z-30 pb-6">
                                        <div className="bg-black/70 backdrop-blur-sm text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            얼굴 찾는중...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bottom instruction overlay */}
                        {mode !== 'none' && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                                <div className="bg-white text-black px-6 py-3 rounded-full font-black text-xs shadow-2xl animate-bounce border-2 border-[#f6ab1a]">
                                    {mode === 'crown' ? '📸 정수리를 터치하세요' : '📸 턱 끝을 터치하세요'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Phone Mockup */}
            <div className="w-full max-w-[340px] lg:flex-shrink-0">
                <div className="bg-black p-4 rounded-[65px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-[#333] relative w-full">

                    <div className="bg-white rounded-[55px] overflow-hidden aspect-[9/19] flex flex-col relative shadow-inner">
                        {/* Dynamic Island with preview label */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-full z-20 flex items-center justify-center px-3">
                            <p className="text-white text-[9px] font-bold tracking-tight">미리보기 (413×531)</p>
                            <div className="size-1 rounded-full bg-blue-500/50 absolute right-3" />
                        </div>

                        {/* Phone Screen */}
                        <div className="flex-1 flex flex-col pt-12 p-5 overflow-y-auto">

                            {/* TOP: Preview image right below Dynamic Island */}
                            <div className="flex flex-col items-center mb-4">
                                <div className="w-full bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm relative">
                                    {previewUrl ? (
                                        <img src={previewUrl} className="w-full aspect-[413/531] object-cover" alt="preview" />
                                    ) : (
                                        <div className="w-full aspect-[413/531] flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
                                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">photo_camera</span>
                                            <p className="text-xs text-gray-400 font-bold">미리보기</p>
                                        </div>
                                    )}
                                    {isRemovingBg && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 w-full">
                                {!fileUrl ? (
                                    <label className="h-11 w-full bg-blue-500 rounded-2xl cursor-pointer shadow-[0_4px_0_0_#1d4ed8] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-white font-black text-[11px] tracking-wider gap-2 group">
                                        <span className="material-symbols-outlined text-sm group-hover:animate-bounce">cloud_upload</span>
                                        사진 불러오기
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
                                    </label>
                                ) : (
                                    <>
                                        <button
                                            onClick={removeBg}
                                            disabled={isRemovingBg}
                                            className="h-11 w-full bg-[#52a4ff] rounded-2xl shadow-[0_4px_0_0_#2b82e6] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-white font-black text-[11px] tracking-wider gap-2 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                                            {isRemovingBg ? '처리 중...' : '배경 하얗게'}
                                        </button>

                                        <button
                                            onClick={() => setMode('crown')}
                                            className="h-11 w-full bg-[#f6ab1a] rounded-2xl shadow-[0_4px_0_0_#d97706] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-white font-black text-[11px] tracking-wider gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">ads_click</span>
                                            정수리 턱끝 설정
                                        </button>

                                        <button
                                            onClick={download}
                                            disabled={!crown || !chin}
                                            className="h-11 w-full bg-[#a352ff] rounded-2xl shadow-[0_4px_0_0_#7c2be6] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center text-white font-black text-[11px] tracking-wider gap-2 disabled:opacity-40"
                                        >
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            여권 규격 완료!
                                        </button>

                                        {/* Fine Tuning */}
                                        <div className="pt-2 border-t border-zinc-100 flex gap-2">
                                            <button onClick={() => nudge(-1)} className="flex-1 h-9 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-100 border border-zinc-100">
                                                <span className="material-symbols-outlined text-lg">expand_less</span>
                                            </button>
                                            <button onClick={() => nudge(1)} className="flex-1 h-9 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 active:bg-zinc-100 border border-zinc-100">
                                                <span className="material-symbols-outlined text-lg">expand_more</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* iPhone Bottom Bar */}
                        <div className="h-1.5 w-32 bg-zinc-200 rounded-full mx-auto mb-4 mt-auto" />
                    </div>
                </div>
            </div>
        </div>
    );
}
