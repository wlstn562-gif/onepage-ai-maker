"use client";
import React, { useState } from "react";
import { useVideoContext, IMAGE_STYLES } from "../context/VideoContext";

const INTRO_STYLES = [
    { id: "stickman", name: "스틱맨 애니메이션", icon: "🎭" },
    { id: "realistic", name: "실사화", icon: "📷" },
    { id: "realistic2", name: "실사화2", icon: "🖼️" },
    { id: "anime", name: "애니메이션2", icon: "✨" },
    { id: "european", name: "유럽풍 그래픽 노블", icon: "🎨" },
];

export default function IntroGenerator() {
    const { project, setProject, API, setStatus, isBusy, setBusy } = useVideoContext();
    const [introStyle, setIntroStyle] = useState("stickman");
    const [introPrompt, setIntroPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [introVideoUrl, setIntroVideoUrl] = useState("");

    const generateIntroPrompt = async () => {
        if (!project.topic) {
            alert("먼저 주제를 선택해주세요.");
            return;
        }

        setBusy("introPrompt", true);
        setStatus("인트로 프롬프트 생성중...");

        try {
            const response = await fetch(API.OPENAI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "intro",
                    topic: project.topic,
                    style: introStyle,
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            if (data.result) {
                setIntroPrompt(data.result);
                setStatus("인트로 프롬프트 생성 완료!");
            }
        } catch (err: any) {
            // Fallback prompt
            setIntroPrompt(`Cinematic ${introStyle} style intro animation for a video about: ${project.topic}. Dynamic camera movement, professional intro sequence, compelling visuals.`);
            setStatus("기본 프롬프트 생성됨");
        } finally {
            setBusy("introPrompt", false);
        }
    };

    const generateIntroVideo = async () => {
        if (!introPrompt.trim()) {
            alert("먼저 인트로 프롬프트를 생성하거나 입력해주세요.");
            return;
        }

        setGenerating(true);
        setBusy("introGen", true);
        setStatus("인트로 영상 생성중...");

        try {
            const response = await fetch("/api/veo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: introPrompt,
                    seconds: 5,
                    size: project.settings.aspectRatio === "9:16" ? "1080x1920" : "1920x1080",
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "인트로 생성 실패");

            const videoUrl = data?.videoUrl || data?.url || "";
            if (!videoUrl) throw new Error("영상 URL을 받지 못했습니다.");

            setIntroVideoUrl(videoUrl);
            setProject(p => ({ ...p, introVideoUrl: videoUrl }));
            setStatus("인트로 영상 생성 완료!");
        } catch (err: any) {
            alert(err.message || "인트로 생성 실패");
            setStatus("인트로 생성 실패");
        } finally {
            setGenerating(false);
            setBusy("introGen", false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 그림체 선택 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🎨 그림체 선택
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {INTRO_STYLES.map(style => (
                        <button
                            key={style.id}
                            onClick={() => setIntroStyle(style.id)}
                            className={`
                p-4 rounded-xl border-2 transition-all text-center
                ${introStyle === style.id
                                    ? "border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                    : "border-gray-200 hover:border-purple-200 bg-white"
                                }
              `}
                        >
                            <div className="text-2xl mb-2">{style.icon}</div>
                            <div className={`text-sm font-medium ${introStyle === style.id ? "text-white" : "text-gray-700"}`}>
                                {style.name}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 인트로 프롬프트 생성 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    ✨ 인트로 프롬프트 생성
                </h2>

                <button
                    onClick={generateIntroPrompt}
                    disabled={isBusy("introPrompt") || !project.topic}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 mb-4"
                >
                    {isBusy("introPrompt") ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            프롬프트 생성중...
                        </span>
                    ) : (
                        "✨ 인트로 프롬프트 생성"
                    )}
                </button>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">인트로 프롬프트 (영어)</label>
                    <textarea
                        value={introPrompt}
                        onChange={e => setIntroPrompt(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        placeholder="Cinematic intro animation with dynamic camera movement..."
                    />
                </div>
            </div>

            {/* 인트로 영상 생성 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">🎬 인트로 영상 생성</h2>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* 미리보기 */}
                    <div>
                        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                            {introVideoUrl || project.introVideoUrl ? (
                                <video
                                    src={introVideoUrl || project.introVideoUrl}
                                    controls
                                    loop
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center text-gray-400 p-6">
                                    <div className="text-4xl mb-3">🎬</div>
                                    <p className="text-sm">인트로 영상을 생성해주세요</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 컨트롤 */}
                    <div className="flex flex-col justify-center space-y-4">
                        <button
                            onClick={generateIntroVideo}
                            disabled={generating || !introPrompt.trim()}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                        >
                            {generating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    인트로 생성중...
                                </span>
                            ) : (
                                "🎬 인트로 영상 생성하기"
                            )}
                        </button>

                        {!introPrompt.trim() && (
                            <p className="text-sm text-yellow-600 text-center">
                                먼저 인트로 프롬프트를 생성하거나 입력해주세요
                            </p>
                        )}

                        {(introVideoUrl || project.introVideoUrl) && (
                            <a
                                href={introVideoUrl || project.introVideoUrl || ""}
                                download="intro.mp4"
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-center hover:bg-gray-800"
                            >
                                ⬇️ 인트로 다운로드
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* 팁 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6">
                <h4 className="font-bold text-purple-700 mb-3">💡 인트로 제작 팁</h4>
                <ul className="space-y-2 text-sm text-purple-600">
                    <li>• 인트로는 3~5초가 적당합니다</li>
                    <li>• 채널 로고나 브랜딩을 포함하면 인지도가 높아집니다</li>
                    <li>• 일관된 인트로 스타일은 시청자에게 친숙함을 줍니다</li>
                    <li>• 본 영상과 어울리는 그림체를 선택하세요</li>
                </ul>
            </div>
        </div>
    );
}
