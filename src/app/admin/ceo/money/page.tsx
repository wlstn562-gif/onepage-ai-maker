'use client';

import { useState, useEffect, Suspense } from 'react';
import {
    ArrowLeft, TrendingUp, TrendingDown, DollarSign,
    CreditCard, PieChart, Briefcase, Building2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMonthlySummary, formatCurrency } from '@/lib/finance-store';

export const dynamic = 'force-dynamic';

function CEOMoneyModuleContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [report, setReport] = useState<{
        revenue: number; expense: number; netIncome: number; txCount: number;
    } | null>(null);

    useEffect(() => {
        const key = searchParams.get('key');
        if (key !== 'edsence_ceo') {
            router.push('/');
        } else {
            setAuthorized(true);
            loadData();
        }
    }, [month, searchParams, router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const s = await getMonthlySummary(month);
            setReport({
                revenue: s.totalDeposit,
                expense: s.totalWithdrawal,
                netIncome: s.netAmount,
                txCount: s.txCount,
            });
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-black">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-400" />
                    </button>
                    <h1 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        MONEY (돈관리)
                    </h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">

                {/* Date Selector */}
                <div className="flex justify-center mb-8">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse">데이터 분석 중...</div>
                ) : report ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* 1. Corporate Finance (Left Column) */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-200">
                                <Building2 className="w-6 h-6 text-gray-400" />
                                법인 자금 (Corporate)
                            </h2>

                            {/* Main Profit Card */}
                            <div className="bg-gradient-to-br from-emerald-900/30 to-black border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-emerald-400 font-medium mb-1">당기 순이익 (Net Income)</div>
                                    <div className="text-4xl font-extrabold text-white mb-4">
                                        ₩ {formatCurrency(report.netIncome)}
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <div className="bg-black/50 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-1">
                                            <span className="text-gray-400">입금</span>
                                            <span className="text-white font-bold">{formatCurrency(report.revenue)}</span>
                                        </div>
                                        <div className="bg-black/50 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-1">
                                            <span className="text-gray-400">출금</span>
                                            <span className="text-white font-bold">{formatCurrency(report.expense)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                                    <div className="text-gray-500 text-xs mb-1">총 입금</div>
                                    <div className="text-xl font-bold text-emerald-400">
                                        {formatCurrency(report.revenue)}
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                                    <div className="text-gray-500 text-xs mb-1">총 출금</div>
                                    <div className="text-xl font-bold text-rose-400">
                                        {formatCurrency(report.expense)}
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                                    <div className="text-gray-500 text-xs mb-1">거래 건수</div>
                                    <div className="text-xl font-bold text-gray-200">
                                        {report.txCount}건
                                    </div>
                                </div>
                                <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-800">
                                    <div className="text-gray-500 text-xs mb-1">순손익</div>
                                    <div className={`text-xl font-bold ${report.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {report.netIncome >= 0 ? '+' : ''}{formatCurrency(report.netIncome)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Personal Finance (Right Column) - Placeholder */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-200">
                                <Briefcase className="w-6 h-6 text-gray-400" />
                                개인 자산 (Personal)
                            </h2>

                            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 relative">
                                <div className="text-gray-400 font-medium mb-1">총 자산 (Total Assets)</div>
                                <div className="text-4xl font-extrabold text-white mb-2">
                                    ₩ 4,250,000,000
                                </div>
                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>지난달 대비 +1.2% (₩ 52,000,000)</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400"><Building2 className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-gray-200 font-bold">부동산 (Real Estate)</div>
                                            <div className="text-gray-500 text-xs">서초구 아파트 외 1건</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold">₩ 3,200M</div>
                                        <div className="text-gray-600 text-xs">75%</div>
                                    </div>
                                </div>

                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400"><TrendingUp className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-gray-200 font-bold">주식/코인 (Investments)</div>
                                            <div className="text-gray-500 text-xs">삼성전자, Tesla, BTC</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold">₩ 850M</div>
                                        <div className="text-gray-600 text-xs">20%</div>
                                    </div>
                                </div>

                                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400"><DollarSign className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-gray-200 font-bold">현금성 자산 (Cash)</div>
                                            <div className="text-gray-500 text-xs">예금, CMA, 달러</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold">₩ 200M</div>
                                        <div className="text-gray-600 text-xs">5%</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-20">데이터가 없습니다.</div>
                )}
            </main>
        </div>
    );
}

export default function CEOMoneyModule() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading Money Module...</div>}>
            <CEOMoneyModuleContent />
        </Suspense>
    );
}
