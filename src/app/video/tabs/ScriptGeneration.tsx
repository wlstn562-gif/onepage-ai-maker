"use client";
import React from "react";
import { useVideoContext, Scene } from "../context/VideoContext";

export default function ScriptGeneration() {
    const {
        project,
        hookScript,
        bodyScript,
        addScene,
        removeScene,
        patchScene,
        busyAny,
    } = useVideoContext();

    const hookScenes = project.scenes.filter(s => s.kind === "hook");
    const bodyScenes = project.scenes.filter(s => s.kind === "body");

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">🎬 씬 기획 (Visual Planning)</h2>
                <p className="text-gray-500 text-sm mb-6">
                    AI가 분석한 장면들입니다. 자막(Ko)을 수정하거나, 상황에 맞는 연출을 확인하세요.
                    (영어 프롬프트는 이미지 생성 단계에서 자동 생성됩니다)
                </p>

                {/* HOOK Scenes */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            🔥 HOOK (도입부)
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {hookScenes.length}개 장면
                            </span>
                        </h3>
                        <button
                            onClick={() => addScene("hook")}
                            disabled={busyAny}
                            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            + 훅 추가
                        </button>
                    </div>

                    {hookScenes.length > 0 ? (
                        <div className="space-y-4">
                            {hookScenes.map((scene, idx) => (
                                <SceneEditor key={scene.id} scene={scene} index={idx} type="HOOK" />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                            생성된 훅 장면이 없습니다. (이전 단계에서 훅을 만들어주세요)
                        </div>
                    )}
                </div>

                {/* BODY Scenes */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            📝 BODY (본문)
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {bodyScenes.length}개 장면
                            </span>
                        </h3>
                        <button
                            onClick={() => addScene("body")}
                            disabled={busyAny}
                            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            + 바디 추가
                        </button>
                    </div>

                    {bodyScenes.length > 0 ? (
                        <div className="space-y-4">
                            {bodyScenes.map((scene, idx) => (
                                <SceneEditor key={scene.id} scene={scene} index={idx} type="BODY" />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                            생성된 바디 장면이 없습니다. (이전 단계에서 '바디 분석'을 실행해주세요)
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Scene Editor Component
function SceneEditor({ scene, index, type }: { scene: Scene; index: number; type: string }) {
    const { patchScene, removeScene, busyAny } = useVideoContext();

    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-gray-700 bg-white px-2 py-1 rounded border border-gray-200 text-xs">
                    {type} #{index + 1}
                </span>
                <button
                    onClick={() => removeScene(scene.id)}
                    disabled={busyAny}
                    className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-300 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50 flex items-center justify-center pb-0.5"
                >
                    ×
                </button>
            </div>

            <div className="space-y-3">
                {["ko1", "ko2", "ko3", "ko4"].map((key) => {
                    const val = (scene as any)[key];
                    return (
                        <div key={key} className="flex items-center gap-2">
                            <span className="w-10 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right shrink-0">
                                {key.toUpperCase()}
                            </span>
                            <input
                                value={val || ""}
                                onChange={e => patchScene(scene.id, { [key]: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                                placeholder={`자막 입력 (${key})`}
                            />
                        </div>
                    );
                })}

                {/* PromptEn removed/hidden as requested */}
            </div>

            {/* Simple Preview Placeholder */}
            <div className="mt-3 flex gap-2">
                {scene.imageUrl ? (
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                        <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        🖼️ 이미지 없음
                    </div>
                )}
                {scene.audioUrl && (
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        🎵 오디오 있음
                    </div>
                )}
            </div>
        </div>
    );
}
