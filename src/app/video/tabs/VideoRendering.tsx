"use client";
import React, { useState, useEffect } from "react";
import { useVideoContext, ELEVEN_VOICES } from "../context/VideoContext";

function isVideoSrc(src: string) {
    return src?.startsWith("blob:") || /data:\s*video/i.test(src) || src?.endsWith(".mp4") || src?.startsWith("/api/file") || src?.startsWith("http");
}
function isImageSrc(src: string) {
    return /data:\s*image/i.test(src) || src?.startsWith("/api/file") || src?.startsWith("http") || src?.startsWith("blob:");
}
function hasVisual(s: any) {
    return (s.videoUrl && isVideoSrc(s.videoUrl)) || (s.imageUrl && isImageSrc(s.imageUrl));
}
function hasAudio(s: any) {
    return s.audioUrl && (s.audioUrl.startsWith("data:audio/") || s.audioUrl.startsWith("/api/file") || s.audioUrl.startsWith("http") || s.audioUrl.startsWith("blob:"));
}

async function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}

export default function VideoRendering() {
    const {
        project, setProject, projectRef,
        API, setStatus,
        isBusy, setBusy, busyAny,
        hookFinalUrl, setHookFinalUrl,
        finalVideoUrl, setFinalVideoUrl,
        autoPilotMode, setAutoPilotMode,
        setCurrentStep
    } = useVideoContext();

    const hookScenes = project.scenes.filter(s => s.kind === "hook");
    const bodyScenes = project.scenes.filter(s => s.kind === "body");
    const allScenes = project.scenes;

    const readyHooks = hookScenes.filter(s => hasVisual(s));
    const readyBodies = bodyScenes.filter(s => hasVisual(s));
    const allReady = allScenes.filter(s => hasVisual(s));

    // Auto-Pilot Effect: Trigger Render
    useEffect(() => {
        if (!autoPilotMode) return;

        const runAuto = async () => {
            await new Promise(r => setTimeout(r, 1000));

            // ✅ Auto-Healing Check
            const missingVisual = project.scenes.findIndex(s => !hasVisual(s));
            if (missingVisual >= 0) {
                setStatus(`⚠️ ${missingVisual + 1}번 장면 이미지/비디오 누락. Step 4(이미지 생성)로 이동하여 복구합니다...`);
                await new Promise(r => setTimeout(r, 2000));
                setCurrentStep(4); // Go to Image Gen
                return;
            }

            const missingAudio = project.scenes.findIndex(s => !hasAudio(s));
            if (missingAudio >= 0) {
                setStatus(`⚠️ ${missingAudio + 1}번 장면 오디오 누락. Step 5(TTS 생성)로 이동하여 복구합니다...`);
                await new Promise(r => setTimeout(r, 2000));
                setCurrentStep(5); // Go to TTS Gen
                return;
            }

            setStatus("⚡ Auto-Pilot: 전체 영상 렌더링 시작...");
            // Wait for renderAll to complete
            await renderAll();
            // renderAll sets finalVideoUrl asynchronously.
        };
        runAuto();
    }, [autoPilotMode]);

    // Auto-Pilot Effect: Download and Finish
    useEffect(() => {
        if (autoPilotMode && finalVideoUrl) {
            const finishAuto = async () => {
                setStatus("⚡ Auto-Pilot: 다운로드 준비 중...");
                await new Promise(r => setTimeout(r, 1000));

                // Trigger Download
                const a = document.createElement("a");
                a.href = finalVideoUrl;
                a.download = `video_${project.topic}_FINAL.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Finish
                setAutoPilotMode(false);
                setStatus("✨ Auto-Pilot 완료!");
                alert("✨✨✨ 자동 생성이 완료되었습니다! 다운로드 폴더를 확인하세요. ✨✨✨");
            };
            finishAuto();
        }
    }, [finalVideoUrl, autoPilotMode]);

    // State for Hook Generator
    const [hookTopic, setHookTopic] = useState(project.topic || "");
    const [hookResult, setHookResult] = useState("");
    const [generatingHook, setGeneratingHook] = useState(false);

    // State for VEO
    const [veoPrompt, setVeoPrompt] = useState("");

    const generateHookScenarios = async () => {
        if (!hookTopic.trim()) { alert("주제를 입력해주세요"); return; }
        setGeneratingHook(true);
        setStatus("AI가 훅 비디오 시나리오를 구상중...");

        try {
            const res = await fetch(API.OPENAI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "generate_hook", topic: hookTopic }),
            });
            const data = await res.json();
            if (data.result) {
                setHookResult(data.result);
                setStatus("훅 시나리오 생성 완료!");
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setGeneratingHook(false);
        }
    };

    const renderHookOnly = async () => {
        if (hookScenes.length === 0) { alert("훅 장면이 없습니다."); return; }
        const missing = hookScenes.findIndex(s => !hasVisual(s));
        if (missing >= 0) {
            const s = hookScenes[missing];
            alert(`훅 ${missing + 1}번에 이미지가 없습니다. \n(URL: ${s.imageUrl || s.videoUrl || "없음"})`);
            return;
        }
        setBusy("renderHook", true);
        setStatus("훅 합성중...");
        try {
            const res = await fetch(API.RENDER, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...projectRef.current, scenes: hookScenes }),
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();

            setHookFinalUrl(URL.createObjectURL(blob));
            setStatus("훅 영상 완성!");
        } catch (err: any) {
            alert(err.message);
            setStatus("훅 합성 실패");
        } finally {
            setBusy("renderHook", false);
        }
    };

    const renderAll = async () => {
        if (allScenes.length === 0) { alert("장면이 없습니다."); return; }
        const missing = allScenes.findIndex(s => !hasVisual(s));
        if (missing >= 0) {
            const s = allScenes[missing];
            alert(`${missing + 1}번 장면에 이미지가 없습니다. \n(URL: ${s.imageUrl || s.videoUrl || "없음"})`);
            return;
        }
        setBusy("renderAll", true);
        setStatus("전체 합성중...");
        try {
            const res = await fetch(API.RENDER, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(projectRef.current),
            });
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            if (finalVideoUrl?.startsWith("blob:")) URL.revokeObjectURL(finalVideoUrl);
            setFinalVideoUrl(URL.createObjectURL(blob));
            setStatus("전체 영상 완성!");
        } catch (err: any) {
            alert(err.message);
            setStatus("전체 합성 실패");
        } finally {
            setBusy("renderAll", false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. 훅 비디오 생성기 (NEW) */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6">
                <h2 className="text-xl font-bold text-indigo-900 mb-4">🚀 훅 비디오 아이디어 생성기</h2>
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        value={hookTopic}
                        onChange={e => setHookTopic(e.target.value)}
                        placeholder="주제나 핵심 메시지를 입력하세요 (예: AI가 일자리 뺏는다)"
                        className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={generateHookScenarios}
                        disabled={generatingHook}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {generatingHook ? "생성중..." : "아이디어 생성"}
                    </button>
                </div>

                {hookResult && (
                    <div className="bg-white rounded-xl p-4 border border-indigo-100 mb-4 shadow-sm">
                        <textarea
                            readOnly
                            value={hookResult}
                            className="w-full h-64 text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded-lg resize-y focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-right">
                            * 위 내용은 참고용입니다. 마음에 드는 내용을 [Step 2 대본 기획]에 복사해서 사용하세요.
                        </p>
                    </div>
                )}

                {/* VEO Placeholder */}
                <div className="mt-6 pt-6 border-t border-indigo-200/50">
                    <h3 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                        🎥 VEO 영상 생성 (Beta)
                        <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">Coming Soon</span>
                    </h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={veoPrompt}
                            onChange={e => setVeoPrompt(e.target.value)}
                            placeholder="VEO 프롬프트 입력 (영어)"
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm"
                        />
                        <button className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-900">
                            VEO 생성
                        </button>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* 영상 미리보기 */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* 훅 미리보기 */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">🎬 훅 미리보기</h2>
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-4">
                        {hookFinalUrl ? (
                            <video src={hookFinalUrl} controls loop className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-gray-400">훅 영상을 생성해주세요</span>
                        )}
                    </div>
                    <button
                        onClick={renderHookOnly}
                        disabled={busyAny || hookScenes.length === 0}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isBusy("renderHook")
                            ? "훅 합성중..."
                            : hookFinalUrl
                                ? `↻ 훅 영상 업데이트 (재합성)`
                                : `훅만 합성 (${readyHooks.length}/${hookScenes.length} 준비됨)`
                        }
                    </button>
                </div>

                {/* 전체 미리보기 */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">🎉 전체 영상 미리보기</h2>
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-4">
                        {finalVideoUrl ? (
                            <video src={finalVideoUrl} controls loop className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-gray-400">전체 영상을 생성해주세요</span>
                        )}
                    </div>
                    <button
                        onClick={renderAll}
                        disabled={busyAny || allScenes.length === 0}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                    >
                        {isBusy("renderAll") ? "전체 합성중..." : `전체 합성 (${allReady.length}/${allScenes.length} 준비됨)`}
                    </button>
                </div>
            </div>

            {/* 다운로드 */}
            {(hookFinalUrl || finalVideoUrl) && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl border border-green-100 p-6">
                    <h3 className="text-lg font-bold text-green-700 mb-4">⬇️ 다운로드</h3>
                    <div className="flex gap-4">
                        {hookFinalUrl && (
                            <a
                                href={hookFinalUrl}
                                download="hook_video.mp4"
                                className="flex-1 py-3 bg-white border border-green-200 text-green-700 rounded-xl font-bold text-center hover:bg-green-50"
                            >
                                훅 영상 다운로드
                            </a>
                        )}
                        {finalVideoUrl && (
                            <a
                                href={finalVideoUrl}
                                download="final_video.mp4"
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-center hover:bg-green-700"
                            >
                                전체 영상 다운로드
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* 영상 효과 설정 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ 영상 효과 설정</h2>

                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">비율</label>
                        <select
                            value={project.settings.aspectRatio}
                            onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, aspectRatio: e.target.value as any } }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200"
                        >
                            <option value="16:9">16:9 (가로)</option>
                            <option value="9:16">9:16 (세로)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">자막</label>
                        <select
                            value={project.settings.includeSubtitle ? "on" : "off"}
                            onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, includeSubtitle: e.target.value === "on" } }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200"
                        >
                            <option value="on">ON</option>
                            <option value="off">OFF</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">줌 효과</label>
                        <select
                            value={project.settings.zoomEnabled ? "on" : "off"}
                            onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, zoomEnabled: e.target.value === "on" } }))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200"
                        >
                            <option value="on">ON</option>
                            <option value="off">OFF</option>
                        </select>
                    </div>
                </div>

                {/* 로고 설정 */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-4">로고 설정</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">로고 파일</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async e => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    const dataUrl = await readFileAsDataURL(f);
                                    const res = await fetch(API.STORE, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ dataUrl }),
                                    });
                                    const data = await res.json();
                                    if (data?.url) {
                                        setProject(p => ({ ...p, settings: { ...p.settings, logoUrl: data.url } }));
                                    }
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">로고 폭 (px)</label>
                            <input
                                type="number"
                                value={project.settings.logoWidthPx}
                                onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, logoWidthPx: Number(e.target.value) } }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">로고 마진 (px)</label>
                            <input
                                type="number"
                                value={project.settings.logoMarginPx}
                                onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, logoMarginPx: Number(e.target.value) } }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200"
                            />
                        </div>
                    </div>
                </div>

                {/* BGM 설정 */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-4">훅 BGM 설정</h4>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">BGM 파일</label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={async e => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    const url = await readFileAsDataURL(f);
                                    setProject(p => ({ ...p, settings: { ...p.settings, hookBgmUrl: url } }));
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">볼륨 (dB)</label>
                            <input
                                type="number"
                                value={project.settings.hookBgmGainDb ?? -14}
                                onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, hookBgmGainDb: Number(e.target.value) } }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">페이드 (초)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={project.settings.hookBgmFadeSec ?? 0.6}
                                onChange={e => setProject(p => ({ ...p, settings: { ...p.settings, hookBgmFadeSec: Number(e.target.value) } }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 준비 상태 */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border border-pink-100 p-6">
                <h3 className="text-base font-bold text-pink-700 mb-4">✓ 준비 상태 확인</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4">
                        <div className={`text-3xl font-bold mb-1 ${readyHooks.length === hookScenes.length && hookScenes.length > 0 ? "text-green-500" : "text-red-500"}`}>
                            {readyHooks.length === hookScenes.length && hookScenes.length > 0 ? "✓" : "X"}
                        </div>
                        <div className="text-sm text-gray-600">훅 ({readyHooks.length}/{hookScenes.length})</div>
                        {readyHooks.length !== hookScenes.length && hookScenes.length > 0 && (
                            <div className="text-xs text-yellow-600 mt-1">⚠ 이미지/오디오 필요</div>
                        )}
                    </div>
                    <div className="bg-white rounded-xl p-4">
                        <div className={`text-3xl font-bold mb-1 ${readyBodies.length === bodyScenes.length && bodyScenes.length > 0 ? "text-green-500" : "text-red-500"}`}>
                            {readyBodies.length === bodyScenes.length && bodyScenes.length > 0 ? "✓" : "X"}
                        </div>
                        <div className="text-sm text-gray-600">바디 ({readyBodies.length}/{bodyScenes.length})</div>
                        {readyBodies.length !== bodyScenes.length && bodyScenes.length > 0 && (
                            <div className="text-xs text-yellow-600 mt-1">⚠ 이미지/오디오 필요</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
