"use client";
import { useState } from "react";

export default function TopicsPage() {
    const [topicType, setTopicType] = useState<"basic" | "niche">("basic");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [urlInput, setUrlInput] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [videoInfo, setVideoInfo] = useState<any>(null);

    const categories = [
        { id: "history", name: "역사", icon: "📜", keywords: ["역사", "미스터리", "고대문명"] },
        { id: "horror", name: "호러", icon: "👻", keywords: ["공포", "괴담", "미스터리"] },
        { id: "social", name: "사회 (트렌드)", icon: "📱", keywords: ["사회이슈", "뉴스", "트렌드"] },
        { id: "space", name: "우주", icon: "🌌", keywords: ["우주", "과학", "sf"] },
        { id: "self-help", name: "자기계발", icon: "📚", keywords: ["동기부여", "성공", "습관"] },
        { id: "economy", name: "경제", icon: "💰", keywords: ["주식", "재테크", "부동산"] },
        { id: "war", name: "전쟁", icon: "⚔️", keywords: ["전쟁", "무기", "밀리터리"] },
        { id: "misc", name: "분류", icon: "🦋", keywords: ["기타", "유머", "일상"] },
    ];

    const filteredCategories = categories.filter((c) =>
        c.name.includes(searchQuery)
    );

    // Mocked Trending Data
    const trendingTopics = [
        "2시간반 순삭 ㄷㄷ 중독성 쩌는 우주 암석 파괴 게임",
        "샷건 1자루 들고 실종된 여동생 찾는 상태토녀ㄷㄷ",
        "26년 새로운 주도주 '이 3개 주식' 외국인이 작정하고 쓸어담는..",
        "천왕성은 왜 옆으로 누워 있을까?",
        "뒷 이야기를 알고보면 소름끼치는 나사의 극비 탐사 자료",
        "2026 증시 대전망, 베스트파트너의 선택은?",
        "한국인 99%가 모르는 의외의 사실 top3",
        "지금 당장 유튜브 시작해야 하는 이유",
    ];

    const handleCategoryClick = async (categoryName: string) => {
        setLoading(true);
        setResults([]);
        setVideoInfo(null); // Clear previous video info if any
        try {
            const response = await fetch("/api/openai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "generate",
                    keyword: categoryName,
                    type: topicType,
                }),
            });
            const data = await response.json();
            if (data.result) {
                setResults(data.result.split("\n").filter((line: string) => line.trim() !== ""));
            }
        } catch (e) {
            alert("주제 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleUrlAnalysis = async () => {
        if (!urlInput.trim()) return;
        setAnalyzing(true);
        setResults([]);
        setVideoInfo(null);

        try {
            // 1. Extract Video Metadata
            const extractRes = await fetch("/api/youtube/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlInput }),
            });
            const extractData = await extractRes.json();

            if (!extractRes.ok) throw new Error(extractData.error);

            setVideoInfo(extractData);

            // 2. Analyze with OpenAI
            const response = await fetch("/api/openai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "analyze",
                    title: extractData.title,
                    context: `채널명: ${extractData.channelTitle}, 조회수: ${extractData.viewCount}`,
                }),
            });
            const data = await response.json();
            if (data.result) {
                setResults(data.result.split("\n").filter((line: string) => line.trim() !== ""));
            }

        } catch (e: any) {
            alert(e.message || "분석 중 오류가 발생했습니다.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen pb-20 pt-24 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Main Content */}
                <div className="flex-1">
                    <header className="mb-8">
                        <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                                ✨ 주제 생성
                            </span>
                            <span className="text-2xl text-gray-500 font-medium">Topic Scout</span>
                        </h1>
                        <p className="text-gray-400">
                            원하는 카테고리를 선택하거나 유튜브 URL을 입력하여 대박 주제를 발굴하세요.
                        </p>
                    </header>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="bg-gray-900 p-1 rounded-xl inline-flex border border-white/10">
                            <button
                                onClick={() => setTopicType("basic")}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${topicType === "basic"
                                        ? "bg-white text-black shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                기본 주제
                            </button>
                            <button
                                onClick={() => setTopicType("niche")}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${topicType === "niche"
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                틈새 주제
                            </button>
                        </div>

                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="카테고리 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-900 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pl-12"
                            />
                            <svg className="w-5 h-5 text-gray-500 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Category Grid */}
                    {!loading && !analyzing && results.length === 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-fade-in-up">
                            {filteredCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className={`
                                group relative p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-gray-900 to-black hover:border-purple-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 text-left
                                ${topicType === 'niche' && category.id === 'space' ? 'ring-2 ring-pink-500/50' : ''} 
                            `}
                                >
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 transform origin-left">
                                        {category.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-200 group-hover:text-white mb-1">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 group-hover:text-gray-400">
                                        {category.keywords[0]} 외 {category.keywords.length - 1}개
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Loading State */}
                    {(loading || analyzing) && (
                        <div className="py-20 text-center animate-pulse">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <p className="text-xl font-bold text-white">
                                {analyzing ? "영상 분석 및 주제 추출 중..." : "AI가 주제를 생성하고 있습니다..."}
                            </p>
                            <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
                        </div>
                    )}

                    {/* Results */}
                    {results.length > 0 && (
                        <div className="mb-12 animate-fade-in-up">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    🎉 {analyzing ? "분석 결과 & 추천 주제" : "추천 주제"}
                                </h2>
                                <button
                                    onClick={() => setResults([])}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    다시 선택하기
                                </button>
                            </div>

                            {videoInfo && (
                                <div className="bg-gray-900/50 p-4 rounded-xl mb-6 flex gap-4 border border-white/10 items-center">
                                    <img src={videoInfo.thumbnail} alt={videoInfo.title} className="w-32 h-20 object-cover rounded-lg" />
                                    <div>
                                        <p className="text-xs text-purple-400 font-bold mb-1">분석된 영상</p>
                                        <h3 className="text-sm font-bold text-white line-clamp-1">{videoInfo.title}</h3>
                                        <p className="text-xs text-gray-400">{videoInfo.channelTitle}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {results.map((result, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all flex items-start gap-4">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                            {idx + 1}
                                        </span>
                                        <p className="text-gray-200 mt-1">{result.replace(/^\d+\.\s*/, '')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* URL Logic Section */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-8 border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                            잘 뜨는 주제 URL 넣어 주제 분석
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            YouTube 영상 URL을 입력하면 주제를 분석하고 유사 주제를 추천합니다.
                        </p>

                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-mono text-sm"
                                onKeyDown={(e) => e.key === "Enter" && handleUrlAnalysis()}
                            />
                            <button
                                onClick={handleUrlAnalysis}
                                disabled={analyzing}
                                className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {analyzing ? "분석중..." : "분석하기"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar (Trending) */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="sticky top-28 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="animate-pulse">🔥</span>
                            급상승 인기 주제
                            <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded ml-auto">LIVE</span>
                        </h3>

                        <div className="space-y-6">
                            {trendingTopics.map((topic, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <span className={`
                                    flex-shrink-0 text-lg font-bold font-mono w-6 text-right
                                    ${i < 3 ? 'text-red-500' : 'text-gray-600'}
                                `}>
                                            {i + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm text-gray-300 font-medium group-hover:text-white group-hover:underline decoration-gray-500 underline-offset-4 transition-all leading-relaxed line-clamp-2">
                                                {topic}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] text-gray-500 border border-gray-700 px-1 rounded">조회수 급증</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-xs text-gray-500">
                                최근 24시간 내 조회수가 급증한 영상들의 주제입니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
