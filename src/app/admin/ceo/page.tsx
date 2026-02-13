'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Globe, Building2, Banknote, Heart, Rocket,
    ArrowRight, MessageSquare, TrendingUp, Mic,
    BrainCircuit, Bell, Calendar
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function CEOExecRoomContent() {
    const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const key = searchParams.get('key');
        if (key !== 'edsence_ceo') {
            alert('접근 권한이 없습니다.');
            router.push('/');
        } else {
            setAuthorized(true);
        }
    }, [searchParams, router]);

    if (!authorized) return null;

    // --- Module Data ---
    const modules = [
        {
            id: 'NATION',
            title: '나라걱정 (Nation)',
            subtitle: '정치/사회 이슈 AI 요약 & 팟캐스트',
            icon: Globe,
            color: 'text-blue-400',
            bg: 'bg-blue-900/20',
            border: 'border-blue-500/30',
            description: '유튜브(좌/우파) 및 뉴스 데이터를 수집하여 매일 아침 핵심 이슈를 브리핑합니다.',
            stats: [
                { label: '오늘의 이슈', value: '5건' },
                { label: '감성 분석', value: '부정 60%' }
            ]
        },
        {
            id: 'BUSINESS',
            title: '사업걱정 (Business)',
            subtitle: '경영 전략 & HR 의사결정 지원',
            icon: Building2,
            color: 'text-amber-400',
            bg: 'bg-amber-900/20',
            border: 'border-amber-500/30',
            description: '직원 인사 문제, 신규 사업 아이템 발굴 등 복잡한 경영 고민을 AI와 상의하세요.',
            stats: [
                { label: '진행 중 프로젝트', value: '3개' },
                { label: '이번 달 매출 목표', value: '85%' }
            ]
        },
        {
            id: 'MONEY',
            title: '돈관리 (Finance)',
            subtitle: '법인/개인 자산 통합 대시보드',
            icon: Banknote,
            color: 'text-emerald-400',
            bg: 'bg-emerald-900/20',
            border: 'border-emerald-500/30',
            description: 'ERP 연동 법인 자금 현황과 개인 자산 포트폴리오를 한눈에 파악합니다.',
            stats: [
                { label: '법인 통장 잔고', value: '₩124.5M' },
                { label: '개인 투자 수익률', value: '+12.4%' }
            ]
        },
        {
            id: 'HEALTH',
            title: '건강관리 (Health)',
            subtitle: '바이오리듬 & 약 복용 스케줄러',
            icon: Heart,
            color: 'text-rose-400',
            bg: 'bg-rose-900/20',
            border: 'border-rose-500/30',
            description: '워치 데이터와 연동하여 수면 패턴, 운동량, 투약 스케줄을 관리합니다.',
            stats: [
                { label: '수면 평점', value: '85점' },
                { label: '오늘의 운동', value: '30분' }
            ]
        },
        {
            id: 'FUTURE',
            title: '미래걱정 (Future)',
            subtitle: 'AI 트렌드 & 미래 먹거리 발굴',
            icon: Rocket,
            color: 'text-purple-400',
            bg: 'bg-purple-900/20',
            border: 'border-purple-500/30',
            description: '급변하는 기술 트렌드와 미래 예측 리포트를 통해 다음 스텝을 준비합니다.',
            stats: [
                { label: 'AI 뉴스 요약', value: '12건' },
                { label: '관심 키워드', value: 'AGI, 로봇' }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-gold-500 selection:text-black">

            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                        CEO Executive Room
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Private AI Dashboard for Decision Making
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-700 text-gray-300 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>2026. 02. 12 (목)</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600 flex items-center justify-center">
                        <span className="font-bold text-yellow-500">CEO</span>
                    </div>
                </div>
            </header>

            {/* Main Grid */}
            <main className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">

                    {/* Welcome / Status Card (Span 2) */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-700"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <BrainCircuit className="w-6 h-6 text-yellow-400" />
                                오늘의 인사이트
                            </h2>
                            <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                                "대표님, 오늘은 <span className="text-blue-400 font-bold">미국 금리 인상 이슈</span>가
                                국내 시장에 미치는 영향에 대한 리포트가 준비되어 있습니다.
                                또한, 오후 2시 <span className="text-amber-400 font-bold">채용 면접</span> 일정과 관련하여
                                지원자 3명의 AI 분석 요약본을 확인하실 수 있습니다."
                            </p>
                        </div>

                        <div className="mt-8 flex gap-3 relative z-10">
                            <button className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition flex items-center gap-2">
                                <Mic className="w-5 h-5" />
                                아침 브리핑 듣기
                            </button>
                            <button className="px-6 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 border border-gray-700 transition flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                AI 비서와 대화하기
                            </button>
                        </div>
                    </div>

                    {/* Module Cards */}
                    {modules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => {
                                if (module.id === 'MONEY' || module.id === 'HEALTH') {
                                    router.push(`/admin/ceo/${module.id.toLowerCase()}?key=edsence_ceo`);
                                } else {
                                    setActiveModule(module.id as ModuleType);
                                }
                            }}
                            className={`
                                relative rounded-3xl p-6 border transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-500/10
                                ${module.bg} ${module.border} backdrop-blur-sm
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-black/40 border border-white/10 ${module.color}`}>
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <ArrowRight className={`w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-300`} />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-200 transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4 font-medium">
                                {module.subtitle}
                            </p>

                            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
                                {module.description}
                            </p>

                            <div className="flex gap-3 mt-auto">
                                {module.stats.map((stat, i) => (
                                    <div key={i} className="flex-1 bg-black/30 rounded-lg p-3 border border-white/5">
                                        <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                                        <div className="text-sm font-bold text-white">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                </div>
            </main>

            {/* Modal / Detail View Placeholder */}
            {activeModule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/50">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                {(() => {
                                    const m = modules.find(m => m.id === activeModule);
                                    if (!m) return null;
                                    const Icon = m.icon;
                                    return (
                                        <>
                                            <Icon className={`w-8 h-8 ${m.color}`} />
                                            {m.title}
                                        </>
                                    );
                                })()}
                            </h2>
                            <button
                                onClick={() => setActiveModule(null)}
                                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition"
                            >
                                ✕ 닫기
                            </button>
                        </div>

                        {/* Modal Content Area */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 gap-4">
                                <TrendingUp className="w-16 h-16 opacity-20" />
                                <p className="text-xl font-medium">
                                    "{modules.find(m => m.id === activeModule)?.subtitle}"<br />
                                    상세 대시보드는 준비 중입니다.
                                </p>
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    AI 분석 요청하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

type ModuleType = 'NATION' | 'BUSINESS' | 'MONEY' | 'HEALTH' | 'FUTURE';

export default function CEOExecRoom() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading CEO Dashboard...</div>}>
            <CEOExecRoomContent />
        </Suspense>
    );
}
