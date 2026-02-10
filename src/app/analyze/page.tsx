'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { removeBackground } from '@imgly/background-removal';

type Point = { x: number; y: number };
type Scores = {
    headRatio: number | null;        // headLen / imageHeight
    headOk: boolean | null;
    bgWhiteness: number | null;      // 0~100
    bgUniformity: number | null;     // 0~100 (높을수록 고른 배경)
    exposure: number | null;         // 0~100 (중간이 좋게 설계)
    sharpness: number | null;        // 0~100
};

function clamp(n: number, a = 0, b = 1) { return Math.max(a, Math.min(b, n)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function calcLaplacianVariance(gray: Uint8ClampedArray, w: number, h: number) {
    // 아주 단순한 선명도 지표: 라플라시안 분산(값이 클수록 선명)
    // gray: 0~255
    const lap: number[] = [];
    lap.length = (w * h);
    const idx = (x: number, y: number) => y * w + x;

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const c = gray[idx(x, y)];
            const v = -4 * c
                + gray[idx(x - 1, y)]
                + gray[idx(x + 1, y)]
                + gray[idx(x, y - 1)]
                + gray[idx(x, y + 1)];
            lap[idx(x, y)] = v;
        }
    }
    // 분산
    let sum = 0, cnt = 0;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const v = lap[idx(x, y)];
            sum += v;
            cnt++;
        }
    }
    const mean = sum / Math.max(1, cnt);
    let varSum = 0;
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const v = lap[idx(x, y)];
            const d = v - mean;
            varSum += d * d;
        }
    }
    return varSum / Math.max(1, cnt);
}

function rgbToGray(data: Uint8ClampedArray) {
    // RGBA -> gray (length = pixels)
    const n = Math.floor(data.length / 4);
    const gray = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    return gray;
}

function analyzeBackgroundAndExposureAndSharpness(
    imgData: ImageData,
    faceBox: { x: number; y: number; w: number; h: number } | null
) {
    const { data, width: w, height: h } = imgData;

    // 배경 샘플링: faceBox가 있으면 얼굴 영역 제외, 없으면 중앙 40% 제외
    const fx = faceBox?.x ?? Math.floor(w * 0.30);
    const fy = faceBox?.y ?? Math.floor(h * 0.25);
    const fw = faceBox?.w ?? Math.floor(w * 0.40);
    const fh = faceBox?.h ?? Math.floor(h * 0.50);

    const samples: number[] = [];
    const luminances: number[] = [];
    const step = Math.max(2, Math.floor(Math.min(w, h) / 200)); // 대충 200x200 수준으로 다운샘플
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const inFace = x >= fx && x <= fx + fw && y >= fy && y <= fy + fh;
            if (inFace) continue;
            const i = (y * w + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            // "흰색에 가까움" 점수: 채도 낮고 밝을수록 흰색
            const maxc = Math.max(r, g, b);
            const minc = Math.min(r, g, b);
            const sat = maxc === 0 ? 0 : (maxc - minc) / maxc; // 0~1
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0~1
            const whiteness = (1 - sat) * lum; // 0~1
            samples.push(whiteness);
            luminances.push(lum);
        }
    }

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
    const variance = (arr: number[]) => {
        const m = mean(arr);
        return mean(arr.map(v => (v - m) * (v - m)));
    };

    const bgWhite = clamp(mean(samples), 0, 1);
    const bgVar = clamp(variance(samples) * 4, 0, 1); // 스케일링(대충)
    const bgWhitenessScore = Math.round(bgWhite * 100);      // 높을수록 흰 배경
    const bgUniformityScore = Math.round((1 - bgVar) * 100); // 높을수록 고른 배경

    // 노출: 배경 제외 전체 luminance 평균이 0.55 근처면 좋게
    const lumAll = rgbToGray(data);
    let sumLum = 0;
    for (let i = 0; i < lumAll.length; i++) sumLum += lumAll[i] / 255;
    const avgLum = sumLum / Math.max(1, lumAll.length);
    const exposureScore = Math.round((1 - Math.abs(avgLum - 0.55) / 0.55) * 100); // 0~100

    // 선명도: 라플라시안 분산을 0~100으로 대충 매핑
    const lapVar = calcLaplacianVariance(lumAll, w, h);
    const sharpnessScore = Math.round(clamp((Math.log10(lapVar + 1) / 3), 0, 1) * 100);

    return { bgWhitenessScore, bgUniformityScore, exposureScore, sharpnessScore };
}

