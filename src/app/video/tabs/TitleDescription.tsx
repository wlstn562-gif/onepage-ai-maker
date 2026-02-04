"use client";
import React, { useState } from "react";
import { useVideoContext } from "../context/VideoContext";

export default function TitleDescription() {
    const { project, setProject, API, setStatus, isBusy, setBusy } = useVideoContext();
    const [generating, setGenerating] = useState(false);
    const [customTitle, setCustomTitle] = useState("");

    const generateAIContent = async () => {
        if (!project.topic && project.scenes.length === 0) {
            alert("주제 또는 대본이 필요합니다.");
            return;
        }

        setGenerating(true);
        setBusy("titleGen", true);
        setStatus("제목 및 설명 생성중...");

        try {
            const scriptContent = project.scenes
                .map(s => [s.ko1, s.ko2, s.ko3, s.ko4].filter(Boolean).join(" "))
                .join("\n");

            const response = await fetch(API.OPENAI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "generate_title",
                    topic: project.topic,
                    script: scriptContent,
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            if (data.result) {
                const text = data.result;

                // Parse Titles
                const titleMatch = text.match(/===\s*TITLES\s*===([\s\S]*?)(===\s*DESCRIPTION\s*===|$)/i);
                if (titleMatch && titleMatch[1]) {
                    const titles = titleMatch[1]
                        .split("\n")
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.match(/^\d+\./))
                        .map((line: string) => line.replace(/^\d+\.\s*/, "").trim());
                    setProject(p => ({ ...p, generatedTitles: titles }));
                }

                // Parse Description
                const descMatch = text.match(/===\s*DESCRIPTION\s*===([\s\S]*)/i);
                if (descMatch && descMatch[1]) {
                    setProject(p => ({ ...p, generatedDescription: descMatch[1].trim() }));
                }

                setStatus("제목과 설명이 완성되었습니다!");
            }
        } catch (err: any) {
            alert(err.message || "생성 실패");
            setStatus("생성 실패");
        } finally {
            setGenerating(false);
            setBusy("titleGen", false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 유튜브 제목 생성 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">📝 유튜브 제목 & 설명 생성</h2>
                <p className="text-gray-500 text-sm mb-6">
                    대본을 분석하여 클릭률 높은 제목 5개와 검색 최적화(SEO) 설명을 한번에 생성합니다.
                </p>

                <button
                    onClick={generateAIContent}
                    disabled={generating}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-bold hover:from-teal-600 hover:to-green-600 transition-all disabled:opacity-50"
                >
                    {generating ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            AI가 분석하고 있습니다...
                        </span>
                    ) : (
                        "📝 SEO 최적화 제목 & 설명 생성하기"
                    )}
                </button>

                {/* 생성된 제목들 */}
                {project.generatedTitles && project.generatedTitles.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-sm font-bold text-gray-700">추천 제목</h3>
                        {project.generatedTitles.map((title, idx) => (
                            <div
                                key={idx}
                                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 cursor-pointer transition-colors flex items-center gap-3"
                                onClick={() => {
                                    navigator.clipboard.writeText(title);
                                    setStatus("제목이 클립보드에 복사되었습니다!");
                                }}
                            >
                                <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </span>
                                <span className="flex-1 text-gray-700">{title}</span>
                                <span className="text-xs text-gray-400">클릭하여 복사</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 제목 직접 추가 */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">제목 직접 추가</h4>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={customTitle}
                            onChange={e => setCustomTitle(e.target.value)}
                            placeholder="유튜브 제목 직접 입력"
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => {
                                if (customTitle.trim()) {
                                    setProject(p => ({
                                        ...p,
                                        generatedTitles: [...(p.generatedTitles || []), customTitle.trim()]
                                    }));
                                    setCustomTitle("");
                                }
                            }}
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800"
                        >
                            추가
                        </button>
                    </div>
                </div>

                {/* 생성된 설명 */}
                {project.generatedDescription && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-gray-700">추천 설명글</h3>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(project.generatedDescription || "");
                                    setStatus("설명이 클립보드에 복사되었습니다!");
                                }}
                                className="text-xs text-purple-600 hover:text-purple-800"
                            >
                                복사하기
                            </button>
                        </div>
                        <textarea
                            value={project.generatedDescription}
                            onChange={e => setProject(p => ({ ...p, generatedDescription: e.target.value }))}
                            rows={12}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm bg-gray-50"
                        />
                    </div>
                )}
            </div>

            {/* 해시태그 제안 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
                <h3 className="text-lg font-bold text-blue-700 mb-4">#️⃣ 추천 해시태그</h3>
                <div className="flex flex-wrap gap-2">
                    {["#유튜브", "#영상제작", "#콘텐츠", "#AI영상", "#자동화", "#쇼츠", "#vlog", "#일상", "#정보", "#꿀팁"].map(tag => (
                        <span
                            key={tag}
                            onClick={() => {
                                navigator.clipboard.writeText(tag);
                                setStatus(`${tag} 복사됨!`);
                            }}
                            className="px-3 py-1.5 bg-white rounded-full text-sm text-blue-700 border border-blue-200 cursor-pointer hover:bg-blue-50"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
