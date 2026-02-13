'use client';

import { useEffect, useState } from 'react';
import { getMonthlySummary, getTransactionsByMonth, BankTransaction, formatCurrency, CATEGORIES } from '@/lib/finance-store';

export default function MonthlyClosingPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [summary, setSummary] = useState<{
        totalDeposit: number; totalWithdrawal: number; netAmount: number; txCount: number;
        byCategory: Record<string, { deposit: number; withdrawal: number }>;
    } | null>(null);
    const [topExpenses, setTopExpenses] = useState<Array<{ category: string; amount: number }>>([]);
    const [topRevenues, setTopRevenues] = useState<Array<{ category: string; amount: number }>>([]);

    const ym = `${year}-${String(month).padStart(2, '0')}`;

    useEffect(() => {
        (async () => {
            const s = await getMonthlySummary(ym);
            setSummary(s);

            // Top categories
            const expenses = Object.entries(s.byCategory)
                .filter(([, v]) => v.withdrawal > 0)
                .map(([k, v]) => ({ category: k, amount: v.withdrawal }))
                .sort((a, b) => b.amount - a.amount);
            setTopExpenses(expenses);

            const revenues = Object.entries(s.byCategory)
                .filter(([, v]) => v.deposit > 0)
                .map(([k, v]) => ({ category: k, amount: v.deposit }))
                .sort((a, b) => b.amount - a.amount);
            setTopRevenues(revenues);
        })();
    }, [ym]);

    const goMonth = (dir: number) => {
        let m = month + dir;
        let y = year;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        setMonth(m);
        setYear(y);
    };

    const maxExpense = topExpenses.length > 0 ? topExpenses[0].amount : 1;
    const maxRevenue = topRevenues.length > 0 ? topRevenues[0].amount : 1;

    // Management Accounting Metrics
    const calcMetrics = () => {
        if (!summary) return { marginalProfit: 0, marginalRate: 0, bepSales: 0 };

        let totalVariableCost = 0;
        Object.entries(summary.byCategory).forEach(([k, v]: [string, any]) => {
            if (isVariableCost(k)) totalVariableCost += v.withdrawal;
        });

        const revenue = summary.totalDeposit; // Assuming all deposit is revenue for simplicity here, or use filtered revenue
        // More accurate revenue:
        const pureRevenue = Object.entries(summary.byCategory)
            .filter(([k]) => isRevenue(k))
            .reduce((sum, [, v]) => sum + v.deposit, 0);

        const marginalProfit = pureRevenue - totalVariableCost;
        const marginalRate = pureRevenue > 0 ? (marginalProfit / pureRevenue) * 100 : 0;

        // Fixed Cost = Total Expense - Variable Cost (Approx)
        // Or strictly classify:
        let totalFixedCost = 0;
        Object.entries(summary.byCategory).forEach(([k, v]: [string, any]) => {
            // If it's an expense but NOT variable, assume fixed
            // Exclude Non-Op for BEP? Usually BEP is Operating.
            if ((classify(k) === 'opex' || classify(k) === 'cogs') && !isVariableCost(k)) {
                totalFixedCost += v.withdrawal;
            }
        });

        const bepSales = marginalRate > 0 ? totalFixedCost / (marginalRate / 100) : 0;

        return { marginalProfit, marginalRate, bepSales };
    };

    const metrics = calcMetrics();

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-white">월마감</h2>
                <p className="text-sm text-zinc-500 mt-1">월별 손익 요약</p>
            </div>

            {/* Month Picker */}
            <div className="flex items-center gap-3">
                <button onClick={() => goMonth(-1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-zinc-400">chevron_left</span>
                </button>
                <div className="relative group">
                    <div className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white group-hover:border-zinc-500 transition-colors cursor-pointer">
                        {year}년 {month}월
                    </div>
                    <input
                        type="month"
                        value={`${year}-${String(month).padStart(2, '0')}`}
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const [y, m] = e.target.value.split('-');
                            setYear(Number(y));
                            setMonth(Number(m));
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <button onClick={() => goMonth(1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-zinc-400">chevron_right</span>
                </button>
            </div>

            {summary && (
                <div className="space-y-8">
                    {/* P&L Waterfall */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-zinc-800">
                            <h3 className="text-lg font-bold text-white">손익계산서 (P&L)</h3>
                        </div>

                        {/* 1. Revenue */}
                        <PnLSection
                            title="매출액 (Revenue)"
                            amount={calcSectionTotal(summary, 'revenue', 'net')}
                            items={topRevenues.filter(i => isRevenue(i.category))}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                        />

                        {/* 2. COGS */}
                        <div className="px-5 py-2 border-b border-zinc-800/50 bg-zinc-900/30 flex justify-center">
                            <span className="text-xs text-zinc-500 font-bold">- 매출원가</span>
                        </div>
                        <PnLSection
                            title="매출원가 (COGS)"
                            amount={calcSectionTotal(summary, 'cogs', 'net')}
                            items={topExpenses.filter(i => classify(i.category) === 'cogs')} // Todo: Should allow items with net? Currently items are split topExp/topRev. It's ok for list view.
                            isMinus
                        />

                        {/* 3. Gross Profit */}
                        <div className="px-5 py-4 bg-zinc-800/30 border-y border-zinc-800 flex justify-between items-center">
                            <span className="text-sm font-bold text-zinc-300">매출총이익 (Gross Profit)</span>
                            <span className="text-lg font-black text-white">
                                ₩{formatCurrency(calcSectionTotal(summary, 'revenue', 'net') - calcSectionTotal(summary, 'cogs', 'net'))}
                            </span>
                        </div>

                        {/* 4. OpEx */}
                        <div className="px-5 py-2 border-b border-zinc-800/50 bg-zinc-900/30 flex justify-center">
                            <span className="text-xs text-zinc-500 font-bold">- 판매관리비</span>
                        </div>
                        <PnLSection
                            title="판관비 (OpEx)"
                            amount={calcSectionTotal(summary, 'opex', 'net')}
                            items={topExpenses.filter(i => classify(i.category) === 'opex')}
                            isMinus
                        />

                        {/* 5. Operating Profit */}
                        <div className="px-5 py-4 bg-zinc-800/50 border-y border-zinc-800 flex justify-between items-center">
                            <span className="text-base font-bold text-white">영업이익 (Operating Profit)</span>
                            <span className={`text-xl font-black ${(calcSectionTotal(summary, 'revenue', 'net') - calcSectionTotal(summary, 'cogs', 'net') - calcSectionTotal(summary, 'opex', 'net')) >= 0
                                ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                ₩{formatCurrency(calcSectionTotal(summary, 'revenue', 'net') - calcSectionTotal(summary, 'cogs', 'net') - calcSectionTotal(summary, 'opex', 'net'))}
                            </span>
                        </div>

                        {/* 6. Non-Op Income (Added for 가수금 etc) */}
                        <div className="px-5 py-2 border-b border-zinc-800/50 bg-zinc-900/30 flex justify-center">
                            <span className="text-xs text-zinc-500 font-bold">+ 영업외수익 (가수금 등)</span>
                        </div>
                        <PnLSection
                            title="영업외수익 (Non-Op Income)"
                            amount={calcSectionTotal(summary, 'nonop', 'deposit')}
                            items={topRevenues.filter(i => classify(i.category) === 'nonop')}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                        />

                        {/* 7. Non-Op Expense */}
                        <div className="px-5 py-2 border-b border-zinc-800/50 bg-zinc-900/30 flex justify-center">
                            <span className="text-xs text-zinc-500 font-bold">- 영업외비용</span>
                        </div>
                        <PnLSection
                            title="영업외비용 (Non-Op Expense)"
                            amount={calcSectionTotal(summary, 'nonop', 'withdrawal')}
                            items={topExpenses.filter(i => classify(i.category) === 'nonop')}
                            isMinus
                        />

                        {/* 8. Net Income */}
                        <div className="px-5 py-6 bg-zinc-800 border-t border-zinc-700 flex justify-between items-center">
                            <span className="text-xl font-black text-white">당기순이익 (Net Income)</span>
                            <span className={`text-3xl font-black ${summary.netAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {summary.netAmount >= 0 ? '+' : ''}₩{formatCurrency(summary.netAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Management Accounting Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                            title="한계이익 (Marginal Profit)"
                            value={`₩${formatCurrency(metrics.marginalProfit)}`}
                            desc="매출액 - 변동비"
                        />
                        <MetricCard
                            title="한계이익률 (Ratio)"
                            value={`${metrics.marginalRate.toFixed(1)}%`}
                            desc="한계이익 / 매출액"
                        />
                        <MetricCard
                            title="손익분기점 매출 (BEP)"
                            value={`₩${formatCurrency(metrics.bepSales)}`}
                            desc="고정비 / 한계이익률"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Helpers
function classify(cat: string) {
    if (['사진매출', '영상매출', '기타매출', '네이버페이', '카드매출'].includes(cat)) return 'revenue';
    if (['소모품비', '식대비', '장비구입', '원가'].includes(cat)) return 'cogs';
    if (['자금이동', '가수금', '보증금', '출자금', '세금환급'].includes(cat)) return 'nonop';
    return 'opex';
}

function isRevenue(cat: string) {
    return classify(cat) === 'revenue';
}

// Variable Cost: COGS + Card Fees + Delivery + Supplies (Estimates)
function isVariableCost(cat: string) {
    if (classify(cat) === 'cogs') return true;
    if (['카드수수료', '식대비', '소모품비'].includes(cat)) return true;
    return false;
}

function calcSectionTotal(s: any, section: string, type: 'withdrawal' | 'deposit' | 'net' = 'withdrawal') {
    let total = 0;
    Object.entries(s.byCategory).forEach(([k, v]: [string, any]) => {
        if (classify(k) === section) {
            if (type === 'net') {
                if (['cogs', 'opex'].includes(section)) {
                    total += (v.withdrawal - v.deposit);
                } else {
                    total += (v.deposit - v.withdrawal);
                }
            } else {
                total += v[type];
            }
        }
    });
    return total;
}

function MetricCard({ title, value, desc }: any) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl">
            <div className="text-xs font-bold text-zinc-500 mb-1">{title}</div>
            <div className="text-xl font-black text-white mb-2">{value}</div>
            <div className="text-[10px] text-zinc-600">{desc}</div>
        </div>
    );
}

function PnLSection({ title, amount, items, color = 'text-zinc-300', bg = '', isMinus = false }: any) {
    return (
        <div className={`p-5 ${bg}`}>
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-zinc-400">{title}</span>
                <span className={`text-base font-bold font-mono ${color}`}>
                    {isMinus ? '-' : ''}₩{formatCurrency(amount)}
                </span>
            </div>
            {items.length > 0 && (
                <div className="space-y-1 pl-4 border-l-2 border-zinc-800">
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                            <span className="text-zinc-500">{item.category}</span>
                            <span className="text-zinc-400 font-mono">₩{formatCurrency(item.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
