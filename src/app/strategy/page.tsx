"use client";
import { useState } from "react";

export default function StrategyPage() {
    return (
        <div className="min-h-screen bg-[var(--deep-black)] text-white font-sans selection:bg-[var(--premium-gold)] selection:text-black">
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🧠</span>
                        <h1 className="text-xl font-bold tracking-tight">Strategy Center <span className="text-[var(--premium-gold)] text-xs font-bold uppercase tracking-wider ml-2 px-2 py-0.5 border border-[var(--premium-gold)] rounded-md">Beta</span></h1>
                    </div>
                    <a href="/" className="text-sm font-medium text-gray-500 hover:text-white transition-colors flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Back to Studio
                    </a>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center py-16 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Unknown to <span className="text-[var(--premium-gold)]">Unforgettable.</span></h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
                        Yeonhui Studio's AI marketing division analyzes market currents to position your brand with precision.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Deep Research Module */}
                        <a href="/strategy/research" className="block group h-full">
                            <div className="relative p-10 rounded-[32px] border border-white/10 bg-[#121212] hover:border-[var(--premium-gold)] transition-all duration-500 h-full text-left hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 grayscale group-hover:grayscale-0">
                                    <span className="text-6xl">🔍</span>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-[var(--premium-gold)] flex items-center justify-center mb-8 text-black text-2xl group-hover:rotate-12 transition-transform">
                                    R
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white">Deep Research</h3>
                                <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300">
                                    Analyze 10,000+ data points using NotebookLM to uncover hidden market opportunities and fact-check your narrative.
                                </p>
                                <span className="inline-flex items-center text-[var(--premium-gold)] font-bold text-sm uppercase tracking-widest group-hover:gap-2 transition-all">
                                    Start Analysis <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                </span>
                            </div>
                        </a>

                        {/* Strategy Simulation Module */}
                        <div className="block group h-full cursor-pointer">
                            <div className="relative p-10 rounded-[32px] border border-white/10 bg-[#121212] hover:border-white/30 transition-all duration-500 h-full text-left hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20 grayscale">
                                    <span className="text-6xl">⚔️</span>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8 text-white text-2xl">
                                    S
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white">Strategy Simulation</h3>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    Test your creative assets against virtual audience personas before launching. Optimize ROI with synthetic focus groups.
                                </p>
                                <span className="inline-block px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-gray-400">COMING SOON</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
