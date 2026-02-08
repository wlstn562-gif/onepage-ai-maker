'use client';

import React, { useState } from 'react';
import { Q1Response, Q2Response, FinalResponse, AIResponse } from '@/lib/agent/types';

export default function AgentPage() {
    const [q1, setQ1] = useState('');
    const [loadingQ1, setLoadingQ1] = useState(false);
    const [a1Data, setA1Data] = useState<Q1Response['answers'] | null>(null);

    const [loadingQ2, setLoadingQ2] = useState(false);
    const [q2Prompts, setQ2Prompts] = useState<Q2Response['q2'] | null>(null);
    const [a2Data, setA2Data] = useState<Q2Response['answers'] | null>(null);

    const [loadingFinal, setLoadingFinal] = useState(false);
    const [finalData, setFinalData] = useState<FinalResponse['final'] | null>(null);

    const [expandedContent, setExpandedContent] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple toast could accept here, simplified for now
        alert("Copied to clipboard!");
    };

    const runQ1 = async () => {
        if (!q1.trim()) return;
        setLoadingQ1(true);
        setA1Data(null);
        setQ2Prompts(null);
        setA2Data(null);
        setFinalData(null);

        try {
            const res = await fetch('/api/agent/q1', {
                method: 'POST',
                body: JSON.stringify({ question: q1 }),
            });
            const data: Q1Response = await res.json();
            setA1Data(data.answers);
        } catch (e) {
            alert("Error running Q1");
        } finally {
            setLoadingQ1(false);
        }
    };

    const runQ2 = async () => {
        if (!a1Data) return;
        setLoadingQ2(true);
        setA2Data(null);
        setFinalData(null);

        // Prepare text only for sending
        const a1Clean = {
            openai: a1Data.openai.text,
            claude: a1Data.claude.text,
            gemini: a1Data.gemini.text
        };

        try {
            const res = await fetch('/api/agent/q2', {
                method: 'POST',
                body: JSON.stringify({ question: q1, a1: a1Clean }),
            });
            const data: Q2Response = await res.json();
            setQ2Prompts(data.q2);
            setA2Data(data.answers);
        } catch (e) {
            alert("Error running Q2");
        } finally {
            setLoadingQ2(false);
        }
    };

    const runFinal = async () => {
        if (!a2Data) return;
        setLoadingFinal(true);
        setFinalData(null);

        const a2Clean = {
            openai: a2Data.openai.text,
            claude: a2Data.claude.text,
            gemini: a2Data.gemini.text
        };

        try {
            const res = await fetch('/api/agent/final', {
                method: 'POST',
                body: JSON.stringify({ question: q1, a2: a2Clean }),
            });
            const data: FinalResponse = await res.json();
            setFinalData(data.final);
        } catch (e) {
            alert("Error running Final");
        } finally {
            setLoadingFinal(false);
        }
    };

    // Helper components
    const ModelHeader = ({ name, color }: { name: string, color: string }) => (
        <div className={`p-4 font-bold text-center border-b border-zinc-700 bg-zinc-900 ${color}`}>
            {name}
        </div>
    );

    const Cell = ({ content, loading, label, type = 'text', onExpand }: any) => {
        if (loading) return (
            <div className="flex h-full min-h-[150px] items-center justify-center p-4 bg-zinc-900/50 border-r border-b border-zinc-800">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
            </div>
        );

        if (!content && type !== 'input') return (
            <div className="min-h-[150px] bg-zinc-950/30 border-r border-b border-zinc-800" />
        );

        return (
            <div className="relative min-h-[150px] p-4 border-r border-b border-zinc-800 group transition-colors hover:bg-zinc-900/80">
                {label && <div className="mb-2 text-xs font-bold text-zinc-500 uppercase">{label}</div>}

                <div
                    onClick={() => content?.text && handleCopy(content.text)}
                    className="whitespace-pre-wrap text-sm text-zinc-300 line-clamp-6 cursor-pointer hover:text-white"
                >
                    {type === 'prompt' ? content : (content?.text || content?.error || '')}
                </div>

                {content?.ms && (
                    <div className="absolute top-2 right-2 text-[10px] text-zinc-600 font-mono">
                        {content.ms}ms
                    </div>
                )}

                {(content?.text?.length > 300 || type === 'prompt') && (
                    <button
                        onClick={() => setExpandedContent(type === 'prompt' ? content : content.text)}
                        className="absolute bottom-2 right-2 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700 hover:text-white"
                    >
                        Expand
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-white">AI Agent Workflow</h1>
                <a href="/" className="text-sm text-zinc-500 hover:text-white">← Back to Hub</a>
            </header>

            {/* Main Table Container */}
            <div className="relative w-full overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
                <div className="min-w-[1000px] grid grid-cols-[200px_1fr_1fr_1fr]">

                    {/* Header Row */}
                    <div className="sticky top-0 z-20 bg-zinc-950 p-4 font-bold text-zinc-400 border-b border-r border-zinc-800">Step</div>
                    <ModelHeader name="OpenAI (GPT-4o)" color="text-green-400" />
                    <ModelHeader name="Claude (3.5 Sonnet)" color="text-amber-400" />
                    <ModelHeader name="Gemini (1.5 Pro)" color="text-blue-400" />

                    {/* Row 1: Input */}
                    <div className="bg-zinc-900/50 p-4 border-r border-b border-zinc-800 flex flex-col justify-center">
                        <div className="font-semibold text-white">1. Initial Question</div>
                        <div className="text-xs text-zinc-500 mt-1">Define the task clearly.</div>
                        <button
                            onClick={runQ1}
                            disabled={loadingQ1 || !q1}
                            className="mt-4 w-full rounded bg-white px-3 py-2 text-sm font-bold text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingQ1 ? 'Running...' : 'Run Q1'}
                        </button>
                    </div>
                    <div className="col-span-3 p-4 border-b border-zinc-800 bg-zinc-900/30">
                        <textarea
                            value={q1}
                            onChange={(e) => setQ1(e.target.value)}
                            placeholder="Enter your question here..."
                            className="h-full min-h-[120px] w-full resize-none rounded bg-transparent p-2 text-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                        />
                    </div>

                    {/* Row 2: A1 Output */}
                    <div className="bg-zinc-900/50 p-4 border-r border-b border-zinc-800 flex flex-col justify-center">
                        <div className="font-semibold text-white">2. Initial Answers</div>
                        <div className="text-xs text-zinc-500 mt-1">Parallel execution.</div>
                    </div>
                    <Cell content={a1Data?.openai} loading={loadingQ1} label="A1 (Draft)" />
                    <Cell content={a1Data?.claude} loading={loadingQ1} label="A1 (Draft)" />
                    <Cell content={a1Data?.gemini} loading={loadingQ1} label="A1 (Draft)" />

                    {/* Row 3: Q2 Prompt Build */}
                    <div className="bg-zinc-900/50 p-4 border-r border-b border-zinc-800 flex flex-col justify-center">
                        <div className="font-semibold text-white">3. Cross-Critique</div>
                        <div className="text-xs text-zinc-500 mt-1">Building prompts with peer answers.</div>
                        <button
                            onClick={runQ2}
                            disabled={!a1Data || loadingQ2}
                            className="mt-4 w-full rounded bg-zinc-800 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
                        >
                            {loadingQ2 ? 'Processing...' : 'Build & Run Q2'}
                        </button>
                    </div>
                    <Cell content={q2Prompts?.openai} loading={loadingQ2} label="Prompt: Q + Claude/Gemini A1" type="prompt" />
                    <Cell content={q2Prompts?.claude} loading={loadingQ2} label="Prompt: Q + OpenAI/Gemini A1" type="prompt" />
                    <Cell content={q2Prompts?.gemini} loading={loadingQ2} label="Prompt: Q + OpenAI/Claude A1" type="prompt" />

                    {/* Row 4: A2 Output */}
                    <div className="bg-zinc-900/50 p-4 border-r border-b border-zinc-800 flex flex-col justify-center">
                        <div className="font-semibold text-white">4. Refined Answers</div>
                        <div className="text-xs text-zinc-500 mt-1">Critique & Improvement.</div>
                    </div>
                    <Cell content={a2Data?.openai} loading={loadingQ2} label="A2 (Refined)" />
                    <Cell content={a2Data?.claude} loading={loadingQ2} label="A2 (Refined)" />
                    <Cell content={a2Data?.gemini} loading={loadingQ2} label="A2 (Refined)" />

                    {/* Row 5: Final Synthesis */}
                    <div className="bg-zinc-900/50 p-4 border-r border-b border-zinc-800 flex flex-col justify-center">
                        <div className="font-semibold text-white">5. Final Synthesis</div>
                        <div className="text-xs text-zinc-500 mt-1">Gemini consolidates everything.</div>
                        <button
                            onClick={runFinal}
                            disabled={!a2Data || loadingFinal}
                            className="mt-4 w-full rounded bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                        >
                            {loadingFinal ? 'Synthesizing...' : 'Run Final'}
                        </button>
                    </div>
                    <div className="col-span-2 bg-zinc-950/50 border-r border-b border-zinc-800 p-8 flex items-center justify-center text-zinc-600 italic">
                        (Voice of Reason & Synthesis) →
                    </div>
                    <Cell content={finalData?.gemini} loading={loadingFinal} label="Final Verdict" />

                </div>
            </div>

            {/* Expand Modal */}
            {expandedContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl">
                        <button
                            onClick={() => setExpandedContent(null)}
                            className="sticky top-0 float-right m-4 rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        >
                            ✕
                        </button>
                        <div className="p-8 whitespace-pre-wrap font-sans text-base leading-relaxed text-zinc-200">
                            {expandedContent}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
