"use client";

import { useState, useEffect, useRef } from "react";

interface Notebook {
    id: string;
    name: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ResearchPage() {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loadingStep, setLoadingStep] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep(prev => (prev + 1) % 4);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    // Initial connection check and load notebooks
    useEffect(() => {
        checkConnection();
    }, []);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const checkConnection = async () => {
        try {
            const res = await fetch("/api/notebooklm?action=status");
            const data = await res.json();

            if (data.connected) {
                setConnectionStatus("connected");
                fetchNotebooks();
            } else {
                setConnectionStatus("disconnected");
            }
        } catch (e) {
            console.error("Connection check failed", e);
            setConnectionStatus("disconnected");
        }
    };

    const createNotebook = async () => {
        try {
            const title = prompt("새 노트북의 이름을 입력하세요:", "New Strategy Notebook");
            if (!title) return;

            const res = await fetch("/api/notebooklm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create",
                    title: title
                })
            });
            const data = await res.json();

            if (data.success) {
                // Refresh list after creation
                fetchNotebooks();
            } else {
                alert("Notebook creation failed: " + (data.error || "Unknown error"));
            }
        } catch (e) {
            console.error("Failed to create notebook", e);
            alert("Error creating notebook");
        }
    };

    const fetchNotebooks = async () => {
        try {
            const res = await fetch("/api/notebooklm?action=list");
            const data = await res.json();

            let list = [];
            if (data.success) {
                if (Array.isArray(data.notebooks)) {
                    list = data.notebooks;
                } else if (data.notebooks && Array.isArray(data.notebooks.notebooks)) {
                    list = data.notebooks.notebooks;
                }
            }

            setNotebooks(list);

            if (list.length > 0 && !selectedNotebookId) {
                setSelectedNotebookId(list[0].id);
            }
        } catch (e) {
            console.error("Failed to fetch notebooks", e);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedNotebookId) return;

        const userMessage = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch("/api/notebooklm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "query",
                    notebookId: selectedNotebookId,
                    query: userMessage
                })
            });

            const data = await res.json();

            if (data.success) {
                let answerContent = "";
                if (typeof data.result === 'string') {
                    answerContent = data.result;
                } else if (data.result && typeof data.result === 'object') {
                    // Handle object response (e.g. {answer: "...", ...})
                    answerContent = data.result.answer || data.result.text || JSON.stringify(data.result);
                }

                setMessages(prev => [...prev, { role: "assistant", content: answerContent }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: "Error: " + (data.error || "Unknown error") }]);
            }

        } catch (e: any) {
            setMessages(prev => [...prev, { role: "assistant", content: "Error: " + e.message }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            <header className="border-b border-white/10 p-4 bg-[#0a0a0a] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔍</span>
                        <h1 className="text-xl font-bold">심층 리서치 <span className="text-gray-500 text-sm font-normal">with NotebookLM</span></h1>

                        {/* Status Indicator */}
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${connectionStatus === "connected"
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"
                                }`} />
                            {connectionStatus === "connected" ? "Connected" : "Disconnected"}
                        </div>
                    </div>
                    <a href="/strategy" className="text-sm text-gray-500 hover:text-white transition-colors">← 전략 센터</a>
                </div>
            </header>

            <main className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-4 h-[calc(100vh-80px)]">
                {/* Sidebar: Notebook Selection */}
                <aside className="w-64 border-r border-white/10 pr-4 flex flex-col gap-4 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Notebooks</h2>
                        <div className="flex gap-1">
                            <button onClick={createNotebook} className="text-white hover:text-purple-400 transition-colors p-2" title="Create New Notebook">
                                ➕
                            </button>
                            <button onClick={fetchNotebooks} className="text-white hover:text-purple-400 transition-colors p-2" title="Refresh List">
                                🔄
                            </button>
                        </div>
                    </div>
                    {notebooks.length === 0 ? (
                        <div className="text-sm text-white p-6 text-center bg-gray-900 rounded-xl border border-gray-700">
                            <p className="mb-2 text-gray-300 font-medium">No notebooks found.</p>
                            <p className="mb-4 text-xs text-gray-500">
                                If you have notebooks, try re-authenticating<br />in the terminal to update your session.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={createNotebook}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-xs font-bold"
                                >
                                    + Create New
                                </button>
                                <button
                                    onClick={fetchNotebooks}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-bold"
                                >
                                    Refresh List
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 overflow-y-auto">
                            {notebooks.map(nb => (
                                <button
                                    key={nb.id}
                                    onClick={() => setSelectedNotebookId(nb.id)}
                                    className={`text-left px-4 py-3 rounded-lg text-sm font-bold transition-all border ${selectedNotebookId === nb.id
                                        ? "bg-purple-600 text-white border-purple-400 shadow-md transform scale-105"
                                        : "bg-gray-800 text-white border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                                        }`}
                                >
                                    {nb.title || nb.name || "Untitled Notebook"}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick Actions (Future) */}
                    <div className="mt-auto pt-4 border-t border-white/10">
                        <p className="text-xs text-center text-gray-600">
                            Use terminal to add notebooks<br />via MCP
                        </p>
                    </div>
                </aside>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden relative">
                    {connectionStatus === "disconnected" ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8 text-center">
                            <div className="text-4xl">🔌</div>
                            <h3 className="text-xl font-bold">NotebookLM과 연결되지 않았습니다</h3>
                            <p className="text-gray-400 max-w-md">
                                서버에서 MCP 인증이 필요합니다. 터미널을 확인하거나 <code>auth.json</code> 파일이 존재하는지 확인해주세요.
                            </p>
                            <button
                                onClick={checkConnection}
                                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                연결 재시도
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                        <span className="text-4xl mb-2">💬</span>
                                        <p>선택한 노트북에 대해 무엇이든 물어보세요.</p>
                                    </div>
                                )}
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${msg.role === "user"
                                            ? "bg-purple-600 text-white rounded-br-none"
                                            : "bg-white/10 text-gray-200 rounded-bl-none"
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-800 px-5 py-3 rounded-2xl rounded-bl-none flex flex-col gap-2 border border-gray-700 shadow-lg items-start animate-fade-in-up">
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xl animate-spin-slow">🧠</span>
                                                <span className="text-gray-200 font-medium text-sm animate-pulse">
                                                    {loadingStep === 0 && "노트북을 읽고 있어요..."}
                                                    {loadingStep === 1 && "중요한 내용을 찾는 중..."}
                                                    {loadingStep === 2 && "답변을 정리하고 있습니다..."}
                                                    {loadingStep >= 3 && "거의 다 됐어요!"}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 pl-1">
                                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggested Questions */}
                            <div className="px-4 pb-2 bg-gray-950 flex gap-2 overflow-x-auto scrollbar-none">
                                {["📝 요약해줘", "🔑 핵심 키워드는?", "📊 주요 수치 알려줘", "❓ 예상 질문 만들어줘"].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        disabled={!selectedNotebookId || isLoading}
                                        className="whitespace-nowrap px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full border border-gray-700 transition-colors disabled:opacity-50"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 pt-2 border-t border-gray-800 bg-gray-950">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={selectedNotebookId ? "질문을 입력하세요..." : "노트북을 먼저 선택해주세요"}
                                        disabled={!selectedNotebookId || isLoading}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!selectedNotebookId || isLoading || !input.trim()}
                                        className="bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                                    >
                                        전송
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
