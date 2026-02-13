'use client';

import React, { useMemo } from 'react';
import { Trash2, Shield, MapPin, Briefcase, Zap, Search, PenTool, Layout, Users, Activity, Database, Coffee, Headset, BarChart3, HeartHandshake } from 'lucide-react';
import { PlacedObject } from '@/lib/game-store';
import PixelCharacter from '@/components/studio/PixelCharacter';

interface MetaverseStudioProps {
    playerPos: { x: number; y: number };
    socialAction: string | null;
    isEditMode?: boolean;
    placedObjects: PlacedObject[];
    selectedCatalogItem?: string | null;
    onObjectPlace?: (x: number, y: number) => void;
    onObjectRemove?: (id: string) => void;
    onInteractNPC?: (npc: NPCExpert) => void;
}

export interface NPCExpert {
    id: string;
    name: string;
    role: string;
    expertise: string;
    color: string;
    roomName: string;
    concern: string;
}

const ROOM_CONFIGS = [
    // --- CEO & REGIONAL BRANCHES ---
    { id: 'ceo', name: '대표이사 집무실 (HQ)', x: 42, y: 10, width: 16, height: 25, color: '#3b82f6', icon: Shield, expert: { id: 'sec_lee', name: '이비서', role: 'Executive Secretary', expertise: 'Schedule & Admin', color: 'bg-zinc-200', concern: '대표님, 오늘 지점별 현황 보고와 경영 부서 통합 회의가 예정되어 있습니다. 어떤 안건부터 처리할까요?' } },
    { id: 'cheonan', name: '천안점 (Branch)', x: 5, y: 10, width: 15, height: 20, color: '#f59e0b', icon: MapPin, expert: { id: 'br_cheonan', name: '천안팀장', role: 'Manager', expertise: 'Regional Ops', color: 'bg-orange-500', concern: '천안 지역 고객들은 오프라인 연계 서비스에 대한 기대치가 높은데, AI 도슨트를 도입해볼까요?' } },
    { id: 'cheongju', name: '청주점 (Branch)', x: 5, y: 35, width: 15, height: 20, color: '#f59e0b', icon: MapPin, expert: { id: 'br_cheongju', name: '청주팀장', role: 'Manager', expertise: 'Regional Ops', color: 'bg-amber-500', concern: '청주점의 물류 데이터가 AI 분석 결과와 조금씩 차이가 나고 있어요. 센서 정밀도를 높여야 할까요?' } },
    { id: 'daejeon', name: '대전점 (Branch)', x: 5, y: 60, width: 15, height: 20, color: '#f59e0b', icon: MapPin, expert: { id: 'br_daejeon', name: '대전팀장', role: 'Manager', expertise: 'Regional Ops', color: 'bg-yellow-500', concern: '대전은 타 지역보다 기술 수용도가 빠릅니다. 선도적인 AI 체험존을 대전점에 먼저 시범 운영해보고 싶습니다.' } },

    // --- FUNCTIONAL DEPARTMENTS ---
    { id: 'marketing', name: '마케팅 전략실', x: 23, y: 10, width: 16, height: 20, color: '#ec4899', icon: Users, expert: { id: 'mkt_lead', name: '최실장', role: 'Marketing Head', expertise: 'Viral & PR', color: 'bg-rose-400', concern: 'AI로 만든 영상 콘텐츠가 타겟 유저들에게 "광고"가 아닌 "정보"로 느껴지게 하는 스토리텔링의 한 끗이 필요합니다.' } },
    { id: 'cs', name: 'CS/고객지원실', x: 61, y: 10, width: 16, height: 20, color: '#06b6d4', icon: Headset, expert: { id: 'cs_amy', name: 'Amy', role: 'CS Specialist', expertise: 'User Happiness', color: 'bg-cyan-500', concern: '챗봇이 답변하지 못하는 복잡한 민원을 상담사에게 넘길 때, 앞선 문맥을 더 정확하게 요약해서 전달할 방법이 필요해요.' } },
    { id: 'analytics', name: '데이터/분석실', x: 80, y: 10, width: 15, height: 20, color: '#10b981', icon: BarChart3, expert: { id: 'data_dan', name: 'Dan', role: 'Data Analyst', expertise: 'Big Data', color: 'bg-emerald-600', concern: '지점별 유동 인구와 매출 상관계를 분석해보니, AI 추천 상품의 전환율이 주말에만 급증하는 이유를 찾고 있습니다.' } },

    { id: 'ai_research', name: 'AI 핵심 연구소', x: 23, y: 35, width: 16, height: 22, color: '#a855f7', icon: Zap, expert: { id: 'ai_dr_lee', name: '이박사', role: 'Chief Scientist', expertise: 'LLM & Vision', color: 'bg-purple-600', concern: '자체 훈련시킨 모델의 가중치가 특정 데이터에 편향되기 시작했습니다. 데이터셋의 다양성을 어떻게 확보할까요?' } },
    { id: 'finance', name: '재무/회계관리부', x: 42, y: 40, width: 16, height: 22, color: '#ef4444', icon: Briefcase, expert: { id: 'fin_kwon', name: '권이사', role: 'CFO', expertise: 'Equity & Taxation', color: 'bg-zinc-800', concern: '각 지점의 AI 설비 도입 비용을 리스 방식으로 돌리는게 나을지, 직접 구매해서 자산으로 잡는게 이득일지 고민입니다.' } },
    { id: 'qa', name: '품질/안전검수실', x: 61, y: 35, width: 16, height: 22, color: '#64748b', icon: Activity, expert: { id: 'qa_manager', name: '정부장', role: 'QA Manager', expertise: 'Safety Audit', color: 'bg-slate-600', concern: '생성된 AI 영상의 화질뿐만 아니라, 음성 합성(TTS) 과정에서 발생하는 미세한 노이즈까지 잡아야 명품 브랜드가 됩니다.' } },
    { id: 'creative', name: '크리에이티브 스튜디오', x: 80, y: 35, width: 15, height: 22, color: '#8b5cf6', icon: PenTool, expert: { id: 'cr_jane', name: 'Jane', role: 'Creative Dir', expertise: 'Design/Post-Prod', color: 'bg-violet-500', concern: 'AI 툴을 쓰더라도 "우리 스튜디오만의 색깔" 즉, 고유의 룩앤필(Look and Feel)을 지키는 가이드라인이 필요합니다.' } },

    { id: 'infra', name: 'IT 인프라 서버실', x: 23, y: 65, width: 16, height: 25, color: '#1e293b', icon: Database, expert: { id: 'it_jake', name: 'Jake', role: 'Infra Admin', expertise: 'Server Stability', color: 'bg-zinc-900', concern: '전지점 동시 접속량이 피크를 찍을 때, 클라우드 서버의 부하 분산 로직이 가끔 오작동합니다. 아키텍처 점검이 시급해요.' } },
    { id: 'hr', name: '인사/조직문화팀', x: 42, y: 68, width: 16, height: 22, color: '#6366f1', icon: HeartHandshake, expert: { id: 'hr_manager', name: '오팀장', role: 'HR Lead', expertise: 'Team Morale', color: 'bg-indigo-500', concern: 'AI 자동화로 인해 팀원들이 느끼는 "역할의 상실감"을 케어하고, AI를 도구로 즐겁게 일할 수 있는 문화를 만들고 싶어요.' } },
    { id: 'council', name: '전략 통합 회의실 (Council)', x: 61, y: 65, width: 34, height: 25, color: '#fbbf24', icon: Users, expert: { id: 'council_system', name: '전략 단말기', role: 'Central AI', expertise: 'Total Control', color: 'bg-zinc-800', concern: '모든 부서의 데이터가 동기화되었습니다. 전체 전략 콘솔(Team Hub)을 호출하시겠습니까?' } },
];

