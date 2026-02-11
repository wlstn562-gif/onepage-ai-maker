'use client';

import { useState, useEffect } from 'react';
import {
    getAllTransactionsAsync, getMonthlySummaryAsync, getProjectSummaryAsync,
    getCategoryBreakdownAsync, getMonthlyTrendAsync, getMonthlyReportAsync,
    formatCurrency, MonthlyReport
} from '@/lib/finance-store';

export default function MonthlyClosingPage() {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentYM);
    const [monthly, setMonthly] = useState<{ yearMonth: string; totalIncome: number; totalExpense: number; netProfit: number; count: number } | null>(null);
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [projectData, setProjectData] = useState<{ project: string; income: number; expense: number; profit: number; margin: number; count: number }[]>([]);
    const [categoryData, setCategoryData] = useState<{ category: string; amount: number }[]>([]);
    const [trend, setTrend] = useState<{ month: string; income: number; expense: number; net: number }[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            setMonthly(await getMonthlySummaryAsync(selectedMonth));
            setReport(await getMonthlyReportAsync(selectedMonth));
            setProjectData(await getProjectSummaryAsync());
            setCategoryData(await getCategoryBreakdownAsync(selectedMonth));
            setTrend(await getMonthlyTrendAsync(6));
            setTotalCount((await getAllTransactionsAsync()).length);
        };
        load();
    }, [selectedMonth]);

    const getBarWidth = (val: number, max: number) => max > 0 ? Math.max((val / max) * 100, 2) : 0;
    const maxProjectIncome = Math.max(...projectData.map(p => p.income), 1);
    const maxCatAmount = Math.max(...categoryData.map(c => c.amount), 1);
    const maxTrendVal = Math.max(...trend.map(t => Math.max(t.income, t.expense)), 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">monitoring</span>
                        월마감
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">자금일보 기반 월별 마감 · 프로젝트별 마진 · 지출 분석</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span> 총 매출
                    </p>
                    <p className="text-xl font-bold text-green-400 font-mono mt-1">{formatCurrency(monthly?.totalIncome || 0)}원</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">trending_down</span> 총 지출
                    </p>
                    <p className="text-xl font-bold text-red-400 font-mono mt-1">{formatCurrency(monthly?.totalExpense || 0)}원</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">account_balance</span> 순이익
                    </p>
                    <p className={`text-xl font-bold font-mono mt-1 ${(monthly?.netProfit || 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {formatCurrency(monthly?.netProfit || 0)}원
                    </p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span> 전체 건수
                    </p>
                    <p className="text-xl font-bold text-amber-400 font-mono mt-1">{totalCount}건</p>
                </div>
            </div>

            {/* 📊 월간 손익 리포트 (11 items) */}
            {report && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-400">description</span>
                            {selectedMonth.split('-')[1]}월 손익 계산서
                        </h3>
                        <span className="text-xs text-zinc-500">단위: 원</span>
                    </div>
                    <div className="p-6">
                        <div className="space-y-1">
                            {/* 1. 매출액 */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                <span className="text-zinc-400">1. 매출액</span>
                                <span className="text-lg font-bold text-blue-400">{formatCurrency(report.revenue)}</span>
                            </div>

                            {/* 2. 매출원가 */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                <span className="text-zinc-400">2. 매출원가</span>
                                <span className="font-mono text-zinc-300">{formatCurrency(report.cogs)}</span>
                            </div>

                            {/* 3. 판매관리비 */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                <span className="text-zinc-400">3. 판매관리비</span>
                                <span className="font-mono text-zinc-300">{formatCurrency(report.opex)}</span>
                            </div>

                            {/* 4. 영업이익 (Highlight) */}
                            <div className="flex justify-between items-center py-3 border-b border-zinc-700 bg-zinc-800/20 px-2 rounded-lg my-2">
                                <span className="text-zinc-200 font-bold">4. 영업이익</span>
                                <span className={`text-xl font-bold font-mono ${report.opProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(report.opProfit)}
                                </span>
                            </div>

                            {/* 5. 영업외수익 */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                <span className="text-zinc-400">5. 영업외수익</span>
                                <span className="font-mono text-blue-300">{formatCurrency(report.nonOpIncome)}</span>
                            </div>

                            {/* 6. 영업외비용 */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                                <span className="text-zinc-400">6. 영업외비용</span>
                                <span className="font-mono text-red-300">{formatCurrency(report.nonOpExpense)}</span>
                            </div>

                            {/* 7. 당기순이익 (Final Highlight) */}
                            <div className="flex justify-between items-center py-4 border-y-2 border-zinc-700 bg-zinc-800/40 px-3 rounded-xl my-4">
                                <span className="text-white font-bold text-lg">7. 당기순이익</span>
                                <span className={`text-2xl font-bold font-mono ${report.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(report.netIncome)}
                                </span>
                            </div>

                            {/* Analysis Metrics */}
                            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-800">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">8. 한계이익</span>
                                        <span className="text-zinc-300 font-mono">{formatCurrency(report.contributionMargin)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">9. 한계이익률</span>
                                        <span className="text-zinc-300 font-mono">{report.contributionMarginRatio.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">10. 손익분기점 매출액</span>
                                        <span className="text-zinc-300 font-mono">{formatCurrency(Math.round(report.breakEvenPoint))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">11. 가수금</span>
                                        <span className="text-amber-400 font-mono font-bold">{formatCurrency(report.suspendReceipt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Summary */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-zinc-800/30 border-b border-zinc-800">
                        <h4 className="text-sm font-bold text-zinc-300">📊 프로젝트별 수익률</h4>
                    </div>
                    <div className="p-4 space-y-3">
                        {projectData.length === 0 && (
                            <p className="text-zinc-500 text-sm text-center py-4">등록된 데이터가 없습니다</p>
                        )}
                        {projectData.map(p => (
                            <div key={p.project} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300 font-medium">{p.project}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-green-400 font-mono text-xs">+{formatCurrency(p.income)}</span>
                                        <span className="text-red-400 font-mono text-xs">-{formatCurrency(p.expense)}</span>
                                        <span className={`font-bold text-xs px-2 py-0.5 rounded ${p.margin >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {p.margin}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 h-2">
                                    <div className="bg-green-500/30 rounded-full" style={{ width: `${getBarWidth(p.income, maxProjectIncome)}%` }}>
                                        <div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }} />
                                    </div>
                                    <div className="bg-red-500/30 rounded-full" style={{ width: `${getBarWidth(p.expense, maxProjectIncome)}%` }}>
                                        <div className="bg-red-500 h-full rounded-full" style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-zinc-800/30 border-b border-zinc-800">
                        <h4 className="text-sm font-bold text-zinc-300">💰 계정과목별 지출 ({selectedMonth})</h4>
                    </div>
                    <div className="p-4 space-y-3">
                        {categoryData.length === 0 && (
                            <p className="text-zinc-500 text-sm text-center py-4">지출 데이터가 없습니다</p>
                        )}
                        {categoryData.map(c => (
                            <div key={c.category} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300">{c.category}</span>
                                    <span className="text-white font-mono text-xs font-bold">{formatCurrency(c.amount)}원</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                                        style={{ width: `${getBarWidth(c.amount, maxCatAmount)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-zinc-800/30 border-b border-zinc-800">
                    <h4 className="text-sm font-bold text-zinc-300">📈 월별 추이 (최근 6개월)</h4>
                </div>
                <div className="p-4">
                    {trend.length === 0 || trend.every(t => t.income === 0 && t.expense === 0) ? (
                        <p className="text-zinc-500 text-sm text-center py-4">데이터가 없습니다</p>
                    ) : (
                        <div className="space-y-3">
                            {trend.map(t => (
                                <div key={t.month} className="flex items-center gap-3">
                                    <span className="text-zinc-400 text-xs font-mono w-16 shrink-0">{t.month}</span>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 bg-green-500/80 rounded" style={{ width: `${getBarWidth(t.income, maxTrendVal)}%` }} />
                                            <span className="text-green-400 text-[10px] font-mono shrink-0">{formatCurrency(t.income)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 bg-red-500/80 rounded" style={{ width: `${getBarWidth(t.expense, maxTrendVal)}%` }} />
                                            <span className="text-red-400 text-[10px] font-mono shrink-0">{formatCurrency(t.expense)}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold w-20 text-right ${t.net >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                        {t.net >= 0 ? '+' : ''}{formatCurrency(t.net)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
