export default function HubPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0F0F12] text-white">
            {/* 배경 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

            {/* 움직이는 그리드 */}
            <div className="absolute inset-0 bg-grid opacity-20 animate-grid-move" />

            <div className="relative max-w-7xl mx-auto px-6 py-20">
                {/* 헤더 */}
                <header className="text-center mb-16 animate-fade-in-down">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">
                        Internal Staff Only
                    </div>
                    <h1 className="text-5xl font-black mb-4 tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient">딸깍 관리자 허브</span>
                    </h1>
                    <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                        (주)연희스튜디오 내부 업무 자동화 시스템
                    </p>
                </header>

                {/* 메인 서비스 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">

                    {/* 1. 영상 제작 */}
                    <a
                        href="/video"
                        className="group relative overflow-hidden rounded-3xl p-[1px] animate-fade-in-up hover:scale-105 transition-all duration-300"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-pink-600 to-red-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-[#1A1A1E] h-full rounded-[23px] p-6 flex flex-col items-center text-center hover:bg-[#202025] transition-colors">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                <span className="text-2xl">🎬</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">딸깍 영상</h2>
                            <p className="text-gray-400 text-xs leading-relaxed mb-4">
                                대본부터 영상까지<br />원스톱 자동 생성
                            </p>
                        </div>
                    </a>

                    {/* 2. 트렌드 분석 */}
                    <a
                        href="/trend"
                        className="group relative overflow-hidden rounded-3xl p-[1px] animate-fade-in-up hover:scale-105 transition-all duration-300"
                        style={{ animationDelay: '0.2s' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-[#1A1A1E] h-full rounded-[23px] p-6 flex flex-col items-center text-center hover:bg-[#202025] transition-colors">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                <span className="text-2xl">📈</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">트렌드 분석</h2>
                            <p className="text-gray-400 text-xs leading-relaxed mb-4">
                                유튜브 실시간 트렌드<br />키워드 발굴
                            </p>
                        </div>
                    </a>

                    {/* 3. 전략 센터 */}
                    <a
                        href="/strategy"
                        className="group relative overflow-hidden rounded-3xl p-[1px] animate-fade-in-up hover:scale-105 transition-all duration-300"
                        style={{ animationDelay: '0.3s' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-[#1A1A1E] h-full rounded-[23px] p-6 flex flex-col items-center text-center hover:bg-[#202025] transition-colors">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                <span className="text-2xl">🧠</span>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">전략 센터</h2>
                            <p className="text-gray-400 text-xs leading-relaxed mb-4">
                                마케팅 전략 수립 및<br />시뮬레이션
                            </p>
                        </div>
                    </a>

                    {/* 4. 그룹웨어 (Placeholder) */}
                    <div
                        className="group relative overflow-hidden rounded-3xl p-[1px] animate-fade-in-up opacity-60 hover:opacity-100 transition-all duration-300 cursor-not-allowed"
                        style={{ animationDelay: '0.4s' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-600 via-gray-500 to-gray-600 opacity-30 group-hover:opacity-60 transition-opacity" />
                        <div className="relative bg-[#1A1A1E] h-full rounded-[23px] p-6 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-gray-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-2xl">🏢</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-300 mb-2">그룹웨어</h2>
                            <p className="text-gray-500 text-xs leading-relaxed mb-4">
                                준비 중입니다<br />(Coming Soon)
                            </p>
                        </div>
                    </div>

                </div>

                {/* 하단 네비게이션 */}
                <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <a href="/" className="text-sm text-gray-500 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">
                        ← 공용 홈페이지로 돌아가기
                    </a>
                </div>

            </div>
        </div>
    );
}