const furnitureStyles: { [key: string]: any } = {
    'OFFICE_DESK': {
        label: '컴퓨터 책상',
        render: () => (
            <div className="w-24 h-14 bg-[#7e5535] border-4 border-black relative shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                <div className="absolute top-1 left-2 w-10 h-8 bg-zinc-900 border-2 border-black flex items-center justify-center">
                    <div className="w-3/4 h-3/4 bg-sky-200/20 animate-pulse border border-white/10" />
                </div>
                <div className="absolute bottom-1 right-2 w-8 h-2 bg-zinc-800 border-2 border-black" />
            </div>
        )
    },
    'COMPUTER_SET': {
        label: '워크스테이션',
        render: () => (
            <div className="w-16 h-12 bg-zinc-800 border-4 border-black relative rounded-sm">
                <div className="absolute inset-1 bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-emerald-500/10 flex flex-col gap-0.5 p-0.5">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-0.5 bg-emerald-500/30 w-full" />)}
                    </div>
                </div>
            </div>
        )
    },
    'PLANT': {
        label: '화분',
        render: () => (
            <div className="w-8 h-10 relative flex flex-col items-center">
                <div className="w-10 h-8 bg-emerald-600 border-2 border-black rounded-full mb-[-4px] z-10" />
                <div className="w-6 h-4 bg-amber-800 border-2 border-black relative z-0" />
            </div>
        )
    }
};

