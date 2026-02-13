'use client';

import React from 'react';
import {
    Users, Monitor, Coffee, Search, Zap,
    Layout as LayoutIcon, Terminal, User, Star
} from 'lucide-react';

interface OfficeAvatarProps {
    name: string;
    role: string;
    color: string;
    status: 'working' | 'idle' | 'thinking';
    position: { x: number; y: number };
}

const OfficeAvatar = ({ name, role, color, status, position }: OfficeAvatarProps) => {
    // Generate distinct hair styles based on name hash for variety
    const hairStyle = name.length % 3; // 0: short, 1: long/bob, 2: spikey
    const skinTone = name.length % 2 === 0 ? 'bg-[#ffdbac]' : 'bg-[#e0ac69]';

    return (
        <div
            className="absolute transition-all duration-1000 ease-in-out z-20 group"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
            <div className="relative flex flex-col items-center">
                {/* Status Indicator */}
                <div className={`absolute -top-14 px-2 py-1 rounded-full text-[8px] font-black text-white shadow-lg transition-all scale-0 group-hover:scale-100 flex items-center gap-1 border border-white/20 ${status === 'working' ? 'bg-emerald-600' : status === 'thinking' ? 'bg-amber-500' : 'bg-zinc-600'
                    }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {status === 'working' ? '업무 중' : status === 'thinking' ? '고민 중' : '대기 중'}
                </div>

                {/* Detailed Human-like Character */}
                <div className="relative w-12 h-20 flex flex-col items-center translate-y-2">
                    {/* Shadow */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-black/30 blur-md rounded-full" />

                    {/* Head Entity */}
                    <div className="relative z-20">
                        {/* Hair */}
                        <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-6 ${hairStyle === 0 ? 'bg-[#2b1d0e] rounded-t-full' : hairStyle === 1 ? 'bg-[#4a2c10] rounded-full' : 'bg-[#1a1a1a] rounded-t-md'} shadow-sm`} />
                        {/* Face */}
                        <div className={`w-6 h-7 ${skinTone} rounded-full border border-black/10 relative overflow-hidden`}>
                            {/* Eyes */}
                            <div className="absolute top-2 left-1.5 w-1 h-1 bg-zinc-800 rounded-full" />
                            <div className="absolute top-2 right-1.5 w-1 h-1 bg-zinc-800 rounded-full" />
                        </div>
                    </div>

                    {/* Torso/Body */}
                    <div className="relative -mt-1 z-10">
                        {/* Arms/Shoulders */}
                        <div className={`w-10 h-10 ${color} rounded-t-xl rounded-b-md border border-white/10 shadow-lg relative flex justify-center`}>
                            {/* Collar/Shirt detail */}
                            <div className="mt-1 w-3 h-2 bg-white/20 rounded-full" />
                            {/* Sleeves movement animation */}
                            <div className="absolute -left-1 top-2 w-3 h-6 bg-inherit rounded-full rotate-[15deg] origin-top animate-wave" />
                            <div className="absolute -right-1 top-2 w-3 h-6 bg-inherit rounded-full -rotate-[15deg] origin-top animate-wave-delayed" />
                        </div>
                    </div>
                </div>

                {/* Premium Name Badge */}
                <div className="mt-4 bg-zinc-900/90 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full shadow-xl">
                    <div className="text-[10px] font-black text-white tracking-tight leading-none whitespace-nowrap">{name}</div>
                    <div className="text-[7px] text-zinc-400 font-bold text-center mt-0.5 uppercase tracking-tighter">{role}</div>
                </div>
            </div>

            <style jsx>{`
                @keyframes wave {
                    0%, 100% { transform: rotate(15deg); }
                    50% { transform: rotate(25deg); }
                }
                @keyframes wave-delayed {
                    0%, 100% { transform: rotate(-15deg); }
                    50% { transform: rotate(-25deg); }
                }
                .animate-wave { animation: wave 3s ease-in-out infinite; }
                .animate-wave-delayed { animation: wave-delayed 3s ease-in-out infinite; animation-delay: 1.5s; }
            `}</style>
        </div>
    );
};

interface HighFidelityOfficeProps {
    playerPos?: { x: number; y: number };
}

