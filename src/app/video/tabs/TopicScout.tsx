"use client";
import { useState } from "react";
import { useVideoContext } from "../context/VideoContext";

// 20 Categories for Deep Research
const CATEGORIES = [
    { id: "history", name: "역사", icon: "📜", keywords: ["역사 다큐", "조선왕조", "세계사"] },
    { id: "mystery", name: "미스터리", icon: "🕵️", keywords: ["미스터리 사건", "음모론", "미제사건"] },
    { id: "horror", name: "공포/괴담", icon: "👻", keywords: ["공포 썰", "괴담 실화", "무서운이야기"] },
    { id: "crime", name: "범죄/사건", icon: "👮", keywords: ["사건사고 실화", "범죄 다큐", "실화 사건"] },
    { id: "psychology", name: "심리학", icon: "🧠", keywords: ["심리학 설명", "인간 심리", "심리 분석"] },
    { id: "love", name: "연애/관계", icon: "💕", keywords: ["연애 심리", "남녀 관계", "연애 조언"] },
    { id: "drama", name: "불륜/막장", icon: "💔", keywords: ["네이트판 썰", "사연 레전드", "막장 썰"] },
    { id: "social", name: "사회/이슈", icon: "📢", keywords: ["뉴스 이슈", "사회 문제", "논란 정리"] },
    { id: "money", name: "돈/경제", icon: "💰", keywords: ["경제 뉴스", "재테크 방법", "부자 마인드"] },
    { id: "stock", name: "주식/코인", icon: "📈", keywords: ["주식 분석", "비트코인 전망", "투자 전략"] },
    { id: "career", name: "직장/커리어", icon: "💼", keywords: ["직장인 브이로그", "취업 준비", "면접 팁"] },
    { id: "selfhelp", name: "자기계발", icon: "📚", keywords: ["동기부여 영상", "성공 마인드", "자기계발 책"] },
    { id: "health", name: "건강/수명", icon: "💪", keywords: ["건강 정보", "다이어트 방법", "운동 루틴"] },
    { id: "medical", name: "의학/뇌과학", icon: "🧬", keywords: ["의학 상식", "뇌과학 설명", "인체 신비"] },
    { id: "tech", name: "AI/미래기술", icon: "🤖", keywords: ["인공지능 뉴스", "ChatGPT 활용", "미래 기술"] },
    { id: "space", name: "우주/과학", icon: "🌌", keywords: ["우주 다큐", "NASA 뉴스", "과학 설명"] },
    { id: "war", name: "전쟁/군사", icon: "⚔️", keywords: ["전쟁 역사", "무기 설명", "밀리터리"] },
    { id: "philosophy", name: "철학/인생", icon: "🤔", keywords: ["철학 설명", "명언 모음", "인생 조언"] },
    { id: "celeb", name: "연예/셀럽", icon: "🎤", keywords: ["연예인 뉴스", "아이돌 소식", "셀럽 이슈"] },
    { id: "sports", name: "스포츠/승부", icon: "⚽", keywords: ["축구 하이라이트", "스포츠 뉴스", "경기 분석"] },
];

