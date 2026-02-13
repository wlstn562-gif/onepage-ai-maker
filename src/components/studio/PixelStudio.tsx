'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Terminal, Coffee, Zap, Code, Search, PenTool, Layout as LayoutIcon } from 'lucide-react';
import PixelCharacter from './PixelCharacter';

interface PixelStudioProps {
    playerPos?: { x: number; y: number };
}

export default function PixelStudio({ playerPos }: PixelStudioProps) {
    return (
        <div className="w-full h-full bg-[#1a1c2c] overflow-hidden relative font-mono select-none">
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#4f4f4f 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            {/* Studio Floor */}
            <div className="m-8 border-4 border-[#333c57] bg-[#566c86] h-[calc(100%-64px)] relative shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">

                {/* Player Character */}
                {playerPos && (
                    <div className="absolute z-30 pointer-events-none" style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}>
                        <div className="absolute -inset-4 bg-amber-400/20 blur-xl rounded-full animate-pulse" />
                        <PixelCharacter name="나 (CEO)" role="Boss" color="bg-zinc-100" status="idle" position={{ x: 0, y: 0 }} />
                    </div>
                )}

                {/* Top Center Label */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#333c57] border-2 border-white px-6 py-1 z-20">
                    <span className="text-white text-xs font-bold tracking-widest">비디오 스튜디오</span>
                </div>

                {/* Zones Layer */}
                <div className="grid grid-cols-2 grid-rows-2 h-full gap-4 p-4">
                    {/* 1. Research Lab (Top Left) */}
                    <div className="border-2 border-cyan-500 bg-cyan-950/20 relative group overflow-hidden">
                        <div className="absolute top-2 left-2 flex items-center gap-2 bg-cyan-600 px-2 py-0.5 text-[8px] font-black text-white">
                            <Search size={10} /> 리서치 랩
                        </div>
                        <div className="absolute bottom-4 right-4 opacity-10 group-hover:rotate-12 transition-transform">
                            <Bot size={64} className="text-cyan-400" />
                        </div>

                        {/* Furniture */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-[#333c57] border-t-4 border-cyan-400/30" />

                        <PixelCharacter name="Frank" role="리서처" color="bg-cyan-500" status="working" position={{ x: 45, y: 35 }} />
                    </div>

                    {/* 2. Director Room (Top Right) */}
                    <div className="border-2 border-amber-500 bg-amber-950/20 relative group">
                        <div className="absolute top-2 left-2 flex items-center gap-2 bg-amber-600 px-2 py-0.5 text-[8px] font-black text-white">
                            <Zap size={10} /> 감독관실
                        </div>

                        {/* Large Desk Cluster */}
                        <div className="absolute top-1/3 left-1/4 w-40 h-24 border-2 border-zinc-700 bg-zinc-800/50" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-2 gap-2">
                            <div className="w-8 h-8 bg-zinc-700 border border-zinc-500" />
                            <div className="w-8 h-8 bg-zinc-700 border border-zinc-500" />
                        </div>

                        <PixelCharacter name="Alice" role="감독" color="bg-amber-400" status="thinking" position={{ x: 40, y: 30 }} />
                        <PixelCharacter name="Bob" role="프로듀서" color="bg-zinc-400" status="idle" position={{ x: 55, y: 55 }} />
                    </div>

                    {/* 3. Editing Suite (Bottom Left) */}
                    <div className="border-2 border-emerald-500 bg-emerald-950/20 relative group">
                        <div className="absolute top-2 left-2 flex items-center gap-2 bg-emerald-600 px-2 py-0.5 text-[8px] font-black text-white">
                            <LayoutIcon size={10} /> 편집실
                        </div>

                        {/* Computer Stations */}
                        <div className="absolute bottom-1/4 left-1/4 flex gap-8">
                            <div className="w-12 h-12 bg-zinc-800 border-b-4 border-emerald-500/50" />
                            <div className="w-12 h-12 bg-zinc-800 border-b-4 border-emerald-500/50" />
                        </div>

                        <PixelCharacter name="Charlie" role="작가" color="bg-yellow-500" status="working" position={{ x: 25, y: 60 }} />
                        <PixelCharacter name="Diana" role="모션" color="bg-blue-500" status="working" position={{ x: 55, y: 60 }} />
                    </div>

                    {/* 4. QA & Support (Bottom Right) */}
                    <div className="border-2 border-rose-500 bg-rose-950/20 relative group">
                        <div className="absolute top-2 left-2 flex items-center gap-2 bg-rose-600 px-2 py-0.5 text-[8px] font-black text-white">
                            <Terminal size={10} /> 검수 센터 (QA)
                        </div>

                        <div className="absolute bottom-8 right-8 w-24 h-4 bg-black/40 skew-x-12" />

                        <PixelCharacter name="Eve" role="QA" color="bg-rose-500" status="idle" position={{ x: 45, y: 65 }} />
                    </div>
                </div>

                {/* Status HUD Overlay */}
                <div className="absolute bottom-6 left-6 flex items-center gap-4">
                    <div className="bg-black/90 border border-zinc-700 px-3 py-1.5 flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 animate-pulse rounded-full" />
                        <span className="text-[10px] text-zinc-400 font-bold tracking-tighter uppercase">시스템 상태: 최적화됨</span>
                    </div>
                    <div className="bg-black/90 border border-zinc-700 px-3 py-1.5 flex items-center gap-3">
                        <Coffee size={12} className="text-amber-400" />
                        <span className="text-[10px] text-zinc-400 font-bold tracking-tighter uppercase">에너지: 98%</span>
                    </div>
                </div>
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
        </div>
    );
}
