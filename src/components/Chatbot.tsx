"use client";

import React, { useState, useEffect, useRef } from 'react';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
        { role: 'ai', content: '안녕하세요! 연희스튜디오 AI 상담원입니다. 무엇을 도와드릴까요?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        // AI Response Simulation (Logic to be replaced with real AI API if available)
        setTimeout(() => {
            let aiResponse = "죄송합니다. 해당 질문에 대한 답변을 준비 중입니다. 자세한 문의는 인스타그램이나 고객센터를 이용해 주세요.";

            if (userMsg.includes('여권') || userMsg.includes('사진')) {
                aiResponse = "여권사진은 흰색 배경에 얼굴 크기가 3.2~3.6cm여야 합니다. 연희스튜디오 분석기를 사용하시면 규격에 딱 맞는 사진을 만드실 수 있어요!";
            } else if (userMsg.includes('예약') || userMsg.includes('지점')) {
                aiResponse = "천안, 청주, 대전 지점이 있습니다. 홈페이지 상단의 '지점 예약' 버튼을 누르시면 네이버 예약 페이지로 연결해 드립니다.";
            } else if (userMsg.includes('반려') || userMsg.includes('할인')) {
                aiResponse = "저희 분석기로 만든 사진이 반려될 경우, 캡처본을 보여주시면 전 지점에서 사용 가능한 50% 촬영 할인권을 드립니다!";
            } else if (userMsg.includes('가격') || userMsg.includes('얼마')) {
                aiResponse = "온라인 사진 분석 및 다운로드 비용은 3,900원입니다. 오프라인 촬영 가격은 지점별로 상이할 수 있으니 예약 페이지를 확인해 주세요.";
            }

            setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] h-[500px] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-zinc-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#FFB200] to-[#FF8A00] p-6 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3 text-left">
                            <div className="size-10 bg-white/20 rounded-2xl flex items-center justify-center text-black">
                                <span className="material-symbols-outlined text-white font-black">smart_toy</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-white font-black text-sm">연희 AI 상담원</h3>
                                <p className="text-white/70 text-[10px] font-bold">실시간 답변 가능</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-bold shadow-sm ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-[#FFB200] to-[#FF8A00] text-white rounded-tr-none'
                                    : 'bg-white text-[#111111] border border-zinc-100 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-100 shadow-sm flex gap-1">
                                    <div className="size-1.5 bg-zinc-300 rounded-full animate-bounce"></div>
                                    <div className="size-1.5 bg-zinc-300 rounded-full animate-bounce delay-75"></div>
                                    <div className="size-1.5 bg-zinc-300 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-zinc-100 shrink-0">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="질문을 입력하세요..."
                                className="w-full h-12 bg-zinc-100 rounded-2xl px-5 pr-12 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#B48A00]/50 transition-all border-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-gradient-to-br from-[#FFB200] to-[#FF8A00] text-white rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`size-16 rounded-[24px] shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isOpen ? 'bg-zinc-100 text-[#FF9F0A] rotate-90' : 'bg-gradient-to-br from-[#FFB200] to-[#FF8A00] text-white'
                    }`}
            >
                <span className="material-symbols-outlined text-3xl font-black">
                    {isOpen ? 'close' : 'forum'}
                </span>
            </button>
        </div>
    );
};

export default Chatbot;
