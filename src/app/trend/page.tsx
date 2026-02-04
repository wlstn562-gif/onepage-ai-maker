"use client";
import { useState } from "react";

export default function TrendAnalyzerPage() {
  // Form State
  const [keyword, setKeyword] = useState("");
  const [dateRange, setDateRange] = useState("10");
  const [duration, setDuration] = useState("short");
  const [minViews, setMinViews] = useState("10000");
  const [count, setCount] = useState("20");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleAnalyze = async () => {
    if (!keyword) {
      alert("키워드를 입력해주세요.");
      return;
    }

    setIsAnalyzing(true); // Loading Start
    setResults(null); // Clear previous

    try {
      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          dateRange,
          duration,
          minViews,
          count
        })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "API Failed");
      }

      const data = await res.json();
      setResults(data.items || []);

      if (data.items?.length === 0) {
        alert("검색 결과가 없습니다.");
      }

    } catch (e: any) {
      console.error(e);
      alert(`에러 발생: ${e.message}`);
    } finally {
      setIsAnalyzing(false); // Loading End
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">

      {/* 1. LEFT SIDEBAR (Controls) */}
      <div className="w-full md:w-[320px] bg-white border-r border-slate-300 flex flex-col shadow-xl z-20 shrink-0 h-screen sticky top-0">

        {/* Header */}
        <div className="p-6 bg-purple-700 text-white shrink-0">
          <h1 className="text-2xl font-black tracking-tight">🚀 트렌드 분석기</h1>
          <p className="text-purple-200 text-xs mt-1">유튜브 고속 발굴 엔진</p>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Keyword */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">1. 검색 키워드</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-300 rounded-lg text-lg font-bold focus:border-purple-600 outline-none bg-slate-50"
              placeholder="예: 아이유, 요리, 주식..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">2. 기간 설정</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-lg font-medium outline-none bg-white"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="10">최근 10일 이내</option>
              <option value="30">최근 30일 이내</option>
              <option value="365">1년 이내</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">3. 영상 길이</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-lg font-medium outline-none bg-white"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="short">쇼츠/3분 미만</option>
              <option value="medium">3분 ~ 20분</option>
              <option value="long">20분 이상 (롱폼)</option>
              <option value="any">전체</option>
            </select>
          </div>

          {/* View Count */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">4. 최소 조회수</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-lg font-medium outline-none bg-white"
              value={minViews}
              onChange={(e) => setMinViews(e.target.value)}
            >
              <option value="10000">1만회 이상</option>
              <option value="50000">5만회 이상</option>
              <option value="100000">10만회 이상</option>
              <option value="1000000">100만회 이상</option>
            </select>
          </div>

          {/* Count */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">5. 검색 개수</label>
            <input
              type="number"
              className="w-full p-3 border border-slate-300 rounded-lg font-bold outline-none bg-white"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={1}
              max={50}
            />
          </div>

        </div>

        {/* Footer Button (Fixed) */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? "분석 중..." : "🔍 분석 시작"}
          </button>
        </div>

      </div>

      {/* 2. RIGHT CONTENT (Result Table) */}
      <div className="flex-1 bg-white h-screen overflow-hidden flex flex-col">

        {/* Top Bar */}
        <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            📊 분석 결과
            {results && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">{results.length}건</span>}
          </h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-slate-100 border border-slate-300 text-sm font-bold rounded hover:bg-slate-200 text-slate-600">엑셀 다운로드</button>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">

          {!results ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
              <div className="text-6xl mb-4">👈</div>
              <p className="text-lg font-bold">좌측 메뉴에서 키워드를 입력하고 [분석 시작]을 눌러주세요.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden min-w-[1400px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3 border-b border-r border-slate-300 w-[50px] font-bold text-center">#</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[140px] font-bold text-center">썸네일</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[400px] font-bold">제목</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[120px] font-bold">채널</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[100px] font-bold">날짜</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[100px] font-bold">길이</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[100px] font-bold text-right">조회수</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[80px] font-bold text-right">좋아요</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[80px] font-bold text-right">댓글</th>
                    <th className="p-3 border-b border-r border-slate-300 w-[150px] font-bold">설명 (요약)</th>
                    <th className="p-3 border-b border-slate-300 w-[300px] font-bold">베스트 댓글</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm font-medium text-slate-700">
                  {results.map((item, i) => (
                    <tr key={i} className="hover:bg-purple-50 transition-colors">
                      <td className="p-3 border-r border-slate-200 text-center text-slate-500">{i + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <a href={`https://www.youtube.com/watch?v=${item.id}`} target="_blank" className="block w-28 aspect-video bg-black rounded overflow-hidden border border-slate-200 hover:ring-2 ring-purple-500">
                          <img src={item.thumbnail} className="w-full h-full object-cover" />
                        </a>
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <a href={`https://www.youtube.com/watch?v=${item.id}`} target="_blank" className="hover:text-purple-700 hover:underline line-clamp-2 leading-relaxed" title={item.title}>
                          {item.title}
                        </a>
                      </td>
                      <td className="p-3 border-r border-slate-200 truncate text-slate-600" title={item.channel}>{item.channel}</td>
                      <td className="p-3 border-r border-slate-200 whitespace-nowrap">{item.date}</td>
                      <td className="p-3 border-r border-slate-200 whitespace-nowrap text-slate-500">{item.length}</td>
                      <td className="p-3 border-r border-slate-200 text-right text-blue-600 font-bold">{item.views.toLocaleString()}</td>
                      <td className="p-3 border-r border-slate-200 text-right text-pink-600">{item.likes.toLocaleString()}</td>
                      <td className="p-3 border-r border-slate-200 text-right text-slate-500">{item.comments}</td>
                      <td className="p-3 border-r border-slate-200">
                        <p className="line-clamp-2 text-xs text-slate-400 font-normal leading-normal" title={item.desc}>{item.desc}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-600">
                        <div className="space-y-1">
                          {item.topComments && item.topComments.length > 0 ? (
                            item.topComments.map((c: string, ci: number) => (
                              <div key={ci} className="bg-slate-100 p-1.5 rounded border border-slate-200 line-clamp-2">
                                <span className="font-bold text-purple-600 mr-1">{ci + 1}.</span>
                                {c}
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-300 block text-center py-2">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
