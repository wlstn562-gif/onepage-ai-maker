"use client";
import React, { useState, useEffect } from "react";
import { useVideoContext, ShortClip, Scene, uid } from "../context/VideoContext";

export default function ShortsGenerator() {
    const { project, setProject, isBusy, setBusy, setStatus, bodyScript } = useVideoContext();

    // Local UI State
    const [isBatchGenerating, setIsBatchGenerating] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    // Initial Split (Legacy or New)
    const generateMultiShorts = async () => {
        if (!project.scenes.length && !bodyScript) {
            alert("대본이 없습니다. 먼저 대본을 작성해주세요.");
            return;
        }

        setBusy("shortsSplit", true);
        setStatus("AI가 대본을 분석하여 6개의 숏스 포인트를 추출중입니다...");

        try {
            const fullScript = bodyScript || project.scenes.map(s => s.ko1 + " " + s.ko2).join("\n");

            const res = await fetch("/api/shorts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "split", script: fullScript }),
            });

            const data = await res.json();
            if (data.shorts) {
                // Initialize ShortClips
                const newClips: ShortClip[] = data.shorts.map((s: any, idx: number) => ({
                    id: `S${idx + 1}`,
                    status: "idle",
                    title: s.title,
                    hook: s.hook,
                    summary: s.summary,
                    duration: s.duration,
                    renderStatus: "idle",
                    progress: 0,
                }));

                setProject(p => ({ ...p, shortClips: newClips }));
                setStatus("분석 완료! 6개의 숏스 플랜이 생성되었습니다.");
            }
        } catch (e) {
            console.error(e);
            alert("분석 실패");
        } finally {
            setBusy("shortsSplit", false);
        }
    };

    // Generate Single Short (Detailed Plan)
    const generateShortPlan = async (clipId: string, force = false) => {
        const clipInd = (project.shortClips || []).findIndex(c => c.id === clipId);
        if (clipInd === -1) return;

        const clip = project.shortClips![clipInd];
        if (!force && clip.status === "ready") return; // Already done

        // Update Status
        updateClip(clipId, { status: "generating" });
        setStatus(`숏스 #${clipId} 상세 기획 생성중...`);
        setBusy(`gen_${clipId}`, true);

        try {
            const fullScript = bodyScript || project.scenes.map(s => s.ko1 + " " + s.ko2).join("\n");

            const res = await fetch("/api/shorts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "generate_plan",
                    concept: { title: clip.title, hook: clip.hook, summary: clip.summary },
                    fullScript
                }),
            });

            const plan = await res.json();
            if (plan.error) throw new Error(plan.error);

            // Save Result
            updateClip(clipId, {
                status: "ready",
                scriptKo: plan.scriptKo,
                captions: plan.captions,
                scenes: plan.scenes,
                thumbnailTextCandidates: plan.thumbnailTextCandidates,
                audioPlan: plan.audioPlan,
            });

            setStatus(`숏스 #${clipId} 기획 완료!`);

        } catch (e) {
            console.error(e);
            updateClip(clipId, { status: "error" });
            alert(`숏스 #${clipId} 생성 실패`);
        } finally {
            setBusy(`gen_${clipId}`, false);
        }
    };

    // Helper to Update Clip
    const updateClip = (id: string, patch: Partial<ShortClip>) => {
        setProject(p => ({
            ...p,
            shortClips: (p.shortClips || []).map(c => c.id === id ? { ...c, ...patch } : c)
        }));
    };

    // Batch Generate
    const handleBatchGenerate = async () => {
        if (!project.shortClips?.length) return;
        setIsBatchGenerating(true);

        // Sequence
        for (const clip of project.shortClips) {
            if (clip.status === "idle" || clip.status === "error") {
                await generateShortPlan(clip.id);
            }
        }
        setIsBatchGenerating(false);
        setStatus("일괄 생성 완료!");
    };

    // --- RENDER LOGIC ---
    const [renderJobId, setRenderJobId] = useState<string | null>(null);
    const [renderProgress, setRenderProgress] = useState<any>(null); // { status, progress, logs, videoUrl }

    // Poll Status
    useEffect(() => {
        if (!renderJobId) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/shorts/render?id=${renderJobId}`);
                if (res.ok) {
                    const status = await res.json();
                    setRenderProgress(status);

                    if (status.status === "done" && status.videoUrl) {
                        clearInterval(interval);
                        // Save to Project
                        if (status.clipId) {
                            updateClip(status.clipId, {
                                renderStatus: "done",
                                finalVideoUrl: status.videoUrl
                            });
                        }
                    } else if (status.status === "error") {
                        clearInterval(interval);
                    }
                }
            } catch (e) { console.error(e); }
        }, 1000); // 1 sec poll
        return () => clearInterval(interval);
    }, [renderJobId]);

    const startAutoRender = async (clipId: string) => {
        const clip = project.shortClips?.find(c => c.id === clipId);
        if (!clip) return;

        // Show Modal
        setRenderProgress({ status: "queued", progress: 0, logs: ["Adding to Queue..."], clipId: clip.id });
        updateClip(clipId, { renderStatus: "queued" });

        try {
            const res = await fetch("/api/shorts/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clip,
                    projectId: project.settings.voiceId || "default", // Using voiceId as weak ID for now or timestamp
                    host: window.location.origin, // Important for server-side fetches
                    settings: project.settings
                }),
            });
            const data = await res.json();
            if (data.jobId) {
                setRenderJobId(data.jobId);
                updateClip(clipId, { renderStatus: "rendering" });
            } else {
                alert("렌더링 시작 실패");
            }
        } catch (e) {
            console.error(e);
            alert("렌더링 요청 에러");
        }
    };

    // Helper check
    const isRendering = (clipId: string) => renderProgress && renderProgress.clipId === clipId && renderProgress.status !== "done" && renderProgress.status !== "error";

    // Inject to Main Pipeline (The Core Feature)
    const injectToPipeline = (clipId: string) => {
        const clip = project.shortClips?.find(c => c.id === clipId);
        if (!clip || clip.status !== "ready") {
            alert("준비된 데이터가 없습니다. 먼저 생성해주세요.");
            return;
        }

        if (!confirm("현재 프로젝트 내용을 지우고, 이 숏스 기획을 메인 파이프라인에 덮어씌우시겠습니까?")) return;

        // Convert ShortClip scenes to Main Scenes
        const newScenes: Scene[] = (clip.scenes || []).map(s => ({
            id: uid(),
            kind: "body", // All are body segments in 10-step pipeline
            ko1: s.promptEn.includes("Create") ? "" : "Visual Scene", // Placeholder
            ko2: "", ko3: "", ko4: "",
            promptEn: s.promptEn,
            videoUrl: "", imageUrl: "", audioUrl: "",
            durationSec: s.durationSec,
            // We lose specific mapping of text-to-scene here unless we align captions, 
            // but for "Pipeline Injection", we mostly care about Visuals & Audio.
        }));

        // Also inject Hook Scene from title? 
        // Better: Map captions to scenes if possible. 
        // For simplicity: Just push scenes and let user edit text in Step 3/4.

        setProject(p => ({
            ...p,
            scenes: newScenes,
            settings: {
                ...p.settings,
                voiceId: clip.audioPlan?.voiceId || p.settings.voiceId,
                aspectRatio: "9:16", // Force Shorts Ratio
                shortsLength: parseInt(clip.duration) || 60,
            },
            // Inject Script to bodyScript for reference
            bodyScript: clip.scriptKo || "",
        }));

        alert("메인 파이프라인에 주입되었습니다! 각 탭(이미지, 영상, TTS)에서 바로 생성/렌더할 수 있습니다.");
    };

    const hasClips = (project.shortClips?.length || 0) > 0;

    // Modal Component (Inline)
    const RenderModal = () => {
        if (!renderProgress || renderProgress.status === "done" || !renderJobId) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">🚀 원클릭 자동 렌더링 중...</h3>
                        {renderProgress.status === "error" && (
                            <button onClick={() => setRenderJobId(null)} className="text-gray-400 hover:text-red-500">✕</button>
                        )}
                    </div>

                    {renderProgress.status === "error" ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-4">
                            ❌ 오류 발생: {renderProgress.error || "렌더링 실패"}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Progress Bar */}
                            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                                    style={{ width: `${renderProgress.progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-500 px-1">
                                <span>진행률</span>
                                <span>{renderProgress.progress}%</span>
                            </div>

                            {/* Steps Badge */}
                            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-center">
                                {["planning", "visuals", "tts", "rendering"].map((step) => {
                                    const stepMap: Record<string, number> = { init: 0, planning: 1, visuals: 2, tts: 3, rendering: 4, done: 5 };
                                    const currentStepVal = stepMap[renderProgress.step] || 0;
                                    const myStepVal = stepMap[step];
                                    const isActive = renderProgress.step === step;
                                    const isDone = currentStepVal > myStepVal;

                                    return (
                                        <div key={step} className={`p-2 rounded border ${isDone ? "bg-green-100 text-green-700 border-green-200" : isActive ? "bg-blue-100 text-blue-700 border-blue-200 animate-pulse" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                            {step.toUpperCase()}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Logs */}
                            <div className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded-lg h-24 overflow-y-auto">
                                {renderProgress.logs?.map((log: string, i: number) => (
                                    <div key={i}>&gt; {log}</div>
                                ))}
                                {renderProgress.status === "processing" && <div className="animate-pulse">&gt; ...</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 relative">
            <RenderModal />

            {/* Header / Splitter */}
            <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-2xl border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity"><span className="text-6xl">✨</span></div>
                <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2 relative z-10"><span className="text-2xl">✂️</span> AI 롱폼 → 숏스 6개 변환기</h2>
                <p className="text-indigo-200 text-sm mb-6 relative z-10 max-w-lg">긴 대본을 분석하여 바이럴 가능성이 높은 6개의 숏스 포인트를 추출하고, <strong>즉시 제작 파이프라인</strong>으로 연결합니다.</p>

                {!hasClips ? (
                    <button
                        onClick={generateMultiShorts}
                        disabled={isBusy("shortsSplit")}
                        className="relative z-10 px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 hover:scale-105 transition-all shadow-lg flex items-center gap-3 disabled:opacity-50"
                    >
                        {isBusy("shortsSplit") ? (
                            <><span className="animate-spin text-xl">💫</span><span>분석중...</span></>
                        ) : (
                            <><span className="text-xl">🚀</span><span>대본 분석 & 6개 숏스 추출</span></>
                        )}
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={handleBatchGenerate}
                            disabled={isBatchGenerating}
                            className="relative z-10 px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-400 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {isBatchGenerating ? <span className="animate-spin">💫</span> : "⚡"} 6개 일괄 생성 (Batch)
                        </button>
                        <button
                            onClick={() => {
                                if (confirm("초기화하시겠습니까?")) setProject(p => ({ ...p, shortClips: undefined }));
                            }}
                            className="relative z-10 px-4 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all"
                        >
                            🔄 초기화
                        </button>
                    </div>
                )}
            </div>

            {/* Clips List */}
            {hasClips && (
                <div className="grid gap-6">
                    {project.shortClips!.map((clip) => {
                        const isExpanded = expandedCardId === clip.id;
                        const isReady = clip.status === "ready";
                        const isGen = clip.status === "generating";

                        // Render Result
                        const hasVideo = !!clip.finalVideoUrl;

                        return (
                            <div key={clip.id} className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${isExpanded ? "border-indigo-500 shadow-xl" : "border-gray-200"}`}>
                                {/* Card Header */}
                                <div
                                    className="p-5 flex justify-between items-start cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedCardId(isExpanded ? null : clip.id)}
                                >
                                    <div className="flex gap-4 items-center">
                                        {/* Status Dot */}
                                        <div className={`w-3 h-3 rounded-full ${hasVideo ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-300"}`} />
                                        {/* ... */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${hasVideo ? "bg-green-100 text-green-600" : isReady ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                                            {clip.id}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{clip.title}</h3>
                                            <p className="text-gray-500 text-xs mt-1 max-w-xl truncate">{clip.hook}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{clip.duration}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${isReady ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                                            {isReady ? "준비됨" : isGen ? "생성중..." : "대기"}
                                        </span>
                                        <span className="text-gray-400 text-xl transform transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                                            ▼
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="p-5 border-t border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-2">
                                        {!isReady ? (
                                            // ... Generate Btn ...
                                            <div className="flex flex-col items-center py-8 text-center">
                                                <p className="text-gray-500 mb-4 text-sm">대본, 자막, 씬 프롬프트가 아직 생성되지 않았습니다.</p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); generateShortPlan(clip.id, true); }}
                                                    disabled={isGen}
                                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    {isGen ? "생성중..." : "✨ 상세 기획 생성하기"}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {/* RESULT VIDEO PLAYER */}
                                                {hasVideo && (
                                                    <div className="bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-indigo-500 p-1 mb-6">
                                                        <video src={clip.finalVideoUrl} controls className="w-full aspect-[9/16] max-h-[500px] mx-auto rounded-lg bg-gray-800" />
                                                        <div className="flex justify-center gap-4 py-2 bg-gray-900 border-t border-gray-800">
                                                            <a href={clip.finalVideoUrl} download={`short_${clip.id}.mp4`} className="text-green-400 text-sm font-bold hover:underline">📥 다운로드</a>
                                                            <button onClick={() => startAutoRender(clip.id)} className="text-gray-400 text-sm font-bold hover:text-white">🔄 다시 렌더하기</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Details (Script etc) - Hide if Video Done to save space? No, keep it. */}
                                                {/* 1. Script & Captions */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Script Idea</h4>
                                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed h-32 overflow-y-auto scrollbar-thin">
                                                            {clip.scriptKo}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Visual Scenes ({clip.scenes?.length})</h4>
                                                        <div className="space-y-2 h-32 overflow-y-auto scrollbar-thin">
                                                            {clip.scenes?.map((s, i) => (
                                                                <div key={i} className="flex gap-2 text-xs items-center">
                                                                    <span className={`w-12 px-1 py-0.5 rounded text-center ${s.type === "video" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                                                                        {s.type}
                                                                    </span>
                                                                    <span className="text-gray-400 font-mono">{s.durationSec}s</span>
                                                                    <span className="text-gray-700 truncate flex-1">{s.promptEn}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Thumbnail Candidates */}
                                                {clip.thumbnailTextCandidates && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Thumbnail Text Suggestions</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {clip.thumbnailTextCandidates.map((txt, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => updateClip(clip.id, { selectedThumbnailText: txt })}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${clip.selectedThumbnailText === txt ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}
                                                                >
                                                                    {txt}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 3. Actions */}
                                                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                                                    <button
                                                        onClick={() => injectToPipeline(clip.id)}
                                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200"
                                                    >
                                                        <span>💉</span> 파이프라인으로 보내기 (수동 편집)
                                                    </button>

                                                    <button
                                                        onClick={() => startAutoRender(clip.id)}
                                                        disabled={renderJobId !== null && renderProgress?.clipId !== clip.id}
                                                        className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold hover:from-red-500 hover:to-pink-500 shadow-lg shadow-red-500/30 flex items-center gap-2 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isRendering(clip.id) ? (
                                                            <><span className="animate-spin">⚙️</span> 렌더링 중...</>
                                                        ) : (
                                                            <><span className="text-xl">🎬</span> 원클릭 자동 렌더</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
