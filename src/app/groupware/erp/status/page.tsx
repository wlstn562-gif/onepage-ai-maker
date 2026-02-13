'use client';

import { useState, useEffect, Fragment } from 'react';
import { getWeeklySummary, getMonthlyCalendarData, formatCurrency, BRANCHES } from '@/lib/erp-store';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function SalesStatusPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [weeks, setWeeks] = useState<ReturnType<typeof getWeeklySummary>>([]);
    const [allBranches, setAllBranches] = useState<string[]>([]);

    useEffect(() => {
        const w = getWeeklySummary(year, month);
        setWeeks(w);

        // Collect all branches from data
        const branchSet = new Set<string>();
        w.forEach(week => {
            week.days.forEach(day => {
                Object.keys(day.branches).forEach(b => branchSet.add(b));
            });
        });
        setAllBranches(branchSet.size > 0 ? Array.from(branchSet).sort() : BRANCHES);
    }, [year, month]);

    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    // Monthly totals
    const monthlyBranchTotals: Record<string, number> = {};
    let monthlyTotal = 0;
    weeks.forEach(week => {
        week.days.forEach(day => {
            monthlyTotal += day.total;
            Object.entries(day.branches).forEach(([b, amt]) => {
                monthlyBranchTotals[b] = (monthlyBranchTotals[b] || 0) + amt;
            });
        });
    });

    // Day-of-week totals
    const dowTotals: { branches: Record<string, number>; total: number }[] = DAYS.map(() => ({ branches: {}, total: 0 }));
    weeks.forEach(week => {
        week.days.forEach((day, dowIdx) => {
            dowTotals[dowIdx].total += day.total;
            Object.entries(day.branches).forEach(([b, amt]) => {
                dowTotals[dowIdx].branches[b] = (dowTotals[dowIdx].branches[b] || 0) + amt;
            });
        });
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">매출현황</h2>
                    <p className="text-sm text-zinc-500 mt-1">월별 달력 형태의 매출 현황판</p>
                </div>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h3 className="text-xl font-bold text-white min-w-[160px] text-center">
                    {year}년 {month}월
                </h3>
                <button onClick={nextMonth} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/80">
                                {DAYS.map((day, i) => (
                                    <th key={day} className={`px-2 py-3 text-center text-xs font-bold border border-zinc-700 w-[13%] ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-zinc-300'}`}>
                                        {day}요일
                                    </th>
                                ))}
                                <th className="px-2 py-3 text-center text-xs font-bold text-amber-400 border border-zinc-700 w-[9%]">계</th>
                            </tr>
                        </thead>
                        <tbody>
                            {weeks.map((week) => (
                                <Fragment key={`week-${week.weekNum}`}>
                                    {/* Date row */}
                                    <tr key={`dates-${week.weekNum}`} className="bg-zinc-900/30">
                                        {week.days.map((day, dIdx) => {
                                            const dayNum = day.date ? parseInt(day.date.split('-')[2]) : null;
                                            return (
                                                <td key={dIdx} className={`px-2 py-1.5 border border-zinc-800/50 text-center ${dIdx === 0 ? 'text-red-400' : dIdx === 6 ? 'text-blue-400' : 'text-zinc-300'}`}>
                                                    <span className="text-xs font-bold">{dayNum || ''}</span>
                                                </td>
                                            );
                                        })}
                                        <td className="px-2 py-1.5 border border-zinc-800/50 text-center text-xs font-bold text-amber-400 bg-amber-500/5">
                                            {week.weekNum}주
                                        </td>
                                    </tr>
                                    {/* Branch rows */}
                                    {allBranches.map(branch => (
                                        <tr key={`${week.weekNum}-${branch}`}>
                                            {week.days.map((day, dIdx) => {
                                                const amt = day.branches[branch] || 0;
                                                return (
                                                    <td key={dIdx} className="px-2 py-1 border border-zinc-800/50 text-right font-mono text-xs text-zinc-400">
                                                        {amt > 0 ? formatCurrency(amt) : ''}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-2 py-1 border border-zinc-800/50 text-right font-mono text-xs text-zinc-300 bg-zinc-800/30">
                                                {week.branches[branch] ? formatCurrency(week.branches[branch]) : ''}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Branch label + Weekly total row */}
                                    <tr key={`total-${week.weekNum}`} className="bg-zinc-800/20 border-b-2 border-zinc-700">
                                        {week.days.map((day, dIdx) => (
                                            <td key={dIdx} className="px-2 py-1.5 border border-zinc-800/50 text-right font-mono text-xs font-bold text-white">
                                                {day.total > 0 ? formatCurrency(day.total) : ''}
                                            </td>
                                        ))}
                                        <td className="px-2 py-1.5 border border-zinc-800/50 text-right font-mono text-xs font-bold text-yellow-400 bg-yellow-500/5">
                                            {week.total > 0 ? formatCurrency(week.total) : ''}
                                        </td>
                                    </tr>
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Monthly Summary Footer */}
                <div className="border-t-2 border-zinc-600 bg-zinc-800/50 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {allBranches.map(branch => (
                            <div key={branch} className="text-center">
                                <p className="text-xs text-zinc-500 mb-1">↳ {branch}</p>
                                <p className="text-sm font-bold text-white font-mono">
                                    {formatCurrency(monthlyBranchTotals[branch] || 0)}
                                </p>
                            </div>
                        ))}
                        <div className="text-center">
                            <p className="text-xs text-amber-400 mb-1 font-bold">월매출합계</p>
                            <p className="text-lg font-bold text-amber-400 font-mono">
                                {formatCurrency(monthlyTotal)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day-of-Week Summary Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/30">
                    <h4 className="text-sm font-bold text-zinc-300">요일별 합산</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-800/30">
                                <th className="px-3 py-2 text-left text-xs font-bold text-zinc-500 w-24"></th>
                                {DAYS.map((d, i) => (
                                    <th key={d} className={`px-3 py-2 text-right text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-zinc-400'}`}>{d}요일</th>
                                ))}
                                <th className="px-3 py-2 text-right text-xs font-bold text-amber-400">월매출합계</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allBranches.map(branch => (
                                <tr key={branch} className="border-t border-zinc-800/30">
                                    <td className="px-3 py-2 text-xs text-zinc-400">↳ {branch}</td>
                                    {dowTotals.map((dow, i) => (
                                        <td key={i} className="px-3 py-2 text-right font-mono text-xs text-zinc-300">
                                            {dow.branches[branch] ? formatCurrency(dow.branches[branch]) : ''}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2 text-right font-mono text-xs font-bold text-white">
                                        {formatCurrency(monthlyBranchTotals[branch] || 0)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-zinc-600 bg-zinc-800/30">
                                <td className="px-3 py-2 text-xs font-bold text-zinc-300">합계</td>
                                {dowTotals.map((dow, i) => (
                                    <td key={i} className="px-3 py-2 text-right font-mono text-xs font-bold text-white">
                                        {dow.total > 0 ? formatCurrency(dow.total) : ''}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-right font-mono text-sm font-bold text-red-400">
                                    {formatCurrency(monthlyTotal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
