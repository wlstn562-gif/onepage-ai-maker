'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TEAMS } from '@/lib/teams';
import Link from 'next/link';
import { Send, Bot, CheckCircle2, MoreVertical, LayoutGrid, Users, Settings, ArrowLeft, ExternalLink, RotateCcw } from 'lucide-react';

const STORAGE_KEYS = {
    MESSAGES: 'studio_chat_messages',
    ARTIFACTS: 'studio_artifacts',
    ACTIVE_TEAM: 'studio_active_team_id',
    MODE: 'studio_console_mode'
};

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    teamId?: string;
}

interface Artifact {
    id: string;
    title: string;
    type: 'code' | 'text' | 'image' | 'task';
    content: string;
    timestamp: string;
}

export default function StudioPage() {
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
    const [consoleMode, setConsoleMode] = useState<'team' | 'auto' | 'council'>('team');
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial load from localStorage
    useEffect(() => {
        try {
            const savedMsgs = localStorage.getItem(STORAGE_KEYS.MESSAGES);
            const savedArts = localStorage.getItem(STORAGE_KEYS.ARTIFACTS);
            const savedTeam = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEAM);
            const savedMode = localStorage.getItem(STORAGE_KEYS.MODE);

            if (savedMsgs) setMessages(JSON.parse(savedMsgs));
            if (savedArts) setArtifacts(JSON.parse(savedArts));
            if (savedTeam && savedTeam !== 'null') setActiveTeamId(savedTeam);
            if (savedMode) setConsoleMode(savedMode as any);
        } catch (e) {
            console.error('Failed to load from storage', e);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage when state changes
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        localStorage.setItem(STORAGE_KEYS.ARTIFACTS, JSON.stringify(artifacts));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM, String(activeTeamId));
        localStorage.setItem(STORAGE_KEYS.MODE, consoleMode);
    }, [messages, artifacts, activeTeamId, consoleMode, isLoaded]);

    const handleClearHistory = () => {
        if (confirm('모든 대화 내역과 결과물을 초기화하시겠습니까?')) {
            setMessages([]);
            setArtifacts([]);
            localStorage.removeItem(STORAGE_KEYS.MESSAGES);
            localStorage.removeItem(STORAGE_KEYS.ARTIFACTS);
        }
    };

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const activeTeam = TEAMS.find(t => t.id === activeTeamId);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        if (consoleMode === 'team' && !activeTeamId) return;

        const userMsg: ChatMessage = { role: 'user', text: chatInput };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/studio/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: activeTeamId,
                    message: userMsg.text,
                    history: messages,
                    mode: consoleMode
                })
            });
            const data = await res.json();

            // Handle Auto-Routing: Update team ID if changed by AI
            if (consoleMode === 'auto' && data.teamId && data.teamId !== activeTeamId) {
                setActiveTeamId(data.teamId);
            }

            const aiMsg: ChatMessage = {
                role: 'assistant',
                text: data.response,
                teamId: data.teamId
            };
            setMessages(prev => [...prev, aiMsg]);

            // Simple Artifact Parsing: Detect code blocks or specific labels
            if (data.response.includes('```')) {
                const codeMatch = data.response.match(/```(\w+)?\n([\s\S]*?)```/);
                if (codeMatch) {
                    const newArtifact: Artifact = {
                        id: Date.now().toString(),
                        title: `${activeTeam?.name}의 결과물`,
                        type: 'code',
                        content: codeMatch[2],
                        timestamp: new Date().toLocaleTimeString()
                    };
                    setArtifacts(prev => [newArtifact, ...prev]);
                }
            } else if (data.response.length > 100) {
                // Large text could be an artifact
                const newArtifact: Artifact = {
                    id: Date.now().toString(),
                    title: `${activeTeam?.name}의 보고서`,
                    type: 'text',
                    content: data.response,
                    timestamp: new Date().toLocaleTimeString()
                };
                setArtifacts(prev => [newArtifact, ...prev]);
            }

        } catch (e) {
            alert("Error sending message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full flex-col bg-zinc-950 text-white font-sans overflow-hidden">

            {/* 1. Top Bar */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors mr-2" title="관리자 홈">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-xl font-bold tracking-tight text-white mr-8 hover:text-zinc-300 transition-colors">
                        <Link href="/">TEAM CONSOLE</Link>
                    </h1>

                    {/* Mode Selectors */}
                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg">
                        <button
                            onClick={() => setConsoleMode('team')}
                            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${consoleMode === 'team' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <LayoutGrid size={16} />
                            팀 선택
                        </button>
                        <button
                            onClick={() => setConsoleMode('auto')}
                            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${consoleMode === 'auto' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <Bot size={16} />
                            자동 라우팅
                        </button>
                        <button
                            onClick={() => setConsoleMode('council')}
                            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${consoleMode === 'council' ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                        >
                            <Users size={16} />
                            전체 회의
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Link
                        href="/photo"
                        className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900"
                    >
                        <ExternalLink size={14} />
                        연희스튜디오 가기
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 cursor-pointer" onClick={handleClearHistory} title="대화 초기화">
                            <RotateCcw size={18} />
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600" />
                    </div>
                </div>
            </header>

            {/* 2. Main Content Area */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left/Center: Team Cards & Chat */}
                <main className="flex flex-1 flex-col overflow-hidden relative">

                    {/* Team Grid Layer (Fades out when chat is active, or stays visible uniquely - user design implies static grid) */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {TEAMS.map((team) => {
                                const Icon = team.icon;
                                const isActive = activeTeamId === team.id;

                                return (
                                    <button
                                        key={team.id}
                                        onClick={() => setActiveTeamId(team.id)}
                                        className={`group relative flex flex-col items-start justify-between rounded-xl border p-6 text-left transition-all duration-200
                        ${isActive
                                                ? `border-${team.color.split('-')[1]}-500 bg-zinc-900 ring-1 ring-${team.color.split('-')[1]}-500`
                                                : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700'
                                            }
                      `}
                                    >
                                        <div className={`mb-4 rounded-lg p-2 ${team.bgColor} ${team.color}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className={`font-bold ${isActive ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                                                {team.name}
                                            </h3>
                                            <p className="mt-2 text-xs leading-relaxed text-zinc-500 line-clamp-3 group-hover:text-zinc-400">
                                                {team.description}
                                            </p>
                                        </div>

                                        {/* Active Indicator */}
                                        {isActive && (
                                            <div className="absolute top-4 right-4">
                                                <span className="relative flex h-3 w-3">
                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-${team.color.split('-')[1]}-400`}></span>
                                                    <span className={`relative inline-flex rounded-full h-3 w-3 bg-${team.color.split('-')[1]}-500`}></span>
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Chat Interface (Sticky) */}
                    <div className="h-[400px] w-full border-t border-zinc-800 bg-zinc-950 flex flex-col z-10 shrink-0 shadow-2xl shadow-zinc-900/50">
                        {/* Chat Header */}
                        <div className="flex h-12 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                {consoleMode === 'council' ? (
                                    <>
                                        <span className="text-yellow-500 animate-pulse">●</span>
                                        전체 전문가 위원회 회의 중
                                    </>
                                ) : consoleMode === 'auto' ? (
                                    <>
                                        <span className="text-blue-500 animate-pulse">●</span>
                                        지능형 자동 라우팅 활성화됨
                                        {activeTeam && <span className="ml-2 text-zinc-500">({activeTeam.name} 연결됨)</span>}
                                    </>
                                ) : activeTeam ? (
                                    <>
                                        <span className={`${activeTeam.color}`}>●</span>
                                        {activeTeam.name}과 대화 중
                                    </>
                                ) : (
                                    <span className="text-zinc-500">대화할 팀을 위에서 선택해주세요</span>
                                )}
                            </div>
                            <button
                                onClick={() => setMessages([])}
                                className="text-xs text-zinc-500 hover:text-white"
                            >
                                대화 초기화
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4"
                        >
                            {messages.length === 0 && (
                                <div className="flex h-full flex-col items-center justify-center text-zinc-600 gap-2">
                                    <Bot size={32} className="opacity-20" />
                                    <p className="text-sm">팀을 선택하고 작업을 지시해보세요.</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                            max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap
                            ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
                                        }
                         `}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-800/50 rounded-2xl px-4 py-3 border border-zinc-800">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                            <div className="relative mx-auto max-w-4xl">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={!activeTeamId || loading}
                                    placeholder={activeTeamId ? `${activeTeam?.name}에게 작업 요청...` : "먼저 팀을 선택해주세요"}
                                    className="w-full rounded-xl border-none bg-zinc-800 py-4 pl-6 pr-14 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 text-sm shadow-inner"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!activeTeamId || !chatInput.trim() || loading}
                                    className="absolute right-2 top-2 rounded-lg bg-blue-600/20 p-2 text-blue-400 hover:bg-blue-600 hover:text-white disabled:opacity-0 transition-all"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                            <p className="mt-2 text-center text-[10px] text-zinc-600">
                                Antigravity Hub • All AI Inputs are logged for quality assurance.
                            </p>
                        </div>
                    </div>

                </main>

                {/* 3. Right Panel (Artifacts) */}
                <aside className="hidden w-80 flex-col border-l border-zinc-800 bg-zinc-950/50 lg:flex">
                    <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                        <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">작업 결과물 (Artifacts)</span>
                        <span className="text-xs text-zinc-600">{artifacts.length} items</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {artifacts.length === 0 ? (
                            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 p-4 text-center">
                                <div className="space-y-2">
                                    <CheckCircle2 size={32} className="mx-auto text-zinc-700" />
                                    <p className="text-xs text-zinc-600">아직 결과물이 없습니다.</p>
                                    <p className="text-[10px] text-zinc-700">대화를 통해 작업을 요청해보세요.</p>
                                </div>
                            </div>
                        ) : (
                            artifacts.map((art) => (
                                <div key={art.id} className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-600 transition-all cursor-pointer">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${art.type === 'code' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                            {art.type}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">{art.timestamp}</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">{art.title}</h4>
                                    <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{art.content}</p>

                                    <div className="absolute inset-0 bg-zinc-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(art.content)}
                                            className="text-[11px] font-bold text-white bg-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-600"
                                        >
                                            내용 복사
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

            </div>
        </div>
    );
}
