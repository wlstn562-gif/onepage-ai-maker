'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TEAMS } from '@/lib/teams';
import { Send, Bot, CheckCircle2, MoreVertical, LayoutGrid, Users, Settings } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    teamId?: string;
}

export default function StudioPage() {
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const activeTeam = TEAMS.find(t => t.id === activeTeamId);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !activeTeamId) return;

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
                    history: messages
                })
            });
            const data = await res.json();

            const aiMsg: ChatMessage = {
                role: 'assistant',
                text: data.response,
                teamId: activeTeamId
            };
            setMessages(prev => [...prev, aiMsg]);
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
                    <h1 className="text-xl font-bold tracking-tight text-white mr-8">TEAM CONSOLE</h1>

                    {/* Mode Selectors */}
                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg">
                        <button className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-zinc-700">
                            <LayoutGrid size={16} />
                            팀 선택
                        </button>
                        <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                            <Bot size={16} />
                            자동 라우팅
                        </button>
                        <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                            <Users size={16} />
                            전체 회의
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 cursor-pointer">
                        <Settings size={18} />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600" />
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
                                {activeTeam ? (
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

                {/* 3. Right Panel (Optional - Context/Tickets) */}
                <aside className="hidden w-80 flex-col border-l border-zinc-800 bg-zinc-950/50 lg:flex">
                    <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                        <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Active Tickets</span>
                        <span className="text-xs text-zinc-600">0 pending</span>
                    </div>
                    <div className="flex-1 p-4">
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 p-4 text-center">
                            <div className="space-y-2">
                                <CheckCircle2 size={32} className="mx-auto text-zinc-700" />
                                <p className="text-xs text-zinc-600">No active tickets.</p>
                                <p className="text-[10px] text-zinc-700">Requests will appear here as tickets.</p>
                            </div>
                        </div>
                    </div>
                </aside>

            </div>
        </div>
    );
}
