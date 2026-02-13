'use client';

import { useState, useEffect, Suspense } from 'react';
import {
    ArrowLeft, Heart, Moon, Activity, Pill,
    Flame, Footprints, BedDouble, AlertCircle
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function CEOHealthModuleContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const key = searchParams.get('key');
        if (key !== 'edsence_ceo') {
            router.push('/');
        } else {
            setAuthorized(true);
        }
    }, [searchParams, router]);

    if (!authorized) return null;

    // --- Mock Data ---
    const sleepData = {
        score: 85,
        duration: '7h 12m',
        deep: '1h 45m (24%)',
        rem: '2h 10m (30%)',
        awake: '15m'
    };

    const activityData = {
        steps: 8432,
        calories: 2450,
        activeTime: '45m'
    };

    const [medications, setMedications] = useState([
        { id: 1, name: '종합비타민', time: '아침', taken: true },
        { id: 2, name: '오메가3', time: '점심', taken: false },
        { id: 3, name: '마그네슘', time: '취침 전', taken: false },
    ]);

    const toggleMedication = (id: number) => {
        setMedications(medications.map(m =>
            m.id === id ? { ...m, taken: !m.taken } : m
        ));
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-rose-500 selection:text-black">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </button>
                    <h1 className="text-xl font-bold text-rose-400 flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        HEALTH (건강관리)
                    </h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* 1. Sleep Analysis */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-200">
                            <Moon className="w-6 h-6 text-indigo-400" />
                            수면 분석 (Sleep)
                        </h2>

                        <div className="bg-gradient-to-br from-indigo-900/30 to-black border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="text-indigo-400 font-medium mb-1">수면 점수</div>
                                    <div className="text-5xl font-extrabold text-white mb-2">{sleepData.score}</div>
                                    <div className="text-gray-400 text-sm">목표 85점 달성 🎉</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-indigo-300 font-medium">총 수면 시간</div>
                                    <div className="text-3xl font-bold text-white">{sleepData.duration}</div>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-3 gap-2">
                                <div className="bg-black/40 rounded-xl p-3 border border-indigo-900/50 text-center">
                                    <div className="text-xs text-gray-500 mb-1">깊은 잠</div>
                                    <div className="font-bold text-indigo-400">{sleepData.deep}</div>
                                </div>
                                <div className="bg-black/40 rounded-xl p-3 border border-indigo-900/50 text-center">
                                    <div className="text-xs text-gray-500 mb-1">REM 수면</div>
                                    <div className="font-bold text-purple-400">{sleepData.rem}</div>
                                </div>
                                <div className="bg-black/40 rounded-xl p-3 border border-indigo-900/50 text-center">
                                    <div className="text-xs text-gray-500 mb-1">깨어남</div>
                                    <div className="font-bold text-red-400">{sleepData.awake}</div>
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        </div>

                        {/* AI Insight */}
                        <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800 flex gap-4">
                            <div className="shrink-0 pt-1"><AlertCircle className="w-5 h-5 text-indigo-400" /></div>
                            <div className="text-sm text-gray-300 leading-relaxed">
                                <span className="font-bold text-indigo-300">AI 코멘트:</span> 어제보다 깊은 잠 비율이 5% 증가했습니다.
                                취침 전 1시간 동안 스마트폰 사용을 줄인 것이 효과가 있었던 것으로 보입니다.
                                오늘 밤에는 실내 온도를 1도 낮춰보세요.
                            </div>
                        </div>
                    </div>

                    {/* 2. Activity & Medication */}
                    <div className="space-y-8">

                        {/* Activity */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-200">
                                <Activity className="w-6 h-6 text-orange-400" />
                                활동량 (Activity)
                            </h2>
                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 grid grid-cols-2 gap-4">
                                <div className="col-span-2 flex items-center justify-between pb-4 border-b border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-orange-900/20 rounded-full text-orange-500"><Footprints className="w-6 h-6" /></div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">{activityData.steps.toLocaleString()}</div>
                                            <div className="text-xs text-gray-500">걸음 수 (Steps)</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-right">
                                        <div>
                                            <div className="text-2xl font-bold text-white">{activityData.calories}</div>
                                            <div className="text-xs text-gray-500">소모 칼로리 (kcal)</div>
                                        </div>
                                        <div className="p-3 bg-red-900/20 rounded-full text-red-500"><Flame className="w-6 h-6" /></div>
                                    </div>
                                </div>
                                <div className="pt-2 text-center text-sm text-gray-400 col-span-2">
                                    오늘 목표 활동량의 <span className="text-orange-400 font-bold">84%</span>를 달성했습니다.
                                </div>
                            </div>
                        </div>

                        {/* Medication */}
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-200">
                                <Pill className="w-6 h-6 text-emerald-400" />
                                영양제 챙기기
                            </h2>
                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-3">
                                {medications.map(med => (
                                    <div
                                        key={med.id}
                                        onClick={() => toggleMedication(med.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group
                                            ${med.taken
                                                ? 'bg-emerald-900/20 border-emerald-500/30'
                                                : 'bg-black border-gray-800 hover:border-gray-600'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${med.taken ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600 group-hover:border-gray-400'}`}>
                                                {med.taken && <span className="text-black text-xs font-bold">✓</span>}
                                            </div>
                                            <div>
                                                <div className={`font-bold transition-colors ${med.taken ? 'text-emerald-400 line-through' : 'text-gray-200'}`}>
                                                    {med.name}
                                                </div>
                                                <div className="text-xs text-gray-500">{med.time}</div>
                                            </div>
                                        </div>
                                        {med.taken && <span className="text-xs text-emerald-500 font-bold">복용 완료</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default function CEOHealthModule() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading Health Module...</div>}>
            <CEOHealthModuleContent />
        </Suspense>
    );
}