export default function TopicScout() {
    const { setProject, setCurrentStep } = useVideoContext();
    const [selectedCategory, setSelectedCategory] = useState("");

    // AI Deep Research State
    const [aiTopics, setAiTopics] = useState<any[]>([]);
    const [isResearching, setIsResearching] = useState(false);
    const [researchError, setResearchError] = useState("");

    // Start Deep Research
    const handleCategoryClick = async (categoryName: string) => {
        setSelectedCategory(categoryName);
        setIsResearching(true);
        setAiTopics([]);
        setResearchError("");

        try {
            const res = await fetch("/api/deep-research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: categoryName })
            });

            const data = await res.json();
            if (data.topics && Array.isArray(data.topics)) {
                setAiTopics(data.topics);
            } else {
                setResearchError("리서치 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
            }
        } catch (e: any) {
            setResearchError("리서치 오류: " + e.message);
        } finally {
            setIsResearching(false);
        }
    };

    // Select Topic and Proceed
    const handleSelectTopic = (topicItem: any) => {
        setProject((prev) => ({
            ...prev,
            topic: topicItem.title, // 주제 설정
            researchFacts: topicItem.facts || [], // 리서치 팩트 저장
            researchSource: "OpenAI Deep Research",
            // 간단하게 요약된 내용을 기본 스크립트 아이디어로 쓸 수도 있음
        }));
        setCurrentStep(2); // Step 2 (대본 기획) 이동
    };

    return (
        <div className="h-full flex flex-col gap-6 p-2">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                    Topic Deep Research
                </h1>
                <p className="text-gray-400 text-sm">
                    AI가 유튜브 트렌드와 웹 데이터를 심층 분석하여, 지금 가장 핫한 주제를 발굴합니다.
                </p>
            </div>

            <div className="flex gap-6 h-full min-h-0">
                {/* Left: Category Selection */}
                <div className="w-1/3 bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col shadow-xl">
                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider flex items-center gap-2">
                        <span>📂 카테고리 선택</span>
                    </h2>
                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 content-start custom-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.name)}
                                className={`
                                    p-4 rounded-xl text-left transition-all border
                                    flex flex-col gap-2 relative overflow-hidden group
                                    ${selectedCategory === cat.name
                                        ? "bg-purple-900/40 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                                        : "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600"}
                                `}
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                                <span className={`text-sm font-bold ${selectedCategory === cat.name ? "text-purple-300" : "text-gray-300"}`}>
                                    {cat.name}
                                </span>
                                {selectedCategory === cat.name && (
                                    <div className="absolute inset-0 bg-purple-500/5 animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Research Results */}
                <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col shadow-xl relative overflow-hidden">
                    {/* Background Blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                    <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider flex items-center gap-2 z-10">
                        {isResearching ? (
                            <span className="flex items-center gap-2 text-purple-400 animate-pulse">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                AI 심층 리서치 진행 중...
                            </span>
                        ) : selectedCategory ? (
                            <span className="flex items-center gap-2 text-green-400">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                "{selectedCategory}" 베스트 주제 발굴 완료
                            </span>
                        ) : (
                            <span>🔍 리서치 결과 대기 중...</span>
                        )}
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 relative z-10 custom-scrollbar">
                        {!selectedCategory ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                                <div className="text-6xl opacity-20">🧠</div>
                                <p>카테고리를 선택하면 AI가 심층 분석을 시작합니다.</p>
                            </div>
                        ) : isResearching ? (
                            <div className="space-y-4 pt-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 animate-pulse">
                                        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                                        <div className="h-4 bg-gray-700/50 rounded w-1/2 mb-2"></div>
                                        <div className="h-4 bg-gray-700/50 rounded w-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : researchError ? (
                            <div className="h-full flex items-center justify-center text-red-400 bg-red-900/20 rounded-xl p-8 border border-red-900/50 text-center">
                                {researchError}
                            </div>
                        ) : (
                            <div className="grid gap-4 pt-4">
                                {aiTopics.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectTopic(item)}
                                        className="text-left bg-gray-800/80 hover:bg-gray-750 border border-gray-700/50 hover:border-purple-500/50 p-6 rounded-xl transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-gray-100 group-hover:text-purple-300 transition-colors pr-4">
                                                {item.title}
                                            </h3>
                                            <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/30 whitespace-nowrap">
                                                추천 주제 #{idx + 1}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-2">
                                            {item.hook}
                                        </p>

                                        <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                            <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">💡 선정 이유 & 팩트</p>
                                            <ul className="space-y-1">
                                                {item.facts.slice(0, 2).map((fact: string, fIdx: number) => (
                                                    <li key={fIdx} className="text-xs text-gray-400 flex items-start gap-2">
                                                        <span className="text-purple-500 mt-0.5">•</span>
                                                        <span className="line-clamp-1">{fact}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-purple-400 text-sm font-bold">
                                            이 주제로 기획하기 <span>→</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