export default function MetaverseStudio({
    playerPos,
    socialAction,
    isEditMode = false,
    placedObjects = [],
    selectedCatalogItem = null,
    onObjectPlace,
    onObjectRemove,
    onInteractNPC
}: MetaverseStudioProps) {

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditMode || !selectedCatalogItem) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onObjectPlace?.(x, y);
    };

    const nearbyNPC = useMemo(() => {
        for (const room of ROOM_CONFIGS) {
            const expertX = room.x + (room.width * 0.5);
            const expertY = room.y + (room.height * 0.4);
            const dx = Math.abs(playerPos.x - expertX);
            const dy = Math.abs(playerPos.y - expertY);
            if (dx < 5 && dy < 5) return { ...room.expert, roomName: room.name };
        }
        return null;
    }, [playerPos]);

    const currentRoom = useMemo(() => {
        return ROOM_CONFIGS.find(r =>
            playerPos.x >= r.x &&
            playerPos.x <= r.x + r.width &&
            playerPos.y >= r.y &&
            playerPos.y <= r.y + r.height
        );
    }, [playerPos]);

    return (
        <div className="w-full h-full bg-[#020617] overflow-hidden relative font-sans select-none flex items-center justify-center">

            {/* Backdrop */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute bottom-0 w-full flex items-end justify-between px-4 pb-20">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className="w-24 bg-[#020617] border-t-4 border-x-4 border-zinc-900" style={{ height: `${20 + (i * 7) % 60}%` }} />
                    ))}
                </div>
            </div>

            {/* GRAND HQ MAP WORLD */}
            <div
                className="relative z-10 w-[2400px] h-[1800px] bg-[#221a14] border-[16px] border-[#3e2723] transition-transform duration-700 ease-out flex-shrink-0"
                style={{
                    transform: `translate(${(50 - playerPos.x) * 20}px, ${(50 - playerPos.y) * 15}px)`,
                    backgroundImage: 'radial-gradient(#3e2723 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
                onClick={handleMapClick}
            >
                {/* 14 ADAPTIVE ROOMS */}
                {ROOM_CONFIGS.map(room => (
                    <div
                        key={room.id}
                        className={`absolute border-[6px] border-[#5d4037] bg-[#2c1e14] ${room.id === 'ceo' ? 'border-[#ffbf24] shadow-[0_0_40px_rgba(251,191,36,0.2)]' : ''}`}
                        style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.width}%`, height: `${room.height}%` }}
                    >
                        {/* Nameplate Overlay */}
                        <div className="absolute -top-[35px] left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
                            <div className={`border-4 border-black px-4 py-1.5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2
                                ${room.id === 'ceo' ? 'bg-[#fbbf24]' : 'bg-white'}`}>
                                <room.icon size={16} className={room.id === 'ceo' ? 'text-black' : 'text-zinc-500'} />
                                <span className={`text-[11px] font-black uppercase tracking-tight ${room.id === 'ceo' ? 'text-black' : 'text-zinc-800'}`}>{room.name}</span>
                            </div>
                        </div>

                        {/* Room Expert NPC */}
                        <div
                            className="absolute cursor-pointer z-40"
                            style={{ left: `50%`, top: `45%`, transform: 'translate(-50%, -50%)' }}
                            onClick={() => onInteractNPC?.({ ...room.expert, roomName: room.name } as NPCExpert)}
                        >
                            <PixelCharacter
                                name={room.expert.name}
                                role={room.expert.role}
                                color={room.expert.color}
                                status="idle"
                                position={{ x: 0, y: 0 }}
                            />
                            {nearbyNPC?.id === room.expert.id && (
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white text-[11px] font-black px-4 py-2 border-2 border-black animate-bounce shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                    [E] 고민 듣기
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Corridor / Hallway Guides */}
                <div className="absolute top-[32%] left-[20%] right-[3%] h-2 bg-black/10 z-10" />
                <div className="absolute top-[60%] left-[20%] right-[3%] h-2 bg-black/10 z-10" />
                <div className="absolute left-[20%] top-[5%] bottom-[5%] w-2 bg-black/10 z-10" />
                <div className="absolute left-[40%] top-[5%] bottom-[5%] w-2 bg-black/10 z-10" />
                <div className="absolute left-[60%] top-[5%] bottom-[5%] w-2 bg-black/10 z-10" />
                <div className="absolute left-[78%] top-[5%] bottom-[5%] w-2 bg-black/10 z-10" />

                {/* Objects Management */}
                {placedObjects.map((obj) => (
                    <div
                        key={obj.id}
                        className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 ${isEditMode ? 'ring-2 ring-blue-500 cursor-pointer pointer-events-auto' : 'pointer-events-none'}`}
                        style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
                    >
                        {furnitureStyles[obj.type]?.render()}
                        {isEditMode && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onObjectRemove?.(obj.id); }}
                                className="absolute -top-10 left-1/2 -translate-x-1/2 p-1.5 bg-rose-600 border-2 border-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}

                <div className="absolute z-50 transition-all duration-300 pointer-events-none" style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}>
                    <PixelCharacter name="대표이사 (나)" role="CEO" color="bg-white" status="acting" position={{ x: 0, y: 0 }} socialEmote={socialAction} />
                </div>
            </div>

            {/* Smart Location Indicator */}
            <div className="absolute top-28 left-32 z-[70] animate-in slide-in-from-left-6 duration-500">
                <div className={`border-4 border-black px-8 py-3 shadow-[10px_10px_0_0_rgba(0,0,0,1.0)] flex flex-col items-start gap-1
                    ${currentRoom?.id === 'ceo' ? 'bg-[#fbbf24]' : 'bg-white'}`}>
                    <span className={`text-[10px] font-black leading-none opacity-60 uppercase tracking-widest ${currentRoom?.id === 'ceo' ? 'text-black' : 'text-zinc-500'}`}>Current Zone Status</span>
                    <span className={`text-lg font-black uppercase tracking-tighter ${currentRoom?.id === 'ceo' ? 'text-black' : 'text-zinc-900'}`}>{currentRoom?.name || 'Grand Hallway'}</span>
                </div>
            </div>
        </div>
    );
}

export { furnitureStyles };
