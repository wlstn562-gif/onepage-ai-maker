"use client";
import React, { useState, useEffect } from "react";
import { useVideoContext, ELEVEN_VOICES } from "../context/VideoContext";

export default function TTSGeneration() {
    const { project, setProject, patchScene, API, setStatus, isBusy, setBusy, busyAny, projectRef, autoPilotMode, setAutoPilotMode, setCurrentStep } = useVideoContext();
    const [generatingAll, setGeneratingAll] = useState(false);

    // Auto-Pilot Effect
    useEffect(() => {
        if (!autoPilotMode) return;
        const runAuto = async () => {
            await new Promise(r => setTimeout(r, 1000));
            setStatus("⚡ Auto-Pilot: 전체 TTS 생성 시작...");
            const success = await genAllTts();

            if (success) {
                setStatus("⚡ Auto-Pilot: 렌더링 단계로 이동...");
                await new Promise(r => setTimeout(r, 1000));
                setCurrentStep(6);
            } else {
                setAutoPilotMode(false); // Stop if failed
                alert("❌ TTS 생성 중 일부 오류가 발생하여 Auto-Pilot을 일시 중단합니다.\n미생성된 오디오를 확인해주세요.");
            }
        };
        runAuto();
    }, [autoPilotMode]);

    const allScenes = project.scenes;
    const scenesWithText = allScenes.filter(s => s.ko1 || s.ko2 || s.ko3 || s.ko4);
    const scenesWithAudio = allScenes.filter(s => s.audioUrl);

    const genTtsOne = async (sceneId: string) => {
        const scene = projectRef.current.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const parts = [scene.ko1, scene.ko2, scene.ko3, scene.ko4].filter(Boolean);
        if (parts.length === 0) {
            // In auto mode, just warn/skip instead of alert blocker?
            // Alert is fine for now as it indicates bad data.
            alert("자막이 비었습니다 (ko1~ko4)");
            return;
        }

        const text = parts.join(' ');

        setBusy(`tts:${sceneId}`, true);
        setStatus("TTS 생성중...");

        try {
            const res = await fetch(API.TTS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    voiceId: projectRef.current.settings.voiceId,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "TTS 생성 실패");

            const rawUrl = data?.audioDataUrl || data?.data?.audioDataUrl || "";
            if (!rawUrl || !rawUrl.startsWith("data:audio/")) {
                throw new Error("TTS 응답에 오디오가 없습니다");
            }

            // ✅ Save to server
            const storeRes = await fetch(API.STORE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataUrl: rawUrl, filename: `tts_${sceneId}.mp3` }),
            });
            const storeData = await storeRes.json();
            const finalUrl = storeData.url || rawUrl;

            patchScene(sceneId, { audioUrl: `${finalUrl}&t=${Date.now()}` });
            setStatus("TTS 생성 및 저장 완료");
        } catch (err: any) {
            // alert(err.message); // Suppress alert in auto-pilot? better to show status
            console.error(err);
            setStatus("TTS 생성 실패");
        } finally {
            setBusy(`tts:${sceneId}`, false);
        }
    };

    // ✅ Auto-Recovery for TTS
    useEffect(() => {
        const checkServerAssets = async () => {
            let recoveredCount = 0;
            const newScenes = [...project.scenes];
            let changed = false;

            for (const scene of newScenes) {
                // If text exists but audio is missing, check server for recovery
                if ((scene.ko1 || scene.ko2) && (!scene.audioUrl || scene.audioUrl.trim() === "")) {
                    const filename = `tts_${scene.id}.mp3`;
                    try {
                        // Check if file exists on server
                        const res = await fetch(`${API.FILE}?id=${filename}`, { method: 'HEAD' });
                        if (res.ok) {
                            const recoveredUrl = `${API.FILE}?id=${filename}`;
                            scene.audioUrl = recoveredUrl;
                            changed = true;
                            recoveredCount++;
                        }
                    } catch (e) {
                        // Ignore error, file just doesn't exist
                    }
                }
            }

            if (changed) {
                console.log(`♻️ Recovered ${recoveredCount} missing TTS audio files!`);
                // patchScene("ALL", { scenes: newScenes }); // Bulk update helper or just setProject?
                // patchScene only handles one ID usually.
                // We need to update all.
                setProject(prev => ({ ...prev, scenes: newScenes }));
                setStatus(`♻️ 기존 오디오 ${recoveredCount}개 복구 완료`);
            }
        };

        if (project?.scenes?.length > 0) {
            checkServerAssets();
        }
    }, []); // Run once on mount

    const genAllTts = async () => {
        // ... (Existing Logic)
        const scenesToGen = allScenes.filter(s =>
            (s.ko1 || s.ko2 || s.ko3 || s.ko4) &&
            (!s.audioUrl || s.audioUrl.trim() === "") // Strict check
        );

        if (scenesToGen.length === 0) {
            console.log("Values skipped: All audio exists.");
            return true;
        }

        console.log(`Generating TTS for ${scenesToGen.length} scenes...`);

        setGeneratingAll(true);
        setBusy("allTts", true);

        for (let i = 0; i < scenesToGen.length; i++) {
            const s = scenesToGen[i];
            // Double check current state in case it was updated in parallel?
            // Accessing strict latest state is hard without ref, but `scenesToGen` is a snapshot.

            const isHook = s.kind === 'hook';
            const relativeIdx = isHook
                ? projectRef.current.scenes.filter(x => x.kind === 'hook').findIndex(x => x.id === s.id) + 1
                : projectRef.current.scenes.filter(x => x.kind !== 'hook').findIndex(x => x.id === s.id) + 1;

            setStatus(`TTS 생성중... (${i + 1}/${scenesToGen.length}) - ${isHook ? 'Hook' : 'Body'} #${relativeIdx}`);
            await genTtsOne(scenesToGen[i].id);
            // Rate Limit Protection
            await new Promise(r => setTimeout(r, 1000));
        }

        setGeneratingAll(false);
        setBusy("allTts", false);

        const stillMissing = projectRef.current.scenes.filter(s => (s.ko1 || s.ko2) && !s.audioUrl).length;
        if (stillMissing > 0) {
            setStatus(`⚠️ ${stillMissing}개 장면의 오디오 생성 실패.`);
            return false;
        }

        setStatus(`${scenesToGen.length}개 TTS 생성 완료!`);
        return true;
    };

    return (
        <div className="space-y-8">
            {/* 목소리 선택 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🎤 목소리 선택
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ELEVEN_VOICES.map(voice => (
                        <button
                            key={voice.id}
                            onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, voiceId: voice.id } }))}
                            className={`
                p-4 rounded-xl border-2 transition-all text-left
                ${project.settings.voiceId === voice.id
                                    ? "border-purple-500 bg-purple-50"
                                    : "border-gray-200 hover:border-purple-200 bg-white"
                                }
              `}
                        >
                            <div className={`text-sm font-medium ${project.settings.voiceId === voice.id ? "text-purple-700" : "text-gray-700"}`}>
                                {voice.name}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 전체 생성 버튼 */}
            <div className="flex gap-4">
                <button
                    onClick={genAllTts}
                    disabled={busyAny || scenesWithText.length === 0}
                    className="flex-1 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50"
                >
                    {generatingAll ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            전체 TTS 생성중...
                        </span>
                    ) : (
                        `🔊 전체 TTS 생성 (${scenesWithText.filter(s => !s.audioUrl).length}개)`
                    )}
                </button>
            </div>

            {/* TTS 현황 */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl border border-green-100 p-6">
                <h3 className="text-base font-bold text-green-700 mb-4">📊 TTS 생성 현황</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{scenesWithText.length}</div>
                        <div className="text-xs text-gray-500">자막 있음</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">{scenesWithAudio.length}</div>
                        <div className="text-xs text-gray-500">생성됨</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-500">{scenesWithText.filter(s => !s.audioUrl).length}</div>
                        <div className="text-xs text-gray-500">미생성</div>
                    </div>
                </div>
            </div>

            {/* 씬별 TTS 관리 */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">씬별 TTS 관리</h3>

                {allScenes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        먼저 대본을 작성해주세요 (Tab 2: 대본 기획)
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {allScenes.map((scene, idx) => (
                            <div key={scene.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-4 items-center justify-between">
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${scene.kind === "hook" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                                    {(() => {
                                                        // Calculate relative index dynamically
                                                        const relativeIdx = scene.kind === "hook"
                                                            ? allScenes.filter(s => s.kind === "hook").findIndex(s => s.id === scene.id) + 1
                                                            : allScenes.filter(s => s.kind !== "hook").findIndex(s => s.id === scene.id) + 1;
                                                        return `${scene.kind === "hook" ? "HOOK" : "BODY"} #${relativeIdx}`;
                                                    })()}
                                                </span>
                                                {scene.audioUrl && (
                                                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">오디오 있음</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {[scene.ko1, scene.ko2, scene.ko3, scene.ko4].filter(Boolean).join(" / ") || "자막 없음"}
                                            </p>
                                        </div>

                                        {/* Action */}
                                        <button
                                            onClick={() => genTtsOne(scene.id)}
                                            disabled={isBusy(`tts:${scene.id}`) || !(scene.ko1 || scene.ko2 || scene.ko3 || scene.ko4)}
                                            className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {isBusy(`tts:${scene.id}`) ? "생성중..." : scene.audioUrl ? "재생성" : "생성"}
                                        </button>
                                    </div>

                                    {/* Audio Player (Full Width) */}
                                    {scene.audioUrl && (
                                        <div className="w-full bg-gray-50 rounded-lg p-2 flex items-center gap-2 border border-gray-100">
                                            <span className="text-lg">🔊</span>
                                            <audio src={scene.audioUrl} controls className="w-full h-8" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