export default function Page() {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
    const [mode, setMode] = useState<'crown' | 'chin' | 'facebox' | 'none'>('crown');
    const [crown, setCrown] = useState<Point | null>(null);
    const [chin, setChin] = useState<Point | null>(null);
    const [faceBox, setFaceBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [faceCenterX, setFaceCenterX] = useState<number | null>(null); // [New] Nose tip X for perfect centering
    const [scores, setScores] = useState<Scores>({
        headRatio: null, headOk: null,
        bgWhiteness: null, bgUniformity: null,
        exposure: null, sharpness: null
    });

    const imgRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false); // [NEW] 자동 감지 중 상태
    const [showGuide, setShowGuide] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);
            console.log('FaceAPI Models Loaded');
        };
        loadModels();
    }, []);

    // [New] Effect: Trigger detection when models AND image are ready
    useEffect(() => {
        if (modelsLoaded && imgRef.current && fileUrl) {
            console.log("Models loaded & Image ready -> Triggering Auto-Detect");
            detectFace();
        }
    }, [modelsLoaded, fileUrl]);

    useEffect(() => {
        return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
    }, [fileUrl]);

    const headRatioRange = useMemo(() => ({ min: 0.711, max: 0.800 }), []);

    const OUT_W = 413;
    const OUT_H = 531;
    const TARGET_HEAD_RATIO = 0.75; // 정수리~턱끝이 최종 이미지 높이의 75% 되게(권장범위 중앙)
    const TARGET_TOP_MARGIN = (1 - TARGET_HEAD_RATIO) / 2; // 위/아래 여백 균등

    // [UPDATE] SSD MobileNet V1 박스는 얼굴(머리) 전체를 잘 잡으므로, 
    // 정수리는 박스 상단(0%), 턱끝은 박스 하단(100%)에 가깝게 수정.
    const EST_CROWN_Y = 0.045; // 박스 상단에서 4.5% 지점 (정수리)
    const EST_CHIN_Y = 0.96;  // 박스 상단에서 96% 지점 (턱끝)

    function resetAll() {
        setCrown(null);
        setChin(null);
        setFaceBox(null);
        setFaceCenterX(null);
        setScores({ headRatio: null, headOk: null, bgWhiteness: null, bgUniformity: null, exposure: null, sharpness: null });
        setMode('crown');
    }

    function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        const url = URL.createObjectURL(f);
        setFileUrl(url);
        resetAll();
        // [New] Show "Finding face..." immediately
        setIsDetecting(true);
    }

    function drawOverlay() {
        const img = imgRef.current;
        const c = canvasRef.current;
        if (!img || !c || !imgSize) return;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        // canvas matches displayed image size
        const rect = img.getBoundingClientRect();
        c.width = Math.round(rect.width);
        c.height = Math.round(rect.height);
        ctx.clearRect(0, 0, c.width, c.height);

        // scale from natural -> displayed
        const sx = c.width / img.naturalWidth;
        const sy = c.height / img.naturalHeight;

        // points
        const drawPoint = (p: Point, label: string) => {
            ctx.beginPath();
            ctx.arc(p.x * sx, p.y * sy, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(59,130,246,0.9)';
            ctx.fill();
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'rgba(17,24,39,0.9)';
            ctx.fillText(label, p.x * sx + 8, p.y * sy - 8);
        };
        if (crown) drawPoint(crown, '정수리');
        if (chin) drawPoint(chin, '턱끝');

        // faceBox (Update: Draw based on Crown/Chin if available to match logic)
        if (faceBox) {
            ctx.strokeStyle = 'rgba(16,185,129,0.9)';
            ctx.lineWidth = 2;

            let bx = faceBox.x;
            let by = faceBox.y;
            let bw = faceBox.w;
            let bh = faceBox.h;

            // If we have calculated points, align the box to them
            if (crown && chin) {
                by = crown.y;
                bh = chin.y - crown.y;
            }

            ctx.strokeRect(bx * sx, by * sy, bw * sx, bh * sy);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = 'rgba(16,185,129,0.95)';
            ctx.fillText('얼굴 영역', bx * sx + 6, by * sy - 6);
        }

        // head ratio guide
        if (crown && chin) {
            ctx.strokeStyle = 'rgba(59,130,246,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(crown.x * sx, crown.y * sy);
            ctx.lineTo(chin.x * sx, chin.y * sy);
            ctx.stroke();
        }
    }

    useEffect(() => { drawOverlay(); }, [crown, chin, faceBox, imgSize, fileUrl]);

    // Live crop preview (413x531)
    const generatePreview = useCallback(() => {
        const img = imgRef.current;
        if (!img || !crown || !chin) {
            setPreviewUrl(null);
            return;
        }

        const headLen = Math.abs(chin.y - crown.y);
        if (headLen < 1) { setPreviewUrl(null); return; }

        // "강제 규격 준수 모드" (사용자 요청: 얼굴크기 380px 고정)
        const TARGET_TOP_PX = 30;
        // const TARGET_BOTTOM_PX = 125;
        const targetHeadHeight = 380;

        const scale = targetHeadHeight / headLen;

        // [Auto Center] Use nose tip X if detected
        const centerX_src = faceCenterX ?? ((crown.x + chin.x) / 2);

        const targetCrownY = TARGET_TOP_PX;
        const targetCenterX = OUT_W / 2;

        const dx = targetCenterX - centerX_src * scale;
        const dy = targetCrownY - crown.y * scale;

        const out = document.createElement('canvas');
        out.width = OUT_W;
        out.height = OUT_H;
        const ctx = out.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUT_W, OUT_H);

        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, dx, dy, dw, dh);

        // Draw guide lines on preview
        ctx.strokeStyle = 'rgba(59,130,246,0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        // Crown line (30px)
        ctx.beginPath(); ctx.moveTo(0, TARGET_TOP_PX); ctx.lineTo(OUT_W, TARGET_TOP_PX); ctx.stroke();
        // Chin line (30 + 380 = 410px)
        const CHIN_Y = TARGET_TOP_PX + targetHeadHeight;
        ctx.beginPath(); ctx.moveTo(0, CHIN_Y); ctx.lineTo(OUT_W, CHIN_Y); ctx.stroke();

        setPreviewUrl(out.toDataURL('image/jpeg', 0.85));
    }, [crown, chin, fileUrl]);

    useEffect(() => { generatePreview(); }, [generatePreview]);

    async function onImgLoad() {
        const img = imgRef.current;
        if (!img) return;
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });

        // [Fix] Trigger detection here if models are already loaded.
        // The existing useEffect handles the case where models load AFTER image.
        // But if models are READY, useEffect might not trigger on image load (depending on dependencies).
        if (modelsLoaded) {
            detectFace();
        }
    }

    async function detectFace() {
        if (!modelsLoaded) return; // Wait for useEffect
        const img = imgRef.current;
        if (!img) return;

        try {
            // Use SSD MobileNet V1 (slower but more accurate)
            const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();

            if (detection) {
                const { box } = detection.detection;
                const landmarks = detection.landmarks;

                // Set FaceBox
                setFaceBox({
                    x: box.x,
                    y: box.y,
                    w: box.width,
                    h: box.height,
                });

                // Set Chin (Landmark 8)
                const chinPoint = landmarks.positions[8];

                // --- Multi-Signal Crown Estimation (Median Fusion) ---
                // Single-ratio approach was inconsistent across different hair volumes/foreheads.
                // Using 3 independent signals and taking median for robustness.

                const eyebrowsY = (landmarks.positions[19].y + landmarks.positions[24].y) / 2;
                const noseTip = landmarks.positions[30];
                const faceLen = chinPoint.y - eyebrowsY;

                // [Auto Center] Save nose tip X
                setFaceCenterX(noseTip.x);

                // Signal 1: Fixed ratio from eyebrows (original tuned method)
                const crownByRatio = eyebrowsY - faceLen * 0.68;

                // Signal 2: Detection bounding box top
                // SSD MobileNet box captures hair volume; add 3% inward offset
                const crownByBox = box.y + box.height * 0.03;

                // Signal 3: Forehead proportion extrapolation
                // Anthropometric rule: nose-to-eyebrow ≈ eyebrow-to-hairline
                // Add 15% for hair above hairline
                const noseToEyebrow = Math.abs(eyebrowsY - noseTip.y);
                const crownByForehead = eyebrowsY - noseToEyebrow * 1.15;

                // Median of 3 signals (resistant to any single outlier)
                const crownCandidates = [crownByRatio, crownByBox, crownByForehead].sort((a, b) => a - b);
                const estimatedCrownY = crownCandidates[1];

                console.log(`Crown signals: ratio=${crownByRatio.toFixed(0)}, box=${crownByBox.toFixed(0)}, forehead=${crownByForehead.toFixed(0)} -> median=${estimatedCrownY.toFixed(0)}`);

                // Chin Offset: 6% padding (User liked this)
                const chinOffsetY = chinPoint.y + faceLen * 0.06;

                const cx = box.x + box.width / 2;
                setChin({ x: chinPoint.x, y: chinOffsetY });
                setCrown({ x: cx, y: estimatedCrownY });

                setMode('none');
                setIsDetecting(false); // [Fix] Stop loading on success
                return;
            }
        } catch (e) {
            console.error("Face detection failed:", e);
        }

        // If we reached here, detection failed.
        setIsDetecting(false);
        // Do NOT auto switch to manual mode. Just clear points.
        // User will see "Manual Setting" button highlighted because (!crown && !isDetecting).
        setFaceBox(null);
        setFaceCenterX(null);
        setCrown(null);
        setChin(null);
        setMode('none'); // Keep mode none, let user click button
    }

    function getNaturalPointFromClick(e: React.MouseEvent) {
        const img = imgRef.current;
        if (!img) return null;
        const rect = img.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const nx = clamp(cx / rect.width, 0, 1) * img.naturalWidth;
        const ny = clamp(cy / rect.height, 0, 1) * img.naturalHeight;
        return { x: nx, y: ny };
    }

    function onClickImage(e: React.MouseEvent) {
        const p = getNaturalPointFromClick(e);
        if (!p) return;

        if (mode === 'crown') {
            setCrown(p);
            setMode('chin');
            return;
        }
        if (mode === 'chin') {
            setChin(p);

            // [Update] FaceBox Auto Calculation
            // User requested to remove drag step.
            // Calculate a reasonable face box based on Crown and Chin.
            if (crown) {
                const h = p.y - crown.y;
                const w = h * 0.8; // Estimate width (aspect ratio approx 1:1.25)
                const cx = (crown.x + p.x) / 2;
                const x = cx - w / 2;
                const y = crown.y;

                setFaceBox({ x, y, w, h });
            }

            setMode('none');
            return;
        }

        // Remove 'facebox' manual mode logic as it's no longer used.
        if (mode === 'facebox') {
            setMode('none');
            return;
        }
    }

    async function runDiagnosis() {
        const img = imgRef.current;
        if (!img || !imgSize) return;

        // 머리길이 비율
        let headRatio: number | null = null;
        let headOk: boolean | null = null;
        if (crown && chin) {
            const headLen = Math.abs(chin.y - crown.y); // 세로 기준(정수리~턱끝)
            headRatio = headLen / imgSize.h;
            headOk = headRatio >= headRatioRange.min && headRatio <= headRatioRange.max;
        }

        // 이미지 픽셀 분석을 위해 offscreen canvas 생성
        const off = document.createElement('canvas');
        off.width = img.naturalWidth;
        off.height = img.naturalHeight;
        const ctx = off.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, off.width, off.height);

        const { bgWhitenessScore, bgUniformityScore, exposureScore, sharpnessScore } =
            analyzeBackgroundAndExposureAndSharpness(imgData, faceBox);

        setScores({
            headRatio, headOk,
            bgWhiteness: bgWhitenessScore,
            bgUniformity: bgUniformityScore,
            exposure: exposureScore,
            sharpness: sharpnessScore
        });
    }

    function downloadBlob(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function makeAndDownload413x531() {
        const img = imgRef.current;
        if (!img || !imgSize) return;
        if (!crown || !chin) return;

        // [Add] Final confirmation before download
        const ok = window.confirm("정수리 끝과 턱끝 위치를 정확하게 맞추셨나요?\n확인을 누르면 여권 규격 사진이 생성됩니다.");
        if (!ok) return;

        // 1) 스케일 계산: headLen(원본) -> targetHeadPx(출력)
        const headLen = Math.abs(chin.y - crown.y);
        if (headLen < 1) return;

        // [Smart Logic] 만약 원본 이미지가 이미 여권 비율(3.5:4.5)에 가깝고,
        // 머리 크기도 적절한 범위(0.7 ~ 0.85)라면 원본 프레이밍을 유지.
        const srcRatio = img.naturalWidth / img.naturalHeight;
        const targetRatio = OUT_W / OUT_H; // 0.777...
        const currentHeadRatio = headLen / img.naturalHeight;

        let scale, dx, dy;

        // 허용 오차: 가로세로비 ±0.05, 머리크기 0.7~0.85 (규정: 0.71~0.8)
        if (Math.abs(srcRatio - targetRatio) < 0.05 &&
            currentHeadRatio >= 0.7 && currentHeadRatio <= 0.85) {

            // [Smart Mode] 원본 비율 유지 (기존 로직 유지)
            // 단, 사용자가 명확히 "규정 준수"를 원하므로 이 모드에서도 조정이 필요할 수 있으나,
            // 일단 원본이 이미 완벽하다면 건드리지 않는 것이 맞음.
            // 하지만 엄격한 30px/125px 요구사항이 있다면 이 조건을 무시하고 무조건 맞추는게 나을 수도 있음.
            // 일단 Smart Mode는 유지하되, 아래 자동 보정 로직을 "강제 적용"하도록 수정.

            // --> 사용자 요청: "무조건 30px, 125px 남겨!"
            // 따라서 Smart Mode(원본유지) 로직을 비활성화하고 무조건 규격에 맞춥니다.
        }

        // "강제 규격 준수 모드" (사용자 요청: 얼굴크기 380px 고정)
        const TARGET_TOP_PX = 30;   // 정수리 위 여백
        // const TARGET_BOTTOM_PX = 125; // (Old)

        // 1. 목표 얼굴 길이 계산 (User defined 380px)
        const targetHeadHeight = 380;

        // 2. 스케일 계산 (원본 얼굴 길이 -> 380px)
        scale = targetHeadHeight / headLen;

        // 3. 기준점(가로): 정수리와 턱끝의 X중간점 대신 코끝(Nose Tip) 사용 시도
        const centerX_src = faceCenterX ?? ((crown.x + chin.x) / 2);

        // 4. 목표 위치(출력)
        const targetCrownY = TARGET_TOP_PX; // 30px
        const targetCenterX = OUT_W / 2;    // 206.5px

        // 5. drawImage 위치 계산
        // (CrownY_src * scale + dy = TargetCrownY)  => dy = TargetCrownY - CrownY_src * scale
        // (CenterX_src * scale + dx = TargetCenterX) => dx = TargetCenterX - CenterX_src * scale
        dx = targetCenterX - centerX_src * scale;
        dy = targetCrownY - crown.y * scale;

        // 5) 출력 캔버스 생성
        const out = document.createElement('canvas');
        out.width = OUT_W;
        out.height = OUT_H;
        const ctx = out.getContext('2d');
        if (!ctx) return;

        // 배경 흰색(빈 공간 생겨도 흰색)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, OUT_W, OUT_H);

        // 6) 스케일된 이미지 그리기
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, dx, dy, dw, dh);

        // 7) JPG로 다운로드
        out.toBlob((blob) => {
            if (!blob) return;
            const ts = new Date().toISOString().replaceAll(':', '').slice(0, 15);
            downloadBlob(blob, `passport_${OUT_W}x${OUT_H}_${ts}.jpg`);
        }, 'image/jpeg', 0.95);
    }

    async function handleRemoveBackground() {
        const img = imgRef.current;
        if (!img || !fileUrl) return;

        setIsRemovingBg(true);
        try {
            // 1. Remove background (returns Blob with transparent bg)
            // [Fix] Add explicit CDN and publicPath to avoid 'Failed to fetch' on some environments
            const config: any = {
                debug: true,
                progress: (key: string, current: number, total: number) => {
                    console.log(`Downloading ${key}: ${current} of ${total}`);
                },
                model_base_url: 'https://static.imgly.com/lib/background-removal-js/v1.7.0/res/',
                publicPath: 'https://static.imgly.com/lib/background-removal-js/v1.7.0/res/'
            };
            const blob = await removeBackground(fileUrl, config);

            // 2. Composite onto White Background
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No Context');

            // Fill White
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw Image
            ctx.drawImage(bitmap, 0, 0);

            // 3. Update File URL
            canvas.toBlob(newBlob => {
                if (!newBlob) return;
                const newUrl = URL.createObjectURL(newBlob);
                setFileUrl(newUrl); // This will trigger onImgLoad -> Auto Detect

                // Cleanup old url if needed (though we revoke in useEffect)
            }, 'image/jpeg');

        } catch (e: any) {
            console.error('BG Removal failed:', e);
            alert(`배경 제거 실패: ${e.message || e}`);
        } finally {
            setIsRemovingBg(false);
        }
    }

    function autoEstimateCrownChin() {
        const img = imgRef.current;
        if (!img || !imgSize) return;

        // faceBox가 없으면 이미지 중심 기준으로 대충 찍어주기(비상용)
        if (!faceBox) {
            const cx = img.naturalWidth / 2;
            const cy = img.naturalHeight / 2;
            // 중앙 기준으로 위/아래로 대충
            const headLenGuess = img.naturalHeight * 0.35;
            setCrown({ x: cx, y: clamp(cy - headLenGuess / 2, 0, img.naturalHeight - 1) });
            setChin({ x: cx, y: clamp(cy + headLenGuess / 2, 0, img.naturalHeight - 1) });
            return;
        }

        // 1) 가로 중심: faceBox 중심
        const cx = faceBox.x + faceBox.w / 2;

        // 2) 세로 추정: faceBox 안에서 비율로 찍기
        const crownY = faceBox.y + faceBox.h * EST_CROWN_Y;
        const chinY = faceBox.y + faceBox.h * EST_CHIN_Y;

        setCrown({ x: cx, y: clamp(crownY, 0, img.naturalHeight - 1) });
        setChin({ x: cx, y: clamp(chinY, 0, img.naturalHeight - 1) });
    }

    function nudgePoint(which: 'crown' | 'chin', direction: number) {
        const img = imgRef.current;
        if (!img || !crown || !chin) return;
        // Dynamic step: 2% of head length (much more visible than fixed 3px)
        const headLen = Math.abs(chin.y - crown.y);
        const step = Math.max(4, Math.round(headLen * 0.02));
        const dy = direction * step;
        if (which === 'crown') {
            setCrown({ x: crown.x, y: clamp(crown.y + dy, 0, img.naturalHeight - 1) });
        }
        if (which === 'chin') {
            setChin({ x: chin.x, y: clamp(chin.y + dy, 0, img.naturalHeight - 1) });
        }
    }

    const headRatioText = useMemo(() => {
        if (scores.headRatio == null) return '정수리/턱끝을 찍으면 머리비율을 계산해요.';
        const pct = (scores.headRatio * 100).toFixed(1);
        const ok = scores.headOk ? 'OK' : '주의';
        return `머리길이 비율: ${pct}% (${ok}) — 권장 71.1%~80.0%`;
    }, [scores.headRatio, scores.headOk, headRatioRange]);

    const advice = useMemo(() => {
        const a: string[] = [];
        if (scores.headOk === false) {
            a.push('현재 머리 크기가 규정 범위 밖이지만, [자동 규격 맞추기] 다운로드 시 자동으로 75% 비율로 보정됩니다.');
        }
        if (scores.bgWhiteness != null && scores.bgWhiteness < 80) {
            a.push('배경이 충분히 흰색이 아니에요(회색/누런기/그림자 가능). 배경 보정이 필요합니다.');
        }
        if (scores.bgUniformity != null && scores.bgUniformity < 75) {
            a.push('배경이 고르지 않아요(얼룩/그라데이션/경계 거침). 경계 정리/노이즈 정리가 필요합니다.');
        }
        if (scores.exposure != null && scores.exposure < 70) {
            a.push('노출이 부적절할 수 있어요(너무 어둡거나 하이라이트). 밝기/톤 조정 권장.');
        }
        if (scores.sharpness != null && scores.sharpness < 35) {
            a.push('선명도가 낮아요(흐림/모션). 재촬영 또는 샤픈/노이즈 밸런스 조정이 필요합니다.');
        }
        if (a.length === 0 && (scores.bgWhiteness != null || scores.headRatio != null)) {
            a.push('진단상 큰 문제는 없어 보여요. “제출완성본 만들기”로 바로 제출 파일을 생성할 수 있습니다.');
        }
        return a;
    }, [scores]);

    // [Utility] Change JPEG DPI (Metadata)
    // Canvas defaults to 72 or 96 DPI. To satisfy strict reqs (300 DPI), we patch the APP0 header.
    async function changeDpiBlob(blob: Blob, dpi: number): Promise<Blob> {
        // 1. Convert Blob to ArrayBuffer
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // 2. Search for APP0 marker (FF E0)
        // JPEG Header: FF D8 (SOI) ... FF E0 (APP0) ...
        // usually: FF D8 FF E0 [Length 2B] [Identifier "JFIF\0"] [Version 2B] [Units 1B] [Xdensity 2B] [Ydensity 2B] ...

        // Simple check for JFIF header at start
        if (bytes.length > 20 &&
            bytes[0] === 0xFF && bytes[1] === 0xD8 &&
            bytes[2] === 0xFF && bytes[3] === 0xE0) {

            // Offset 13 is Units (0: no units, 1: dots per inch, 2: dots per cm)
            // Offset 14-15 is X Density
            // Offset 16-17 is Y Density

            // Set Units to 1 (dots per inch)
            bytes[13] = 1;

            // Set X Density (Big Endian)
            bytes[14] = (dpi >> 8) & 0xFF;
            bytes[15] = dpi & 0xFF;

            // Set Y Density (Big Endian)
            bytes[16] = (dpi >> 8) & 0xFF;
            bytes[17] = dpi & 0xFF;

            console.log(`DPI set to ${dpi} in JPEG header`);
        }

        return new Blob([bytes], { type: 'image/jpeg' });
    }

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <h1 className="text-2xl font-bold">무료 진단 MVP (로컬 처리)</h1>
                <p className="mt-2 text-sm text-neutral-600">
                    사진을 올리면 자동으로 얼굴을 인식합니다. <b>[배경 하얗게 만들기]</b> 후 <b>[규격 다운로드]</b>를 진행하세요.
                </p>
                <div className="mt-2 text-xs text-amber-600 font-medium">
                    💡 팁: 흰색 또는 단순한 배경에서 촬영하시면 배경 제거 결과가 훨씬 깨끗합니다.
                </div>

                <div className="mt-6 flex flex-col gap-4 md:flex-row">
                    <div className="md:w-2/3 rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <input type="file" accept="image/*" onChange={onPickFile} />

                                <button
                                    onClick={handleRemoveBackground}
                                    disabled={!fileUrl || isRemovingBg}
                                    className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                                >
                                    {isRemovingBg ? '배경 제거중...' : 'Step 1: 배경 하얗게 만들기'}
                                </button>

                                <button
                                    onClick={makeAndDownload413x531}
                                    disabled={!fileUrl || !crown || !chin}
                                    className="rounded-xl bg-neutral-900 border px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-40"
                                    title="정수리와 턱끝만 찍혀있으면, 자동으로 얼굴 크기와 위치를 규격에 맞춰 다운로드합니다"
                                >
                                    Step 2: 규격 다운로드 (413×531)
                                </button>
                            </div>

                            {/* [NEW] Options & Tools */}
                            <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                                <button
                                    onClick={() => setShowGuide(!showGuide)}
                                    disabled={!fileUrl}
                                    className={`rounded-lg px-2 py-1 text-xs font-medium border transition-colors ${showGuide ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                                >
                                    {showGuide ? '가이드 끄기' : '규격 가이드 보기'}
                                </button>

                                <div className="h-4 w-px bg-neutral-300 mx-1"></div>

                                <button
                                    onClick={() => detectFace()}
                                    disabled={!fileUrl || !modelsLoaded}
                                    className="rounded-lg bg-white border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                                >
                                    ↺ 초기화 (자동 선택)
                                </button>

                                <button
                                    onClick={() => { setMode('crown'); setFaceBox(null); }}
                                    disabled={!fileUrl}
                                    className={`rounded-lg px-2 py-1 text-xs font-bold border transition-colors ${
                                        // Highlight if auto-detect failed (mode is none but maybe we need a new state? No, simply use visual cue if crown/chin are missing)
                                        // Actually user wants it Yellow when they need to click it.
                                        // If crown is missing AND mode is none, maybe highlight it?
                                        (!crown && !isDetecting) || mode !== 'none'
                                            ? 'bg-amber-100 text-amber-700 border-amber-300 ring-2 ring-amber-200 animate-pulse'
                                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                        }`}
                                >
                                    {mode !== 'none' ? '수동 설정 중...' : '수동 설정 (직접 클릭)'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            {!fileUrl ? (
                                <div className="rounded-2xl border border-dashed p-10 text-center text-neutral-500">
                                    이미지 업로드 후 진단을 진행하세요.
                                </div>
                            ) : (
                                <div className="relative">
                                    <img
                                        ref={imgRef}
                                        src={fileUrl}
                                        alt="uploaded"
                                        className="w-full rounded-2xl"
                                        onLoad={onImgLoad}
                                        onClick={onClickImage}
                                    />
                                    <canvas ref={canvasRef} className="pointer-events-none absolute left-0 top-0" />

                                    {/* Passport Guide Overlay */}
                                    {showGuide && (
                                        <div className="pointer-events-none absolute inset-0 z-10 opacity-60">
                                            {/* Center Line */}
                                            <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-green-500"></div>

                                            {/* Head Top Limit (approx 4mm from top = ~9%) */}
                                            <div className="absolute left-0 w-full border-t border-green-500" style={{ top: '9%' }}>
                                                <span className="absolute right-0 bg-green-100 px-1 text-[10px] text-green-700">머리 상단 (Head Top)</span>
                                            </div>

                                            {/* Chin Limit (approx 3.6cm head = ~89% pos) */}
                                            <div className="absolute left-0 w-full border-t border-green-500" style={{ top: '89%' }}>
                                                <span className="absolute right-0 bg-green-100 px-1 text-[10px] text-green-700">턱 끝 (Chin Max)</span>
                                            </div>

                                            {/* Min Chin Limit (approx 3.2cm head = ~80% pos) */}
                                            <div className="absolute left-0 w-full border-t border-dashed border-green-400" style={{ top: '80%' }}>
                                                <span className="absolute right-0 bg-green-50 px-1 text-[10px] text-green-600">턱 최소 (Chin Min)</span>
                                            </div>

                                            {/* Central Face Zone Box (Visual Guide) */}
                                            <div className="absolute left-1/2 top-[12%] h-[70%] w-[55%] -translate-x-1/2 rounded border-2 border-green-500 bg-green-400/10"></div>
                                        </div>
                                    )}

                                    {/* Unified Notification Overlay (Black Pill) */}
                                    {(mode !== 'none' || isDetecting) && (
                                        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/10">
                                            <div className="rounded-full bg-black/80 px-4 py-2 text-sm font-bold text-white shadow-lg animate-bounce">
                                                {isDetecting && '얼굴 찾는 중...'}
                                                {!isDetecting && mode === 'crown' && '👇 사진 속 "정수리(머리 끝)"를 클릭하세요'}
                                                {!isDetecting && mode === 'chin' && '👇 사진 속 "턱 끝"을 클릭하세요'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                onClick={runDiagnosis}
                                disabled={!fileUrl}
                                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
                            >
                                무료진단 실행
                            </button>
                            <button
                                onClick={makeAndDownload413x531}
                                disabled={!fileUrl || !crown || !chin}
                                className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-40"
                                title="정수리와 턱끝만 찍혀있으면, 자동으로 얼굴 크기와 위치를 규격에 맞춰 다운로드합니다 (편리함)"
                            >
                                자동 규격 맞추기 (413×531 다운로드)
                            </button>
                            <button
                                disabled
                                className="rounded-xl border px-4 py-2 text-sm text-neutral-500"
                                title="다음 단계: 결제 후 제출완성본 생성(서버 렌더/고품질 배경제거/413x531 확정)"
                            >
                                제출완성본 만들기 (유료, TODO)
                            </button>
                        </div>
                    </div>

                    <div className="md:w-1/3 rounded-2xl bg-white p-4 shadow-sm">
                        <h2 className="text-lg font-semibold">진단 결과</h2>

                        <div className="mt-3 space-y-2 text-sm">
                            <div className="rounded-xl bg-neutral-50 p-3">
                                <div className="font-medium">머리(정수리~턱끝) 비율</div>
                                <div className="mt-1 text-neutral-700">{headRatioText}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-neutral-600">미세조정</span>

                                    <button className="rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                        onClick={() => nudgePoint('crown', -1)} disabled={!crown}>
                                        정수리 ▲
                                    </button>
                                    <button className="rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                        onClick={() => nudgePoint('crown', +1)} disabled={!crown}>
                                        정수리 ▼
                                    </button>

                                    <button className="rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                        onClick={() => nudgePoint('chin', -1)} disabled={!chin}>
                                        턱끝 ▲
                                    </button>
                                    <button className="rounded-lg border px-2 py-1 hover:bg-neutral-50"
                                        onClick={() => nudgePoint('chin', +1)} disabled={!chin}>
                                        턱끝 ▼
                                    </button>
                                </div>
                                {crown && chin && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                        <span className="text-neutral-500">정수리 빠른 조정</span>
                                        <button className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100"
                                            onClick={() => {
                                                const headLen = Math.abs(chin.y - crown.y);
                                                setCrown({ x: crown.x, y: crown.y - headLen * 0.08 });
                                            }}>
                                            머리숱 많음 ↑
                                        </button>
                                        <button className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-green-700 hover:bg-green-100"
                                            onClick={() => detectFace()}>
                                            기본 (재감지)
                                        </button>
                                        <button className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 hover:bg-amber-100"
                                            onClick={() => {
                                                const headLen = Math.abs(chin.y - crown.y);
                                                setCrown({ x: crown.x, y: crown.y + headLen * 0.08 });
                                            }}>
                                            짧은머리/대머리 ↓
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Live Crop Preview */}
                            {previewUrl && (
                                <div className="rounded-xl bg-neutral-50 p-3">
                                    <div className="font-medium mb-2">미리보기 (413x531)</div>
                                    <div className="flex justify-center">
                                        <img src={previewUrl} alt="crop preview" className="w-full max-w-[180px] rounded-lg border shadow-sm" />
                                    </div>
                                    <p className="mt-2 text-[10px] text-neutral-500 text-center">
                                        파란 점선 = 정수리(30px) / 턱끝(406px) 기준선
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-neutral-50 p-3">
                                    <div className="text-xs text-neutral-600">배경 흰색</div>
                                    <div className="mt-1 text-lg font-bold">{scores.bgWhiteness ?? '—'}</div>
                                </div>
                                <div className="rounded-xl bg-neutral-50 p-3">
                                    <div className="text-xs text-neutral-600">배경 균일</div>
                                    <div className="mt-1 text-lg font-bold">{scores.bgUniformity ?? '—'}</div>
                                </div>
                                <div className="rounded-xl bg-neutral-50 p-3">
                                    <div className="text-xs text-neutral-600">노출</div>
                                    <div className="mt-1 text-lg font-bold">{scores.exposure ?? '—'}</div>
                                </div>
                                <div className="rounded-xl bg-neutral-50 p-3">
                                    <div className="text-xs text-neutral-600">선명도</div>
                                    <div className="mt-1 text-lg font-bold">{scores.sharpness ?? '—'}</div>
                                </div>
                            </div>

                            <div className="rounded-xl border p-3">
                                <div className="font-medium">처방(자동)</div>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
                                    {advice.length === 0 ? <li>진단을 실행하면 처방이 나옵니다.</li> : advice.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                            </div>

                            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                                <b>다음 스텝(고도화)</b><br />
                                1) 얼굴박스 자동(모델) → 사용자는 클릭 없이도 진단<br />
                                2) 결제 시 서버에서 고품질 배경제거(rembg) + 413×531 최종 제출본 생성<br />
                                3) 반려 사유 선택하면 제휴점/직영 구제 라우팅
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-xs text-neutral-500">
                    * 이 MVP는 “무료 진단” 개념을 빠르게 확인하기 위한 버전입니다. 실제 서비스에선 규정/예외(유아, 안경 반사, 그림자 등) 체크를 더 보강하세요.
                </div>
            </div>

            {/* Loading Overlay */}
            {isRemovingBg && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-xl">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600"></div>
                        <p className="mt-4 text-lg font-bold text-neutral-800">배경 제거 중...</p>
                        <p className="text-sm text-neutral-500">잠시만 기다려주세요 (약 3~5초)</p>
                    </div>
                </div>
            )}
        </div>
    );
}