export default function HighFidelityOffice({ playerPos }: HighFidelityOfficeProps) {
    return (
        <div className="w-full h-full bg-[#0f0f12] overflow-hidden relative font-sans select-none perspective-1000">
            {/* Premium Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Isometric Content Container */}
            <div className="w-full h-full p-12 transition-all duration-500">
                <div className="w-full h-full relative rounded-[3rem] border border-white/5 bg-gradient-to-br from-zinc-900/50 to-black/80 shadow-2xl overflow-hidden">

                    {/* Glassmorphism zones */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-8 p-12">

                        {/* 1. Creative Studio (Top Left) */}
                        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm relative group overflow-hidden shadow-inner">
                            <div className="absolute top-6 left-8 flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-500">
                                    <LayoutIcon size={18} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">크리에이티브 스튜디오</span>
                            </div>

                            {/* Decorative Office Desk */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border border-white/5 bg-zinc-800/30 rounded-3xl rotate-12 flex flex-col p-4">
                                <div className="flex gap-2">
                                    <div className="w-12 h-8 bg-zinc-700/50 rounded-lg border border-white/5" />
                                    <div className="w-12 h-8 bg-zinc-700/50 rounded-lg border border-white/5" />
                                </div>
                                <div className="mt-auto self-end w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 animate-pulse" />
                            </div>

                            <OfficeAvatar name="찰리" role="메인 작가" color="bg-amber-600" status="working" position={{ x: 40, y: 40 }} />
                        </div>

                        {/* 2. Intelligence Unit (Top Right) */}
                        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm relative group overflow-hidden shadow-inner">
                            <div className="absolute top-6 left-8 flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30 text-cyan-500">
                                    <Search size={18} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">인텔리전스 유닛</span>
                            </div>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 border border-white/5 bg-zinc-800/30 rounded-3xl -rotate-6 flex flex-col p-4">
                                <div className="w-full h-full rounded-2xl bg-black/40 border border-white/5 p-3 overflow-hidden">
                                    <div className="w-full h-2 bg-cyan-500/20 rounded-full mb-2" />
                                    <div className="w-2/3 h-2 bg-cyan-500/20 rounded-full" />
                                </div>
                            </div>

                            <OfficeAvatar name="프랭크" role="데이터 분석" color="bg-cyan-600" status="thinking" position={{ x: 35, y: 45 }} />
                        </div>

                        {/* 3. Production Hub (Bottom Left) */}
                        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm relative group overflow-hidden shadow-inner">
                            <div className="absolute top-6 left-8 flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-500">
                                    <Monitor size={18} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">프로덕션 허브</span>
                            </div>

                            <OfficeAvatar name="다이애나" role="영상 편집" color="bg-emerald-600" status="working" position={{ x: 50, y: 35 }} />
                        </div>

                        {/* 4. Strategy Lounge (Bottom Right) */}
                        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm relative group overflow-hidden shadow-inner">
                            <div className="absolute top-6 left-8 flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-500">
                                    <Zap size={18} />
                                </div>
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">전략실</span>
                            </div>

                            <OfficeAvatar name="앨리스" role="총괄 감독" color="bg-rose-600" status="idle" position={{ x: 45, y: 50 }} />
                        </div>
                    </div>

                    {/* Player Character (CEO) */}
                    {playerPos && (
                        <div
                            className="absolute z-40 transition-all duration-300 ease-out"
                            style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* Glow Underneath */}
                                <div className="absolute -inset-12 bg-amber-400/10 blur-[40px] rounded-full animate-pulse pointer-events-none" />

                                {/* CEO Premium Badge */}
                                <div className="absolute -top-14 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full text-[10px] font-black text-black shadow-2xl ring-2 ring-white/50 animate-bounce flex items-center gap-2">
                                    <Star size={12} fill="currentColor" /> 나 (CEO)
                                </div>

                                {/* Human CEO Model */}
                                <div className="relative w-14 h-22 flex flex-col items-center">
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/40 blur-lg rounded-full" />

                                    {/* Head */}
                                    <div className="relative z-20">
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-7 bg-zinc-800 rounded-t-full shadow-sm" />
                                        <div className="w-7 h-8 bg-[#ffdbac] rounded-full border border-black/10 relative">
                                            <div className="absolute top-2.5 left-2 w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                            <div className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-zinc-800 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Suit / Body */}
                                    <div className="relative -mt-1 z-10">
                                        <div className="w-12 h-12 bg-zinc-900 rounded-t-2xl rounded-b-lg border-2 border-white/20 shadow-2xl flex justify-center">
                                            <div className="mt-1 w-4 h-5 bg-white border-x-4 border-zinc-900" />
                                            <div className="absolute -left-1 top-2 w-3.5 h-8 bg-zinc-900 rounded-full rotate-[15deg] origin-top animate-wave" />
                                            <div className="absolute -right-1 top-2 w-3.5 h-8 bg-zinc-900 rounded-full -rotate-[15deg] origin-top animate-wave-delayed" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Common Office Elements (Floating Assets) */}
                    <div className="absolute top-1/2 right-12 flex flex-col gap-4 opacity-40">
                        {/* Coffee Machine */}
                        <div className="w-10 h-10 bg-zinc-800 border-2 border-white/5 rounded-lg flex flex-col p-1">
                            <div className="w-full h-2 bg-emerald-500/20 rounded-sm mb-1" />
                            <Coffee size={14} className="text-zinc-500 m-auto" />
                        </div>
                        {/* Water Cooler */}
                        <div className="w-8 h-12 bg-zinc-800 border-2 border-white/5 rounded-t-full flex flex-col">
                            <div className="flex-1 bg-cyan-500/10" />
                            <div className="h-4 bg-zinc-700" />
                        </div>
                    </div>

                    {/* Scanning Overlay (Premium feel) */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent bg-[length:100%_4px] animate-scanline" />
                </div>
            </div>

            <style jsx>{`
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .animate-scanline {
                    animation: scanline 8s linear infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
}
