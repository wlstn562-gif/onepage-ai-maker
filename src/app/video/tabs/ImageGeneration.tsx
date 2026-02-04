"use client";
import React, { useState, useEffect } from "react";
import { useVideoContext, IMAGE_STYLES, Scene } from "../context/VideoContext";

const cleanPrefix = (s: string) => s.replace(/^\s*(promptEn|ko\d)\s*[:：]\s*/i, "").trim();

function parsePromptResponse(text: string) {
    const re = /===\s*SCENE\s*0*(\d+)\s*===([\s\S]*?)(?===|$)/gi;
    const matches = Array.from(text.matchAll(re));
    const results: Record<number, string> = {};

    for (const m of matches) {
        const content = m[2];
        const promptLine = content.match(/promptEn\s*[:：]\s*(.*)/i);
        if (promptLine && promptLine[1]) {
            results[Number(m[1])] = promptLine[1].trim();
        }
    }
    return results;
}

export default function ImageGeneration() {
    const { project, setProject, projectRef, patchScene, API, setStatus, isBusy, setBusy, busyAny, autoPilotMode, setCurrentStep, saveProjectImmediately } = useVideoContext();
    const [generatingAll, setGeneratingAll] = useState(false);
    const [generatingPrompts, setGeneratingPrompts] = useState(false);
    const [allowDalle, setAllowDalle] = useState(false); // Default OFF to save cost

    const downloadImage = async (url: string, name: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (e) {
            alert("다운로드 실패: " + e);
        }
    };

    // Auto-Pilot Effect
    useEffect(() => {
        // ✅ AUTO-RECOVERY
        const recoverLostImages = async () => {
            // Safe to use prop 'project' here as it runs on mount/update
            // But for safety let's use Ref if available or keep simple since this is one-off
            const currentScenes = projectRef?.current?.scenes || project.scenes;
            const missingImgScenes = currentScenes.filter(s => !s.imageUrl);
            if (missingImgScenes.length > 0) {
                console.log("♻️ Auto-Recovery: Checking for lost files...");
                let recoveredCount = 0;
                await Promise.all(missingImgScenes.map(async (s) => {
                    try {
                        const targetUrl = `/api/file?id=gen_${s.id}.png`;
                        const res = await fetch(targetUrl, { method: 'HEAD' });
                        if (res.ok) {
                            patchScene(s.id, { imageUrl: `${targetUrl}&t=${Date.now()}` });
                            recoveredCount++;
                        }
                    } catch (e) { /* ignore */ }
                }));
                if (recoveredCount > 0) {
                    setStatus(`♻️ 시스템 복구: 서버에서 ${recoveredCount}개의 이미지를 찾아 복원했습니다!`);
                }
            }
        };
        recoverLostImages();

        if (!autoPilotMode) return;

        const runAuto = async () => {
            // Wait a bit for mount
            await new Promise(r => setTimeout(r, 1000));

            // USE REF FOR FRESH DATA
            const currentScenes = projectRef?.current?.scenes || [];

            // 1. Generate Prompts if needed
            const missingPrompts = currentScenes.filter(s => !s.promptEn || !s.promptEn.trim()).length;
            if (missingPrompts > 0) {
                setStatus("⚡ Auto-Pilot: 프롬프트 생성 시작...");
                await genAllPrompts(); // This now uses Ref internally
            }

            // 2. Generate Images
            setStatus("⚡ Auto-Pilot: 이미지 생성 시작...");
            await genAllImages(); // This now uses Ref internally

            // Check if images are actually done (Hooks + Bodies)
            const freshScenes = projectRef?.current?.scenes || [];
            const stillMissing = freshScenes.filter(s => s.promptEn?.trim() && !s.imageUrl && !s.videoUrl).length;

            if (stillMissing > 0) {
                setStatus(`⚠️ ${stillMissing}개 장면(Hook/Body) 이미지 생성 실패. Auto-Pilot 일시정지.`);
                return; // Stop here
            }

            // 3. Move to Next Step
            setStatus("⚡ Auto-Pilot: TTS 단계로 이동...");
            await new Promise(r => setTimeout(r, 1000));
            setCurrentStep(5);
        };

        runAuto();
    }, [autoPilotMode]);

    const allScenes = project.scenes;
    const bodyScenes = allScenes.filter(s => s.kind !== "hook");
    const hookScenes = allScenes.filter(s => s.kind === "hook");
    const missingPromptsCount = allScenes.filter(s => !s.promptEn).length;

    const genAllPrompts = async () => {
        // Use Ref for latest scenes
        const currentScenes = projectRef?.current?.scenes || project.scenes;
        if (currentScenes.length === 0) return;

        setGeneratingPrompts(true);
        setBusy("genPrompts", true);
        setStatus("AI가 모든 장면(Hook/Body)의 프롬프트를 작성 중입니다...");

        try {
            const CHUNK_SIZE = 10;
            const chunks = [];
            for (let i = 0; i < currentScenes.length; i += CHUNK_SIZE) {
                chunks.push(currentScenes.slice(i, i + CHUNK_SIZE));
            }

            for (let i = 0; i < chunks.length; i++) {
                const chunkScenes = chunks[i];
                setStatus(`프롬프트 작성 중... (${i + 1}/${chunks.length} 구간)`);

                const res = await fetch(API.OPENAI, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mode: "generate_prompts",
                        scenes: chunkScenes,
                        aspectRatio: projectRef?.current?.settings?.aspectRatio || project.settings.aspectRatio,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "프롬프트 생성 실패");
                }

                const data = await res.json();
                if (data.result) {
                    const parsed = parsePromptResponse(data.result);
                    chunkScenes.forEach((scene, relIdx) => {
                        const prompt = parsed[relIdx + 1];
                        if (prompt) {
                            patchScene(scene.id, { promptEn: prompt });
                        }
                    });
                }
            }
            setStatus("✨ 모든 장면의 프롬프트가 생성되었습니다!");
        } catch (e: any) {
            alert("프롬프트 생성 실패: " + e.message);
        } finally {
            setGeneratingPrompts(false);
            setBusy("genPrompts", false);
        }
    };

    const genImageOne = async (sceneId: string, isVideoPreview = false) => {
        const currentScenes = projectRef?.current?.scenes || project.scenes;
        const scene = currentScenes.find(s => s.id === sceneId);
        if (!scene) return;
        if (!scene.promptEn?.trim()) {
            alert("프롬프트가 비었습니다.");
            return;
        }

        const busyKey = isVideoPreview ? `video:${sceneId}` : `image:${sceneId}`;
        setBusy(busyKey, true);
        setStatus(isVideoPreview ? "Veo AI 비디오 생성중 (약 1분 소요)..." : "이미지 생성중...");

        try {
            if (isVideoPreview) {
                // ✅ Call Veo API for Video
                const res = await fetch(API.VEO, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: scene.promptEn,
                        aspectRatio: project.settings.aspectRatio,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || "Veo 비디오 생성 실패");

                if (data.videoUrl) {
                    patchScene(sceneId, { videoUrl: data.videoUrl, imageUrl: "" });
                    setStatus("Veo 비디오 생성 완료!");
                } else {
                    throw new Error("비디오 URL을 받지 못했습니다.");
                }

            } else {
                // ✅ Existing Logic for Image
                // ✅ Existing Logic: Try Google Imagen First, Fallback to DALL-E
                let rawUrl = "";

                try {
                    const res = await fetch(API.IMAGE, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            prompt: scene.promptEn,
                            aspectRatio: project.settings.aspectRatio,
                            style: project.settings.imageStyle,
                        }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || "이미지 생성 실패");
                    rawUrl = data?.imageUrl || data?.url || data?.dataUrl || "";

                } catch (googleErr: any) {
                    console.warn("Google Imagen Failed", googleErr);

                    if (allowDalle) {
                        setStatus(`⚠️ 구글 실패 -> DALL-E 3(유료)로 전환 중...`);
                        // Fallback to OpenAI DALL-E
                        const res2 = await fetch(API.OPENAI, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                mode: "generate_image",
                                prompt: scene.promptEn,
                                aspectRatio: project.settings.aspectRatio, // Pass AR
                            }),
                        });
                        const data2 = await res2.json();
                        if (!res2.ok) throw new Error(data2?.error || "DALL-E 생성 실패");
                        rawUrl = data2?.imageUrl || "";
                    } else {
                        throw new Error(`구글 무료 이미지 생성 실패 (DALL-E 비활성). 오류: ${googleErr.message}`);
                    }
                }

                if (!rawUrl) throw new Error("이미지 URL을 받지 못했습니다(Google & DALL-E 모두 실패).");

                // ✅ Save to server using FormData (Multipart) to avoid 413 Payload Too Large
                const formData = new FormData();

                // Convert rawUrl (DataURL) to Blob
                const fetchRes = await fetch(rawUrl);
                const blob = await fetchRes.blob();
                formData.append("file", blob);
                formData.append("filename", `gen_${sceneId}.png`);

                const storeRes = await fetch(API.STORE, {
                    method: "POST",
                    body: formData, // No Content-Type header (browser sets it with boundary)
                });

                if (!storeRes.ok) {
                    const errTxt = await storeRes.text();
                    console.error("Image store failed:", errTxt);
                    throw new Error("서버 저장 실패: " + errTxt);
                }

                const storeData = await storeRes.json();
                patchScene(sceneId, { imageUrl: `${storeData.url}&t=${Date.now()}` });
                saveProjectImmediately(); // Force save

                setStatus("이미지 생성 및 저장 완료");
            }
        } catch (err: any) {
            console.error("Image generation error:", err);
            setStatus("⚠️ 생성 실패: " + (err.message || "알 수 없는 오류"));
            // UI 유지를 위해 alert 대신 상태 메시지로만 표시
        } finally {
            setBusy(busyKey, false);
        }
    };

    // Cancellation Ref
    const stopRef = React.useRef(false);

    const cancelGeneration = () => {
        stopRef.current = true;
        setGeneratingAll(false);
        setBusy("allImages", false);
        setStatus("⛔ 이미지 생성이 취소되었습니다.");
    };

    const genAllImages = async () => {
        // Use Ref for latest scenes
        const currentScenes = projectRef?.current?.scenes || project.scenes;

        // Filter scenes that have a prompt but NO image/video
        const scenesToGen = currentScenes.filter(s => {
            const hasPrompt = !!s.promptEn?.trim();
            const hasImage = s.imageUrl && (s.imageUrl.startsWith("http") || s.imageUrl.startsWith("data:") || s.imageUrl.startsWith("/api/"));
            const hasVideo = s.videoUrl && (s.videoUrl.startsWith("http") || s.videoUrl.startsWith("data:") || s.videoUrl.startsWith("/api/"));
            return hasPrompt && !hasImage && !hasVideo;
        });

        if (scenesToGen.length === 0) {
            // In autopilot we call it blindly. Let's return.
            if (!autoPilotMode) {
                alert("생성할 이미지가 없습니다. (프롬프트가 있고 이미지가 없는 씬만 생성)");
            }
            return;
        }

        stopRef.current = false; // Reset stop flag
        setGeneratingAll(true);
        setBusy("allImages", true);

        for (let i = 0; i < scenesToGen.length; i++) {
            if (stopRef.current) break; // Check cancel flag

            const s = scenesToGen[i];
            const isHook = s.kind === 'hook';
            const relativeIdx = isHook
                ? currentScenes.filter(x => x.kind === 'hook').findIndex(x => x.id === s.id) + 1
                : currentScenes.filter(x => x.kind !== 'hook').findIndex(x => x.id === s.id) + 1;

            setStatus(`이미지 생성중... (${i + 1}/${scenesToGen.length}) - ${isHook ? 'Hook (Video)' : 'Body (Image)'} #${relativeIdx}`);

            // ✅ Fix: Generate Video for Hooks, Image for Bodies
            await genImageOne(s.id, isHook);

            // Wait to avoid Rate Limit (Google Imagen: ~10 req/min => 1 req every 6s)
            // Safe margin: 7s
            await new Promise(r => setTimeout(r, 7000));
        }

        setGeneratingAll(false);
        setBusy("allImages", false);
        if (!stopRef.current) {
            setStatus("✅ 모든 프롬프트에 대한 시각 자료 생성이 완료되었습니다.");
        }
    };

    const uploadMedia = async (sceneId: string, file: File) => {
        setBusy(`upload:${sceneId}`, true);
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result || ""));
                r.onerror = reject;
                r.readAsDataURL(file);
            });

            const res = await fetch(API.STORE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataUrl, filename: file.name }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "업로드 실패");

            const url = data?.url || (data?.id ? `${API.FILE}?id=${data.id}` : "");

            const isVideo = file.type.startsWith("video/");
            patchScene(sceneId, isVideo ? { videoUrl: url } : { imageUrl: url });

            setStatus(isVideo ? "비디오 업로드 완료" : "이미지 업로드 완료");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setBusy(`upload:${sceneId}`, false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. 프롬프트 생성 섹션 */}
            <div className={`
                p-6 rounded-2xl border transition-all
                ${missingPromptsCount > 0
                    ? "bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 shadow-sm"
                    : "bg-white border-gray-200 opacity-80 hover:opacity-100"
                }
            `}>
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    1️⃣ AI 프롬프트 작성 (AI Prompt Bot)
                    {missingPromptsCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            {missingPromptsCount} Need
                        </span>
                    )}
                </h2>
                <div className="flex gap-4 items-center">
                    <p className="text-sm text-gray-600 flex-1">
                        Hook(영상용)과 Body(이미지용) 프롬프트를 모두 생성합니다. (캐릭터: Blue-haired Anime Boy)
                    </p>
                    <button
                        onClick={genAllPrompts}
                        disabled={busyAny || allScenes.length === 0}
                        className={`
                            px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap
                            ${missingPromptsCount > 0
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }
                        `}
                    >
                        {generatingPrompts ? "프롬프트 작성 중..." : "✨ 전체 프롬프트 생성"}
                    </button>
                    {/* Emergency Rescue Button */}
                    <button
                        onClick={async () => {
                            if (!confirm("서버에 저장된 이미지가 있는지 확인하고 복구하시겠습니까? (현재 화면의 이미지가 덮어씌워질 수 있습니다)")) return;
                            setBusy("rescue", true);
                            setStatus("♻️ 서버에서 이미지 복구 탐색 중...");
                            let count = 0;
                            await Promise.all(allScenes.map(async (s) => {
                                try {
                                    const targetUrl = `/api/file?id=gen_${s.id}.png`;
                                    const res = await fetch(targetUrl, { method: 'HEAD' });
                                    if (res.ok) {
                                        patchScene(s.id, { imageUrl: `${targetUrl}&t=${Date.now()}` });
                                        count++;
                                    }
                                } catch (e) { }
                            }));
                            setBusy("rescue", false);
                            setStatus(`완료: ${count}개의 이미지를 복구했습니다.`);
                            alert(`복구 완료! ${count}개의 이미지를 찾았습니다.`);
                            saveProjectImmediately();
                        }}
                        disabled={isBusy("rescue")}
                        className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold flex items-center gap-2"
                        title="새로고침으로 날아간 이미지 복구 시도"
                    >
                        ♻️ 잃어버린 이미지 찾기 (Rescue)
                    </button>
                    <button
                        onClick={() => fetch("/api/system/open-folder", { method: "POST" })}
                        className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold flex items-center gap-2"
                        title="이미지 파일이 저장된 폴더 열기"
                    >
                        📂 저장 폴더 열기
                    </button>
                </div>
            </div>

            {/* 2. Body 이미지 생성 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    2️⃣ Body 이미지 생성 (Image Generation)
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{bodyScenes.length} Scenes</span>
                </h2>

                {/* Style Selector */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {IMAGE_STYLES.map(style => (
                        <button
                            key={style.id}
                            onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, imageStyle: style.id } }))}
                            className={`
                                flex-shrink-0 px-4 py-3 rounded-lg border text-center transition-all min-w-[100px]
                                ${project.settings.imageStyle === style.id
                                    ? "border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                }
                            `}
                        >
                            <div className="text-xl mb-1">{style.icon}</div>
                            <div className="text-xs font-bold">{style.name}</div>
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={genAllImages}
                        disabled={busyAny || bodyScenes.length === 0}
                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-200"
                    >
                        {generatingAll ? "전체 Body 이미지 생성중..." : `🖼️ Body 이미지 일괄 생성 (${bodyScenes.filter(s => !s.imageUrl && s.promptEn).length}개 대기)`}
                    </button>
                    {generatingAll && (
                        <button
                            onClick={cancelGeneration}
                            className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg"
                        >
                            ⛔ 중단
                        </button>
                    )}
                </div>
            </div>

            {/* 3. Hook 비디오 생성 (New Section) */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 text-white">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    3️⃣ Hook 비디오 생성 (Video Generation)
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{hookScenes.length} Scenes</span>
                </h2>
                <p className="text-sm text-gray-300 mb-6">
                    훅 파트는 영상 리텐션에 가장 중요합니다. 고품질 비디오를 업로드하거나 AI로 생성(프리뷰)하세요.
                </p>

                <div className="grid gap-3">
                    {hookScenes.map((scene, idx) => (
                        <div key={scene.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex gap-4 items-center">
                            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center overflow-hidden border border-gray-600">
                                {scene.videoUrl ? (
                                    <video src={scene.videoUrl} className="w-full h-full object-cover" />
                                ) : scene.imageUrl ? (
                                    <img src={scene.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">🎬</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-blue-300 font-bold mb-1">HOOK #{idx + 1}</div>
                                <div className="text-xs text-gray-300 truncate">{scene.ko1} {scene.ko2}</div>
                                <div className="text-[10px] text-gray-500 truncate mt-1">{scene.promptEn}</div>
                            </div>
                            <div className="flex gap-2">
                                {(scene.videoUrl || scene.imageUrl) && (
                                    <button
                                        onClick={() => downloadImage(scene.videoUrl || scene.imageUrl, `hook_${idx + 1}.${scene.videoUrl ? 'mp4' : 'png'}`)}
                                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors text-white"
                                        title="다운로드"
                                    >
                                        ⬇️
                                    </button>
                                )}
                                <button
                                    onClick={() => genImageOne(scene.id, true)}
                                    disabled={isBusy(`video:${scene.id}`)}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors"
                                >
                                    AI 생성
                                </button>
                                <label className="cursor-pointer px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold transition-colors">
                                    업로드
                                    <input type="file" accept="video/*,image/*" className="hidden"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) uploadMedia(scene.id, f);
                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    ))}
                    {hookScenes.length === 0 && (
                        <div className="text-center text-gray-500 py-4">훅 장면이 없습니다. Step 2/3에서 추가해주세요.</div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={async () => {
                            if (hookScenes.length === 0) return;
                            const missing = hookScenes.findIndex(s => !s.videoUrl && !s.imageUrl);
                            if (missing >= 0) {
                                alert(`훅 ${missing + 1}번에 이미지/비디오가 없습니다.`);
                                return;
                            }

                            setBusy("renderHook", true);
                            setStatus("훅 영상 합성중...");
                            try {
                                const res = await fetch(API.RENDER, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    // Use current project state
                                    body: JSON.stringify({ ...project, scenes: hookScenes }),
                                });
                                if (!res.ok) throw new Error(await res.text());

                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);

                                // We need to access setHookFinalUrl which is not currently destructured
                                // But we can verify if we added it to context usage
                                // Let's assume we will add it to context destructuring above
                                // Actually wait, let's open the video in a new tab or modal? 
                                // Since we are not in VideoRendering tab, showing it might be tricky unless we add a modal preview.
                                // For now, let's just alert and open it.
                                window.open(url, "_blank");
                                setStatus("훅 합성 완료 (새 탭에서 열림)");
                            } catch (err: any) {
                                alert(err.message);
                                setStatus("합성 실패");
                            } finally {
                                setBusy("renderHook", false);
                            }
                        }}
                        disabled={isBusy("renderHook") || hookScenes.length === 0}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <span>⚡ 훅 바로 합성해보기 (Preview)</span>
                    </button>
                </div>
            </div>

            {/* 상세 씬 관리 (Body Only Display logic or Full List) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">상세 씬 관리 (Body)</h3>
                    <div className="text-sm text-gray-500">
                        완료: <span className="text-green-600 font-bold">{bodyScenes.filter(s => s.imageUrl).length}</span> / {bodyScenes.length}
                    </div>
                </div>

                {bodyScenes.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        Body 씬이 없습니다.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {bodyScenes.map((scene, idx) => (
                            <div key={scene.id} className="bg-white rounded-xl border border-gray-200 p-3 hover:border-purple-300 transition-all shadow-sm">
                                <div className="flex gap-4">
                                    {/* Left: Preview (Fixed Width) */}
                                    <div className="flex-shrink-0 w-32 min-w-[128px] flex flex-col gap-1">
                                        <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden relative group border border-gray-200">
                                            {/* Image/Video Preview */}
                                            {scene.videoUrl ? (
                                                <video src={scene.videoUrl} className="w-full h-full object-contain" />
                                            ) : scene.imageUrl ? (
                                                <img src={scene.imageUrl} alt="" className="w-full h-full object-contain shadow-sm" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                                                    <span className="text-2xl">🖼️</span>
                                                    <span className="text-[10px] mt-1">No Image</span>
                                                </div>
                                            )}

                                            {/* Overlay Actions (No Darkening) */}
                                            <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1">
                                                <label className="cursor-pointer p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="업로드">
                                                    📂
                                                    <input type="file" accept="image/*" className="hidden"
                                                        onChange={e => {
                                                            const f = e.target.files?.[0];
                                                            if (f) uploadMedia(scene.id, f);
                                                            e.target.value = "";
                                                        }}
                                                    />
                                                </label>
                                                {(scene.imageUrl || scene.videoUrl) && (
                                                    <button
                                                        onClick={() => downloadImage(scene.imageUrl || scene.videoUrl, `body_${idx + 1}.${scene.videoUrl ? 'mp4' : 'png'}`)}
                                                        className="p-2 bg-green-600/80 hover:bg-green-600 text-white rounded-full backdrop-blur-sm"
                                                        title="다운로드"
                                                    >
                                                        ⬇️
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => genImageOne(scene.id)}
                                                    disabled={isBusy(`image:${scene.id}`)}
                                                    className="p-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-full backdrop-blur-sm"
                                                    title="재생성"
                                                >
                                                    🔄
                                                </button>
                                            </div>
                                        </div>

                                        {/* Audio Player (Mini) */}
                                        {scene.audioUrl ? (
                                            <audio controls src={scene.audioUrl} className="w-full h-6 block" />
                                        ) : (
                                            <div className="h-6 flex items-center justify-center bg-gray-50 rounded text-[10px] text-gray-400">
                                                🔇 오디오 없음 (Step 5 확인)
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Content & Prompt */}
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        {/* Header Info */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                                    BODY #{idx + 1}
                                                </span>
                                                {/* Start Recovery Button (Only visible if prompt exists but no image) */}
                                                {!scene.imageUrl && scene.promptEn && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            // Try to check if file exists
                                                            const tryUrl = `/api/file?id=gen_${scene.id}.png`;
                                                            const check = await fetch(tryUrl);
                                                            if (check.ok) {
                                                                patchScene(scene.id, { imageUrl: tryUrl });
                                                                alert("이미지 복구 성공!");
                                                            } else {
                                                                alert("서버에 저장된 이미지가 없습니다.");
                                                            }
                                                        }}
                                                        className="text-[10px] bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded text-gray-600"
                                                    >
                                                        ♻️ 복구 시도
                                                    </button>
                                                )}
                                                <span className="text-xs text-gray-500 font-medium truncate max-w-[300px]">
                                                    {[scene.ko1, scene.ko2, scene.ko3, scene.ko4].filter(Boolean).join(" ")}
                                                </span>
                                            </div>
                                            {(scene.imageUrl || scene.videoUrl) && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Generated</span>
                                            )}
                                        </div>

                                        {/* Prompt Input (Full Height) */}
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={scene.promptEn || ""}
                                                onChange={e => patchScene(scene.id, { promptEn: e.target.value })}
                                                className="w-full h-full p-3 rounded-lg border border-gray-200 text-xs font-mono resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50/50"
                                                placeholder="AI 프롬프트 생성 버튼을 누르면 자동으로 채워집니다..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
