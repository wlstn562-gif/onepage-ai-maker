'use client';

import React, { useState } from 'react';
import {
    Globe, Building2, Banknote, Heart, Rocket,
    ArrowRight, MessageSquare, TrendingUp, Mic,
    BrainCircuit, Calendar, X
} from 'lucide-react';

type ModuleType = 'NATION' | 'BUSINESS' | 'MONEY' | 'HEALTH' | 'FUTURE';

interface CEOExecutiveDashboardProps {
    onClose: () => void;
}

export default function CEOExecutiveDashboard({ onClose }: CEOExecutiveDashboardProps) {
    const [activeModule, setActiveModule] = useState<ModuleType | null>(null);

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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="w-full h-full max-w-[1400px] max-h-[900px] bg-[#030712] border-4 border-[#ffbf24] shadow-[0_0_80px_rgba(251,191,36,0.15)] rounded-[40px] flex flex-col overflow-hidden relative font-sans animate-in zoom-in-95 duration-300">

                {/* Header Section */}
                <div className="p-10 flex justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                            CEO Executive Room
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Private AI Dashboard for Decision Making
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm">
                            <Calendar className="w-4 h-4 text-yellow-500" />
                            <span>2026. 02. 12 (목)</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 bg-rose-600/20 border-2 border-rose-500/50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 p-10 overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                        {/* Welcome Insight Card */}
                        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#0f172a] to-[#020617] border border-white/10 rounded-[32px] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:bg-yellow-500/20 transition-all duration-700" />

                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <BrainCircuit className="w-8 h-8 text-yellow-400" />
                                    오늘의 인사이트
                                </h2>
                                <p className="text-gray-300 text-xl leading-relaxed max-w-3xl">
                                    "대표님, 오늘은 <span className="text-blue-400 font-bold">미국 금리 인상 이슈</span>가
                                    국내 시장에 미치는 영향에 대한 리포트가 준비되어 있습니다.
                                    또한, 오후 2시 <span className="text-amber-400 font-bold">채용 면접</span> 일정과 관련하여
                                    지원자 3명의 AI 분석 요약본을 확인하실 수 있습니다."
                                </p>
                            </div>

                            <div className="mt-10 flex gap-4 relative z-10">
                                <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black hover:scale-105 transition-all shadow-xl shadow-yellow-500/20 flex items-center gap-3">
                                    <Mic className="w-6 h-6" />
                                    아침 브리핑 듣기
                                </button>
                                <button className="px-8 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3">
                                    <MessageSquare className="w-6 h-6 text-blue-400" />
                                    AI 비서와 대화하기
                                </button>
                            </div>
                        </div>

                        {/* Module Grid Items */}
                        {modules.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => setActiveModule(module.id)}
                                className={`relative rounded-[32px] p-8 border transition-all duration-300 cursor-pointer group hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/10
                                ${module.bg} ${module.border} backdrop-blur-md`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl bg-black/40 border border-white/10 ${module.color}`}>
                                        <module.icon className="w-8 h-8" />
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-blue-200/50 text-sm font-black tracking-widest uppercase mb-4">
                                    {module.subtitle}
                                </p>

                                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                    {module.description}
                                </p>

                                <div className="flex gap-4">
                                    {module.stats.map((stat, i) => (
                                        <div key={i} className="flex-1 bg-black/30 rounded-xl p-4 border border-white/5">
                                            <div className="text-[10px] font-black text-gray-500 mb-1 uppercase tracking-tighter">{stat.label}</div>
                                            <div className="text-base font-black text-white">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sub-module Modal (Internal to Dashboard) */}
                {activeModule && (
                    <div className="absolute inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500">
                        <div className="p-10 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-3xl font-black text-white flex items-center gap-4">
                                {(() => {
                                    const m = modules.find(m => m.id === activeModule);
                                    if (!m) return null;
                                    const Icon = m.icon;
                                    return <><Icon className={`w-10 h-10 ${m.color}`} /> {m.title}</>;
                                })()}
                            </h2>
                            <button
                                onClick={() => setActiveModule(null)}
                                className="px-6 py-2 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10"
                            >
                                ✕ 뒤로가기
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-8">
                            <TrendingUp className="w-32 h-32 text-white/5 animate-pulse" />
                            <div className="text-center">
                                <p className="text-2xl text-gray-400 font-medium mb-2">"{modules.find(m => m.id === activeModule)?.subtitle}"</p>
                                <p className="text-lg text-zinc-600">실시간 AI 엔진 데이터 분석이 진행 중입니다...</p>
                            </div>
                            <button className="px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-yellow-500/20">
                                AI 집중 분석 시작
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
