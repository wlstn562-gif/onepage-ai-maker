'use client';

import { useEffect, useState } from 'react';
import { getMonthlySummary, formatCurrency } from '@/lib/finance-store';

interface MonthData {
    month: string;
    deposit: number;
    withdrawal: number;
    net: number;
    count: number;
}

export default function AnnualReportPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [months, setMonths] = useState<MonthData[]>([]);
    const [prevMonths, setPrevMonths] = useState<MonthData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const results: MonthData[] = [];
            const prevResults: MonthData[] = [];

            // Fetch current and prev year in parallel
            const promises = [];
            for (let m = 1; m <= 12; m++) {
                const ym = `${year}-${String(m).padStart(2, '0')}`;
                const pym = `${year - 1}-${String(m).padStart(2, '0')}`;
                promises.push(getMonthlySummary(ym).then(s => ({
                    month: `${m}월`,
                    deposit: s.totalDeposit,
                    withdrawal: s.totalWithdrawal,
                    net: s.netAmount,
                    count: s.txCount,
                })));
                promises.push(getMonthlySummary(pym).then(s => ({
                    month: `${m}월`,
                    deposit: s.totalDeposit,
                    withdrawal: s.totalWithdrawal,
                    net: s.netAmount,
                    count: s.txCount,
                })));
            }

            const all = await Promise.all(promises);
            // Split results (alternating current, prev, current, prev...)
            // Wait, promises.push order matters.
            // Let's refactor to be safer.
        })();
    }, [year]);

    // Refactored useEffect for safety
    useEffect(() => {
        (async () => {
            setLoading(true);
            const currentYearPromises = [];
            const prevYearPromises = [];

            for (let m = 1; m <= 12; m++) {
                const ym = `${year}-${String(m).padStart(2, '0')}`;
                const pym = `${year - 1}-${String(m).padStart(2, '0')}`;
                currentYearPromises.push(getMonthlySummary(ym));
                prevYearPromises.push(getMonthlySummary(pym));
            }

            const [curSummaries, prevSummaries] = await Promise.all([
                Promise.all(currentYearPromises),
                Promise.all(prevYearPromises)
            ]);

            const newMonths = curSummaries.map((s, i) => ({
                month: `${i + 1}월`,
                deposit: s.totalDeposit,
                withdrawal: s.totalWithdrawal,
                net: s.netAmount,
                count: s.txCount,
            }));

            const newPrevMonths = prevSummaries.map((s, i) => ({
                month: `${i + 1}월`,
                deposit: s.totalDeposit,
                withdrawal: s.totalWithdrawal,
                net: s.netAmount,
                count: s.txCount,
            }));

            setMonths(newMonths);
            setPrevMonths(newPrevMonths);
            setLoading(false);
        })();
    }, [year]);

    const yearTotal = months.reduce((acc, m) => ({
        deposit: acc.deposit + m.deposit,
        withdrawal: acc.withdrawal + m.withdrawal,
        net: acc.net + m.net,
        count: acc.count + m.count,
    }), { deposit: 0, withdrawal: 0, net: 0, count: 0 });

    const prevYearTotal = prevMonths.reduce((acc, m) => ({
        deposit: acc.deposit + m.deposit,
        withdrawal: acc.withdrawal + m.withdrawal,
        net: acc.net + m.net,
        count: acc.count + m.count,
    }), { deposit: 0, withdrawal: 0, net: 0, count: 0 });

    const calcGrowth = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? '+100%' : '0%';
        const p = ((curr - prev) / prev) * 100;
        return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
    };

    const maxVal = Math.max(...months.map(m => Math.max(m.deposit, m.withdrawal)), 1);

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-white">연간 리포트 (YoY)</h2>
                <p className="text-sm text-zinc-500 mt-1">월별 입출금 추이 및 전년 대비 성장률</p>
            </div>

            {/* Year Picker */}
            <div className="flex items-center gap-3">
                <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-zinc-400">chevron_left</span>
                </button>
                <div className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white">{year}년</div>
                <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-zinc-400">chevron_right</span>
                </button>
            </div>

            {/* Year Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-zinc-500 mb-2">연간 입금</div>
                    <div className="text-lg font-black text-emerald-500">₩{formatCurrency(yearTotal.deposit)}</div>
                    <div className={`text-xs font-bold mt-1 ${yearTotal.deposit >= prevYearTotal.deposit ? 'text-emerald-500' : 'text-red-400'}`}>
                        Vs 전년 {calcGrowth(yearTotal.deposit, prevYearTotal.deposit)}
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-zinc-500 mb-2">연간 출금</div>
                    <div className="text-lg font-black text-red-400">₩{formatCurrency(yearTotal.withdrawal)}</div>
                    <div className={`text-xs font-bold mt-1 ${yearTotal.withdrawal <= prevYearTotal.withdrawal ? 'text-emerald-500' : 'text-red-400'}`}>
                        Vs 전년 {calcGrowth(yearTotal.withdrawal, prevYearTotal.withdrawal)}
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-zinc-500 mb-2">연간 순이익</div>
                    <div className={`text-lg font-black ${yearTotal.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {yearTotal.net >= 0 ? '+' : '-'}₩{formatCurrency(yearTotal.net)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                        전년 ₩{formatCurrency(prevYearTotal.net)}
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-zinc-500 mb-2">총 거래</div>
                    <div className="text-lg font-black text-white">{yearTotal.count.toLocaleString()}건</div>
                </div>
            </div>

            {/* Bar Chart - Current Year Only */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-5">월별 추이 ({year}년)</h3>
                {loading ? (
                    <div className="text-center py-12 text-sm text-zinc-600">불러오는 중...</div>
                ) : (
                    <div className="flex items-end gap-2 h-48">
                        {months.map((m, idx) => {
                            const dH = maxVal > 0 ? (m.deposit / maxVal) * 100 : 0;
                            const wH = maxVal > 0 ? (m.withdrawal / maxVal) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1" title={`${m.month}: 입금 ${formatCurrency(m.deposit)} / 출금 ${formatCurrency(m.withdrawal)}`}>
                                    <div className="w-full flex gap-0.5 items-end justify-center h-40">
                                        <div className="w-3 bg-emerald-500/60 rounded-t transition-all" style={{ height: `${dH}%`, minHeight: m.deposit > 0 ? '4px' : '0' }} />
                                        <div className="w-3 bg-red-500/60 rounded-t transition-all" style={{ height: `${wH}%`, minHeight: m.withdrawal > 0 ? '4px' : '0' }} />
                                    </div>
                                    <span className="text-[9px] text-zinc-500 font-bold">{m.month}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="flex items-center gap-4 mt-4 justify-center text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/60 inline-block" /> 입금</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block" /> 출금</span>
                </div>
            </div>

            {/* Monthly Table with YoY */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900 border-b border-zinc-800">
                        <tr className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-800">
                            <th className="px-4 py-3">월</th>
                            <th className="px-4 py-3 text-right">입금</th>
                            <th className="px-4 py-3 text-right text-zinc-600">전년 입금</th>
                            <th className="px-4 py-3 text-right">출금</th>
                            <th className="px-4 py-3 text-right text-zinc-600">전년 출금</th>
                            <th className="px-4 py-3 text-right">순이익</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {months.map((m, idx) => (
                            <tr key={idx} className={`hover:bg-white/5 transition-colors text-xs ${m.count === 0 ? 'opacity-30' : ''}`}>
                                <td className="px-4 py-3 font-bold text-zinc-300">{m.month}</td>
                                <td className="px-4 py-3 text-right font-mono text-emerald-500">{m.deposit > 0 ? `₩${formatCurrency(m.deposit)}` : '-'}</td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-600">{prevMonths[idx]?.deposit > 0 ? `₩${formatCurrency(prevMonths[idx].deposit)}` : '-'}</td>
                                <td className="px-4 py-3 text-right font-mono text-red-400">{m.withdrawal > 0 ? `₩${formatCurrency(m.withdrawal)}` : '-'}</td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-600">{prevMonths[idx]?.withdrawal > 0 ? `₩${formatCurrency(prevMonths[idx].withdrawal)}` : '-'}</td>
                                <td className={`px-4 py-3 text-right font-mono font-bold ${m.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {m.count > 0 ? `${m.net >= 0 ? '+' : '-'}₩${formatCurrency(m.net)}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
