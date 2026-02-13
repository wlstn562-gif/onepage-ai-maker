'use client';

import React, { useState } from 'react';
import { TEAMS } from '@/lib/teams';
import {
    X, Send, Bot, LayoutGrid,
    CheckCircle2, RotateCcw, Monitor, Users
} from 'lucide-react';

interface TeamConsoleDashboardProps {
    onClose: () => void;
}

export default function TeamConsoleDashboard({ onClose }: TeamConsoleDashboardProps) {
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
    const [consoleMode, setConsoleMode] = useState<'team' | 'auto' | 'council'>('council');
    const [chatInput, setChatInput] = useState('');

    const activeTeam = TEAMS.find(t => t.id === activeTeamId);

    return (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[300] flex flex-col font-sans text-white animate-in slide-in-from-bottom-10 duration-500">

            {/* 1. Full-Fidelity Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950 px-6">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Monitor size={18} className="text-black" />
                        </div>
                        <h1 className="text-sm font-black tracking-tighter text-white uppercase italic">TEAM CONSOLE</h1>
                    </div>

                    {/* Mode Navigation (Match Screenshot) */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                        {[
                            { id: 'team', label: '팀선택', icon: LayoutGrid },
                            { id: 'auto', label: '자동 라우팅', icon: Bot },
                            { id: 'council', label: '전체 회의', icon: Users }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setConsoleMode(mode.id as any)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all
                                    ${consoleMode === mode.id
                                        ? 'bg-zinc-800 text-amber-500 shadow-lg ring-1 ring-white/10'
                                        : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <mode.icon size={14} />
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        System Online
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/5 border border-white/10 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-xl"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 2. Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                        <div className="mx-auto max-w-7xl">
                            {/* Mode Title Overlay */}
                            <div className="mb-8 flex items-end justify-between border-b border-white/5 pb-4">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter italic">
                                        {consoleMode === 'council' ? 'MASTER STRATEGY COUNCIL' :
                                            consoleMode === 'auto' ? 'INTELLIGENT AUTO-ROUTING' : 'TEAM SELECTION HUB'}
                                    </h2>
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
                                        {consoleMode === 'council' ? '전 부서 통합 지휘 통제실' :
                                            consoleMode === 'auto' ? 'AI 기반 최적 팀 자동 매칭' : '개별 부서 전문가 매칭'}
                                    </p>
                                </div>
                            </div>

                            {/* Grid View */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {TEAMS.map((team) => {
                                    const Icon = team.icon;
                                    const isActive = activeTeamId === team.id;
                                    const isCouncilMode = consoleMode === 'council';

                                    return (
                                        <button
                                            key={team.id}
                                            onClick={() => {
                                                setConsoleMode('team');
                                                setActiveTeamId(team.id);
                                            }}
                                            className={`group relative flex flex-col items-start justify-between rounded-3xl border p-8 text-left transition-all duration-300 h-[220px] overflow-hidden
                                                ${isActive
                                                    ? 'border-amber-500 bg-zinc-900 shadow-[0_0_40px_rgba(245,158,11,0.1)] -translate-y-1'
                                                    : 'border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-white/20'
                                                }
                                            `}
                                        >
                                            <div className={`mb-6 rounded-2xl p-4 transition-all duration-500 ${team.bgColor} ${team.color} 
                                                ${isCouncilMode ? 'animate-pulse scale-110 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}
                                                group-hover:scale-110`}>
                                                <Icon size={28} />
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-black tracking-tight ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                                    {team.name}
                                                </h3>
                                                <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 line-clamp-2 group-hover:text-zinc-400 font-medium tracking-tight">
                                                    {team.description}
                                                </p>
                                            </div>

                                            {isActive && (
                                                <div className="absolute top-6 right-6">
                                                    <div className="relative flex h-3 w-3">
                                                        <div className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-400" />
                                                        <div className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Execution Bar */}
                    <footer className="h-56 shrink-0 border-t border-white/5 bg-black p-8">
                        <div className="max-w-4xl mx-auto h-full flex flex-col justify-center items-center gap-4">

                            {/* Status Indicator */}
                            <div className="flex items-center gap-3 animate-in fade-in duration-500">
                                {consoleMode === 'council' ? (
                                    <>
                                        <div className="flex -space-x-3">
                                            {TEAMS.slice(0, 5).map(t => (
                                                <div key={t.id} className={`w-8 h-8 rounded-full border-2 border-black ${t.bgColor} flex items-center justify-center`}>
                                                    <t.icon size={14} className={t.color} />
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">+9</div>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 animate-pulse">● 전체 전문가 위원회 회의 중</span>
                                    </>
                                ) : consoleMode === 'auto' ? (
                                    <>
                                        <Bot size={18} className="text-blue-500 animate-spin-slow" />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">지능형 자동 라우팅 활성화됨</span>
                                    </>
                                ) : activeTeam ? (
                                    <>
                                        <span className={`w-3 h-3 rounded-full ${activeTeam.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`} />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{activeTeam.name} 연결됨</span>
                                        <button onClick={() => setActiveTeamId(null)} className="ml-4 text-[9px] font-black text-zinc-600 hover:text-white uppercase flex items-center gap-1 transition-colors">
                                            <RotateCcw size={10} /> 초기화
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Bot size={18} className="text-zinc-700" />
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700">작업을 수행할 전문가를 선택해주세요</span>
                                    </>
                                )}
                            </div>

                            {/* Input Field */}
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder={
                                        consoleMode === 'council' ? "전사 통합 지휘 메세지 입력..." :
                                            consoleMode === 'auto' ? "프로젝트 내용을 입력하면 AI가 팀을 매칭합니다..." :
                                                activeTeam ? `${activeTeam.name}에게 협업 지시...` : "팀을 선택하거나 메세지를 입력하세요..."
                                    }
                                    className={`w-full rounded-2xl border-2 py-5 pl-8 pr-16 text-white placeholder-zinc-700 focus:outline-none focus:ring-8 transition-all duration-300
                                        ${consoleMode === 'council' ? 'bg-zinc-900 border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/10' :
                                            consoleMode === 'auto' ? 'bg-zinc-900 border-blue-500/30 focus:border-blue-500 focus:ring-blue-500/10' :
                                                'bg-zinc-900/50 border-white/5 focus:border-white/20 focus:ring-white/5'}
                                    `}
                                />
                                <button className={`absolute right-3 top-3 bottom-3 w-12 rounded-xl flex items-center justify-center transition-all shadow-lg
                                    ${consoleMode === 'council' ? 'bg-amber-500 text-black hover:scale-110 shadow-amber-500/20' :
                                        consoleMode === 'auto' ? 'bg-blue-600 text-white hover:scale-110 shadow-blue-500/20' :
                                            'bg-white text-black hover:bg-zinc-200'}
                                `}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </footer>
                </main>

                {/* 3. Right: Artifacts Sidebar (Mock) */}
                <aside className="w-80 border-l border-white/5 bg-zinc-950/50 flex flex-col animate-in slide-in-from-right-10 duration-700">
                    <div className="h-16 shrink-0 border-b border-white/5 flex items-center px-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">협업 결과물 (ARTIFACTS)</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center gap-4 text-center opacity-30">
                        <CheckCircle2 size={40} className="text-zinc-800" />
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-600">아직 결과물이 없습니다</p>
                            <p className="text-[9px] font-medium text-zinc-700">대화와 작업을 지시하여 성과물을 창출하세요</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
