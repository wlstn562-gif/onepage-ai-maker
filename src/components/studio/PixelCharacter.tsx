'use client';

import React from 'react';

export interface PixelCharacterProps {
    name: string;
    role: string;
    color: string;
    status: 'acting' | 'idle' | 'working' | 'thinking';
    position: { x: number; y: number };
    socialEmote?: string | null;
}

const PixelCharacter = ({ name, role, color, status, position, socialEmote }: PixelCharacterProps) => {
    // Determine hair and skin based on name
    const hairStyle = name.length % 3; // 0: brown, 1: blonde, 2: dark
    const skinTone = name.length % 2 === 0 ? 'bg-[#ffdbac]' : 'bg-[#e0ac69]';

    // RPG Master Shading
    const hairColor = hairStyle === 0 ? 'bg-[#4a2c10]' : hairStyle === 1 ? 'bg-[#c6a664]' : 'bg-[#1a1a1a]';
    const hairHighlight = hairStyle === 0 ? 'bg-[#6b4226]' : hairStyle === 1 ? 'bg-[#dcc28c]' : 'bg-[#333333]';
    const faceShadow = 'bg-black/5';

    // Role Translation Map
    const roleMap: { [key: string]: string } = {
        'Analyst': '분석가',
        'Writer': '작가',
        'Director': '감독',
        'Boss': '대표',
        'Player': '나'
    };

    const displayRole = roleMap[role] || role;

    return (
        <div
            className="absolute transition-all duration-700 ease-in-out z-20 group"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
            <div className="flex flex-col items-center">
                {/* Status/Social Bubble (RPG Style) */}
                {(socialEmote || (status !== 'idle' && status !== 'acting')) && (
                    <div className="absolute -top-16 bg-white border-2 border-black p-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] z-30 animate-bounce flex items-center justify-center min-w-[40px]">
                        <span className="text-sm">
                            {socialEmote === 'WAVE' ? '👋' : socialEmote === 'HEART' ? '❤️' : socialEmote === 'DANCE' ? '🕺' :
                                status === 'working' ? '⌨️' : '💡'}
                        </span>
                        <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b-2 border-r-2 border-black rotate-45" />
                    </div>
                )}

                {/* RPG Master Character Sprite */}
                <div className="relative w-12 h-16 flex flex-col items-center">
                    {/* Character Shadow */}
                    <div className="absolute -bottom-1 w-10 h-2 bg-black/20 rounded-full" />

                    {/* Head - Trainer Style */}
                    <div className="relative z-10 w-11 h-10 border-2 border-black bg-white flex flex-col items-center overflow-hidden">
                        {/* Hair Layer 1 */}
                        <div className={`absolute -top-1 -left-1 -right-1 h-6 ${hairColor} border-b-2 border-black`} />
                        {/* Hair Highlight Layer */}
                        <div className={`absolute top-0 left-1 right-3 h-1 ${hairHighlight} opacity-40`} />

                        {/* Face with Shading */}
                        <div className={`w-full h-full ${skinTone} relative pt-5`}>
                            {/* Face Shadow (Left Side) */}
                            <div className={`absolute inset-0 w-2 h-full ${faceShadow}`} />

                            <div className="absolute top-5 left-3 w-1.5 h-2 bg-black" />
                            <div className="absolute top-5 right-2 w-1.5 h-2 bg-black" />

                            {/* Blush Dots */}
                            <div className="absolute top-7 left-2 w-1.5 h-0.5 bg-rose-400/40" />
                            <div className="absolute top-7 right-1 w-1.5 h-0.5 bg-rose-400/40" />
                        </div>
                    </div>

                    {/* Body - Detailed Outfit */}
                    <div className={`w-9 h-7 ${color} border-x-2 border-b-2 border-black flex flex-col items-center justify-end pb-1 relative`}>
                        {/* Collar Shading */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black/10" />
                        {/* Center Detail (Buttons/Line) */}
                        <div className="w-[1px] h-full bg-black/20 absolute left-1/2 -translate-x-1/2" />
                        {/* Feet/Shadow Detail */}
                        <div className="flex gap-1">
                            <div className="w-2 h-1 bg-black/30" />
                            <div className="w-2 h-1 bg-black/30" />
                        </div>
                    </div>
                </div>

                {/* Name Tag - Vintage RPG Style */}
                <div className="mt-3 bg-black/90 border-2 border-zinc-700 px-3 py-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] min-w-[70px] text-center">
                    <div className="text-[10px] font-bold text-white leading-none whitespace-nowrap tracking-widest">{name}</div>
                    <div className="text-[7px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">{displayRole}</div>
                </div>
            </div>
        </div>
    );
};

export default PixelCharacter;
