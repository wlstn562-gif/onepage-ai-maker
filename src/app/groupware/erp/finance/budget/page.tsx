'use client';

import { useEffect, useState } from 'react';
import {
    getAllBudgets, getBudgetsByYear, saveBudgets, getMonthlySummary,
    BudgetItem, formatCurrency, generateId, CATEGORIES
} from '@/lib/finance-store';

interface BudgetRow {
    category: string;
    budgets: number[];    // 12 months
    actuals: number[];    // 12 months
}

export default function BudgetPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [rows, setRows] = useState<BudgetRow[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const expenseCategories = CATEGORIES.filter(c => !c.includes('매출'));

    useEffect(() => {
        (async () => {
            setLoading(true);
            const budgets = await getBudgetsByYear(year);

            // Get actuals for each month
            const monthlyActuals: Record<string, Record<string, number>> = {};
            for (let m = 1; m <= 12; m++) {
                const ym = `${year}-${String(m).padStart(2, '0')}`;
                const summary = await getMonthlySummary(ym);
                monthlyActuals[String(m)] = {};
                for (const [cat, vals] of Object.entries(summary.byCategory)) {
                    monthlyActuals[String(m)][cat] = vals.withdrawal;
                }
            }

            // Build rows
            const newRows: BudgetRow[] = expenseCategories.map(cat => {
                const budgetArr: number[] = [];
                const actualArr: number[] = [];
                for (let m = 1; m <= 12; m++) {
                    const b = budgets.find(b => b.category === cat && b.month === m);
                    budgetArr.push(b?.planned || 0);
                    actualArr.push(monthlyActuals[String(m)]?.[cat] || 0);
                }
                return { category: cat, budgets: budgetArr, actuals: actualArr };
            });

            setRows(newRows);
            setLoading(false);
        })();
    }, [year]);

    const handleBudgetChange = (catIdx: number, monthIdx: number, value: string) => {
        const newRows = [...rows];
        newRows[catIdx] = { ...newRows[catIdx], budgets: [...newRows[catIdx].budgets] };
        newRows[catIdx].budgets[monthIdx] = Number(value) || 0;
        setRows(newRows);
    };

    const handleFillPrev = () => {
        if (!confirm('빈 예산 항목을 전월 값으로 채우시겠습니까? (1월 -> 12월 순서로 채워집니다)')) return;

        const newRows = rows.map(row => {
            const newBudgets = [...row.budgets];
            for (let i = 1; i < 12; i++) {
                if (newBudgets[i] === 0 && newBudgets[i - 1] > 0) {
                    newBudgets[i] = newBudgets[i - 1];
                }
            }
            return { ...row, budgets: newBudgets };
        });
        setRows(newRows);
    };

    const handleSave = async () => {
        setSaving(true);
        const items: BudgetItem[] = [];
        for (const row of rows) {
            for (let m = 0; m < 12; m++) {
                if (row.budgets[m] > 0) {
                    items.push({
                        id: `${year}-${m + 1}-${row.category}`,
                        year,
                        month: m + 1,
                        category: row.category,
                        planned: row.budgets[m],
                        createdAt: new Date().toISOString(),
                    });
                }
            }
        }
        await saveBudgets(items);
        setEditMode(false);
        setSaving(false);
    };

    const monthLabels = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">예산 계획</h2>
                    <p className="text-sm text-zinc-500 mt-1">월별 예산 대 실적 비교</p>
                </div>
                <div className="flex items-center gap-2">
                    {editMode ? (
                        <>
                            <button onClick={handleFillPrev}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all mr-2">
                                <span className="material-symbols-outlined text-[16px] align-middle mr-1">content_copy</span>
                                전월값 채우기
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-black rounded-xl transition-all">
                                {saving ? '저장 중...' : '저장'}
                            </button>
                            <button onClick={() => setEditMode(false)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm font-bold rounded-xl transition-all">
                                취소
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditMode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all">
                            <span className="material-symbols-outlined text-[16px]">edit</span> 예산 편집
                        </button>
                    )}
                </div>
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

            {loading ? (
                <div className="text-center py-12 text-sm text-zinc-600">불러오는 중...</div>
            ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1200px]">
                            <thead>
                                <tr className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-800">
                                    <th className="px-3 py-3 sticky left-0 bg-zinc-900 z-10 min-w-[120px]">항목</th>
                                    {monthLabels.map(m => (
                                        <th key={m} className="px-2 py-3 text-center">{m}</th>
                                    ))}
                                    <th className="px-3 py-3 text-right">합계</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {rows.map((row, ri) => {
                                    const totalBudget = row.budgets.reduce((s, v) => s + v, 0);
                                    const totalActual = row.actuals.reduce((s, v) => s + v, 0);
                                    const hasData = totalBudget > 0 || totalActual > 0;
                                    if (!editMode && !hasData) return null;

                                    return (
                                        <tr key={ri} className="hover:bg-white/5 transition-colors text-[11px]">
                                            <td className="px-3 py-2 font-bold text-zinc-300 sticky left-0 bg-zinc-900/90 z-10">{row.category}</td>
                                            {monthLabels.map((_, mi) => {
                                                const budget = row.budgets[mi];
                                                const actual = row.actuals[mi];
                                                const over = budget > 0 && actual > budget;
                                                return (
                                                    <td key={mi} className="px-1 py-2 text-center">
                                                        {editMode ? (
                                                            <input
                                                                type="number"
                                                                value={budget || ''}
                                                                onChange={e => handleBudgetChange(ri, mi, e.target.value)}
                                                                placeholder="0"
                                                                className="w-16 px-1 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-white text-center outline-none focus:border-yellow-500/50"
                                                            />
                                                        ) : (
                                                            <div>
                                                                {budget > 0 && <div className="text-zinc-500 text-[10px]">{(budget / 10000).toFixed(0)}만</div>}
                                                                {actual > 0 && (
                                                                    <div className={`font-mono font-bold ${over ? 'text-red-400' : 'text-zinc-300'}`}>
                                                                        {(actual / 10000).toFixed(0)}만
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-2 text-right">
                                                {totalBudget > 0 && <div className="text-zinc-500 text-[10px]">예산 {formatCurrency(totalBudget)}</div>}
                                                {totalActual > 0 && <div className={`font-mono font-bold text-[11px] ${totalActual > totalBudget && totalBudget > 0 ? 'text-red-400' : 'text-zinc-300'}`}>{formatCurrency(totalActual)}</div>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
