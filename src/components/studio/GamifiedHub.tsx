'use client';

import React, { useState, useEffect } from 'react';
import {
    Coins, Trophy, Briefcase,
    Users, ChevronRight, Zap,
    Hammer, Palette, X, Info,
    MessageSquare, Lightbulb, TrendingUp, Target, Shield, MapPin, Monitor, Boxes
} from 'lucide-react';
import {
    getGameState, GameState, completeQuest,
    placeObject, removeObject
} from '@/lib/game-store';
import MetaverseStudio, { furnitureStyles, NPCExpert } from './MetaverseStudio';
import CEOExecutiveDashboard from './CEOExecutiveDashboard';
import TeamConsoleDashboard from './TeamConsoleDashboard';
import InventoryDashboard from './InventoryDashboard';

type RoomType = 'CEO' | 'MAIN' | 'STORAGE';

export default function GamifiedHub() {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [activeRoom, setActiveRoom] = useState<RoomType>('MAIN');
    const [showQuests, setShowQuests] = useState(false);
    const [playerPos, setPlayerPos] = useState({ x: 50, y: 55 });
    const [socialAction, setSocialAction] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
    const [activeInteraction, setActiveInteraction] = useState<NPCExpert | null>(null);
    const [activeDashboard, setActiveDashboard] = useState<'CEO' | 'TEAM_HUB' | 'INVENTORY' | null>(null);

    useEffect(() => {
        setGameState(getGameState());
    }, []);

    // Movement Logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditMode || activeInteraction) return;
            const step = 2; // Slower for precision in rooms
            setPlayerPos(prev => {
                let { x, y } = prev;
                if (e.key === 'ArrowUp') y = Math.max(5, y - step);
                if (e.key === 'ArrowDown') y = Math.min(95, y + step);
                if (e.key === 'ArrowLeft') x = Math.max(5, x - step);
                if (e.key === 'ArrowRight') x = Math.min(95, x + step);

                // Interaction Trigger [E]
                if (e.key.toLowerCase() === 'e') {
                    // This logic is partially handled by the Verse component's nearby logic
                    // But we can trigger based on the verse's state if we had it.
                    // Instead, let's let the click handler or Verse callback handle it.
                }

                return { x, y };
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditMode, activeInteraction]);

    const triggerAction = (action: string) => {
        setSocialAction(action);
        setTimeout(() => setSocialAction(null), 3000);
    };

    if (!gameState) return null;

    const quests = [
        { id: 'video_prod', title: '영상 프로덕션 가속', desc: '지감독과 협업하여 새로운 기업 PR 영상을 제작하세요.', xp: 120, gold: 50000, icon: Briefcase },
        { id: 'res_audit', title: '글로벌 리서치 검토', desc: 'Frank 리서처와 함께 최신 AI 트렌드를 분석하세요.', xp: 80, gold: 25000, icon: TrendingUp },
        { id: 'ai_optim', title: 'AI 엔진 최적화', desc: '박박사와 함께 환각 현상을 억제하고 성능을 개선하세요.', xp: 200, gold: 100000, icon: Zap },
    ];

    const handleQuestComplete = (id: string, xp: number, gold: number) => {
        const newState = completeQuest(id, xp, gold);
        setGameState(newState);
    };

    const handlePlaceObject = (x: number, y: number) => {
        if (!selectedFurniture) return;
        const newObj = {
            id: `furniture-${Date.now()}`,
            type: selectedFurniture,
            x: Math.round(x),
            y: Math.round(y)
        };
        const newState = placeObject(newObj);
        setGameState(newState);
    };

    const handleRemoveObject = (id: string) => {
        const newState = removeObject(id);
        setGameState(newState);
    };

    return (
        <div className="w-full h-full bg-[#030712] flex flex-col font-mono text-black select-none overflow-hidden">

            {/* RPG MASTER HUD (Enterprise Version) */}
            <div className="h-20 bg-white border-b-8 border-black px-8 flex items-center justify-between z-[70] shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-14 h-14 bg-blue-600 border-4 border-black flex items-center justify-center shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                            <span className="text-white font-black text-2xl">{gameState.level}</span>
                        </div>
                    </div>
                    <div className="w-64 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-black uppercase italic">
                            <span>HQ Expansion XP</span>
                            <span className="text-blue-600 font-black">{gameState.xp} / {gameState.maxXp}</span>
                        </div>
                        <div className="h-5 bg-zinc-800 border-3 border-black p-0.5">
                            <div
                                className="h-full bg-blue-500 transition-all duration-1000"
                                style={{ width: `${(gameState.xp / gameState.maxXp) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-[#fbbf24] border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                            <Coins size={22} />
                        </div>
                        <div className="text-lg font-black tracking-tight underline decoration-4 decoration-amber-300">₩ {gameState.gold.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500 p-2.5 border-3 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                            <Users size={22} />
                        </div>
                        <div className="text-lg font-black text-emerald-700">14인 전문가 그룹</div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`px-6 py-2.5 border-4 border-black text-[14px] font-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-2 active:shadow-none translate-x-0
                        ${isEditMode ? 'bg-amber-500' : 'bg-black text-white hover:bg-zinc-800'}`}>
                        {isEditMode ? <X size={16} /> : <Hammer size={16} />}
                        {isEditMode ? '배치 종료' : '오피스 확장'}
                    </button>
                    <button
                        onClick={() => setShowQuests(!showQuests)}
                        className="px-6 py-2.5 border-4 border-black bg-blue-600 text-white text-[14px] font-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-blue-500">
                        <Trophy size={16} /> 프로젝트
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">

                <div className="w-24 bg-[#010204] border-r-8 border-black flex flex-col items-center py-10 gap-8 z-40">
                    <div className="text-[10px] font-black text-white/30 uppercase [writing-mode:vertical-lr] mb-10 tracking-widest">HQ_NAVIGATION</div>
                    {[
                        { id: 'CEO', icon: Shield, color: 'bg-blue-500', name: '대표이사 HQ' },
                        { id: 'REGIONS', icon: MapPin, color: 'bg-amber-500', name: '지점 관리' },
                        { id: 'DEPTS', icon: MessageSquare, color: 'bg-emerald-500', name: '전문 부서' }
                    ].map(room => (
                        <button
                            key={room.id}
                            onClick={() => {
                                setActiveRoom(room.id as RoomType);
                                if (room.id === 'CEO') setPlayerPos({ x: 50, y: 22 });
                                if (room.id === 'REGIONS') setPlayerPos({ x: 12, y: 45 });
                                if (room.id === 'DEPTS') setPlayerPos({ x: 50, y: 55 });
                            }}
                            className={`w-14 h-14 border-4 border-black flex items-center justify-center transition-all shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none
                            ${activeRoom === room.id ? `${room.color} scale-110` : 'bg-zinc-900 text-zinc-600 hover:bg-zinc-800'}`}>
                            <room.icon size={26} className={activeRoom === room.id ? 'text-black' : ''} />
                        </button>
                    ))}
                </div>

                <div className="flex-1 relative bg-black">
                    <MetaverseStudio
                        playerPos={playerPos}
                        socialAction={socialAction}
                        isEditMode={isEditMode}
                        placedObjects={gameState.placedObjects}
                        selectedCatalogItem={selectedFurniture}
                        onObjectPlace={handlePlaceObject}
                        onObjectRemove={handleRemoveObject}
                        onInteractNPC={setActiveInteraction}
                    />

                    {/* NPC INTERACTION MODAL */}
                    {activeInteraction && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-12">
                            <div className="w-full max-w-2xl bg-white border-4 border-black shadow-[20px_20px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="bg-[#1e293b] px-8 py-4 flex justify-between items-center border-b-4 border-black">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${activeInteraction.color} border-3 border-black p-0.5`}>
                                            <div className="w-full h-full bg-white/20" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-sm font-black uppercase tracking-widest">{activeInteraction.name}</span>
                                            <span className="text-blue-400 text-[10px] font-black">{activeInteraction.expertise} 전문가</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveInteraction(null)} className="w-10 h-10 bg-rose-600 border-2 border-black text-white font-black hover:bg-rose-500">✕</button>
                                </div>
                                <div className="p-10 space-y-8 bg-zinc-50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <MessageSquare size={120} />
                                    </div>

                                    <div className="space-y-4">
                                        <span className="bg-black text-white text-[10px] px-2 py-1 font-black italic">EXPERT CONCERN</span>
                                        <p className="text-2xl font-black leading-tight text-zinc-800 break-keep">
                                            "{activeInteraction.concern}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {activeInteraction.id === 'sec_lee' ? (
                                            <button
                                                onClick={() => setActiveDashboard('CEO')}
                                                className="col-span-2 p-6 bg-amber-500 border-4 border-black hover:bg-amber-400 transition-all flex items-center justify-center gap-4 group shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                                            >
                                                <Shield className="text-black group-hover:scale-110 transition-transform" size={32} />
                                                <span className="text-lg font-black text-black">대표실 AI 대시보드 접속</span>
                                            </button>
                                        ) : activeInteraction.id === 'council_system' ? (
                                            <>
                                                <button
                                                    onClick={() => setActiveDashboard('TEAM_HUB')}
                                                    className="p-6 bg-amber-500 border-4 border-black hover:bg-amber-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                                                >
                                                    <Monitor className="text-black group-hover:scale-110 transition-transform" size={28} />
                                                    <span className="text-xs font-black text-black">전략 통합 콘솔</span>
                                                </button>
                                                <button
                                                    onClick={() => setActiveDashboard('INVENTORY')}
                                                    className="p-6 bg-emerald-500 border-4 border-black hover:bg-emerald-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                                                >
                                                    <Boxes className="text-black group-hover:scale-110 transition-transform" size={28} />
                                                    <span className="text-xs font-black text-black">실시간 재고 체크</span>
                                                </button>
                                            </>
                                        ) : ['mkt_lead', 'ai_dr_lee', 'data_dan', 'it_jake'].includes(activeInteraction.id) ? (
                                            <button
                                                onClick={() => setActiveDashboard('TEAM_HUB')}
                                                className="col-span-2 p-6 bg-blue-600 border-4 border-black hover:bg-blue-500 transition-all flex items-center justify-center gap-4 group shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                                            >
                                                <Monitor className="text-white group-hover:scale-110 transition-transform" size={32} />
                                                <span className="text-lg font-black text-white">전략 회의실/콘솔 진입</span>
                                            </button>
                                        ) : (
                                            <>
                                                <button className="p-6 bg-white border-4 border-black hover:bg-blue-50 transition-all flex flex-col gap-2 group shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                                                    <Lightbulb className="text-amber-500 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[12px] font-black">해결 아이디어 제시</span>
                                                </button>
                                                <button className="p-6 bg-white border-4 border-black hover:bg-emerald-50 transition-all flex flex-col gap-2 group shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
                                                    <TrendingUp className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[12px] font-black">프로젝트 예산 지원</span>
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-zinc-200/50 p-4 border-2 border-dashed border-zinc-400">
                                        <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2 italic">
                                            <Info size={12} /> 전문가의 고민을 해결해주면 XP와 추가 보상을 획득할 수 있습니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dashboards Overlay */}
                    {activeDashboard === 'CEO' && <CEOExecutiveDashboard onClose={() => setActiveDashboard(null)} />}
                    {activeDashboard === 'TEAM_HUB' && <TeamConsoleDashboard onClose={() => setActiveDashboard(null)} />}
                    {activeDashboard === 'INVENTORY' && <InventoryDashboard onClose={() => setActiveDashboard(null)} />}

                    {isEditMode && (
                        <div className="absolute top-8 right-8 w-64 bg-white border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,0.6)] flex flex-col z-[100] animate-in slide-in-from-right-4">
                            <div className="bg-amber-500 p-3 border-b-4 border-black flex items-center gap-2">
                                <Palette size={18} />
                                <span className="text-xs font-black uppercase tracking-tight">HQ 인테리어 팔레트</span>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3 max-h-[450px] overflow-y-auto bg-zinc-50">
                                {Object.entries(furnitureStyles).map(([type, style]: [string, any]) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedFurniture(type)}
                                        className={`p-3 border-2 border-black transition-all flex flex-col items-center gap-2 hover:bg-amber-100 active:scale-95
                                        ${selectedFurniture === type ? 'bg-amber-100 ring-4 ring-amber-500/30' : 'bg-white'}`}
                                    >
                                        <div className="scale-50 h-10 flex items-center justify-center">
                                            {style.render()}
                                        </div>
                                        <span className="text-[7px] font-black text-center uppercase leading-none">{style.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isEditMode && !activeInteraction && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-4 bg-white border-b-8 border-x-4 border-t-4 border-black shadow-[16px_16px_0_0_rgba(0,0,0,0.5)] z-50">
                            {[
                                { id: 'WAVE', icon: '👋', label: '업무 지시' },
                                { id: 'HEART', icon: '✨', label: '특별 격려' },
                                { id: 'DANCE', icon: '📈', label: '성과 보고' }
                            ].map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => triggerAction(action.id)}
                                    className="w-16 h-16 border-4 border-black bg-zinc-100 hover:bg-white transition-all shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center justify-center group relative active:translate-x-1 active:translate-y-1 active:shadow-none"
                                >
                                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{action.icon}</span>
                                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black text-white text-[10px] font-black opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-md">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {showQuests && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-12">
                            <div className="w-full max-w-xl bg-white border-4 border-black shadow-[24px_24px_0_0_rgba(0,0,0,1)] flex flex-col animate-in zoom-in-95">
                                <div className="bg-blue-600 px-8 py-5 flex justify-between items-center border-b-4 border-black">
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest">ENTERPRISE_PIPELINE</h3>
                                    <button onClick={() => setShowQuests(false)} className="w-10 h-10 bg-black border-2 border-white text-white font-black hover:bg-zinc-800">✕</button>
                                </div>
                                <div className="p-8 space-y-6 bg-zinc-50 overflow-y-auto max-h-[70vh]">
                                    {quests.map(q => {
                                        const isDone = gameState.completedQuests.includes(q.id);
                                        return (
                                            <div key={q.id} className={`p-6 border-4 flex items-center gap-6 transition-all
                                                ${isDone ? 'border-zinc-300 opacity-50 bg-zinc-100' : 'border-black bg-white shadow-[10px_10px_0_0_rgba(0,0,0,1)]'}`}>
                                                <div className="w-16 h-16 border-4 border-black bg-blue-100 flex items-center justify-center">
                                                    {React.createElement(q.icon, { size: 32, className: "text-blue-600" })}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-lg font-black leading-tight uppercase">{q.title}</div>
                                                    <p className="text-[10px] text-zinc-500 font-bold mt-1">{q.desc}</p>
                                                </div>
                                                {!isDone && (
                                                    <button
                                                        onClick={() => handleQuestComplete(q.id, q.xp, q.gold)}
                                                        className="px-6 py-3 bg-black text-white text-[11px] font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[-2px]">
                                                        실행
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-14 bg-black border-t-8 border-[#1e293b] flex items-center px-10 gap-10 overflow-hidden z-50">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[12px] font-black text-white uppercase tracking-widest italic">HQ_OS :: OPERATIONAL_ONLINE</span>
                </div>
                <div className="flex-1 text-[11px] text-zinc-600 font-bold overflow-hidden flex items-center gap-12">
                    <span className="animate-marquee whitespace-nowrap">[CORE] 11 DEPARTMENTS SECURED.</span>
                    <span className="animate-marquee whitespace-nowrap">[BIO] EXPERTS ONLINE: KIM, LEE, PARK, FRANK, ALICE, BOB, DIANA, EVE...</span>
                    <span className="animate-marquee whitespace-nowrap">[STAT] STRategic Scale: 1200% ABOVE BASELINE.</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
}
