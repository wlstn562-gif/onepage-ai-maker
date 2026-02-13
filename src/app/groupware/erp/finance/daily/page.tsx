'use client';

import { useEffect, useState } from 'react';
import {
    getTransactionsByDate,
    BankTransaction,
    formatCurrency,
    updateTransaction,
    CATEGORIES,
    addCategoryRule,
    applyClassificationRules,
    saveTransactions,
    getPreviousBalance
} from '@/lib/finance-store';

export default function DailyReportPage() {
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [txs, setTxs] = useState<BankTransaction[]>([]);
    const [prevBalances, setPrevBalances] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    // List of accounts to show in summary
    const accountList = ['086', '110', '대전', '청주', '726'];

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [data, ...balances] = await Promise.all([
                getTransactionsByDate(date),
                ...accountList.map(acc => getPreviousBalance(acc, date))
            ]);

            setTxs(data.sort((a, b) => a.id.localeCompare(b.id)));

            // Map balances to account names
            const balMap: Record<string, number> = {};
            accountList.forEach((acc, i) => {
                balMap[acc] = balances[i] as number;
            });
            setPrevBalances(balMap);

            setLoading(false);
        })();
    }, [date]);

    const handleCategoryChange = async (txId: string, newCategory: string) => {
        // Optimistic update
        setTxs(prev => prev.map(t => t.id === txId ? { ...t, category: newCategory } : t));

        // Update DB
        const tx = txs.find(t => t.id === txId);
        if (tx) {
            await updateTransaction({ ...tx, category: newCategory });
            // AI Learning: Save rule
            // Priority: Description > Summary
            // This prevents "BZ뱅크" (Summary) from overwriting everything.
            const keyword = tx.description || tx.summary;
            if (keyword) {
                await addCategoryRule(keyword, newCategory);
            }
        }
    };

    const handleAutoClassify = async () => {
        if (confirm('AI 규칙에 따라 현재 목록을 자동 분류하시겠습니까?')) {
            setLoading(true);
            try {
                const updatedTxs = await applyClassificationRules(txs);
                await saveTransactions(updatedTxs, false); // update
                setTxs(updatedTxs);
                alert('✅ 자동 분류 완료');
            } catch (e: any) {
                console.error(e);
                alert(`오류 발생: ${e.message || '알 수 없는 오류'}`);
            }
            setLoading(false);
        }
    };

    // Calculate summary for each account
    const accountSummaries = accountList.map(acc => {
        const accTxs = txs.filter(t => (t.account_name || 'unknown') === acc);
        const deposit = accTxs.reduce((s, t) => s + t.deposit, 0);
        const withdrawal = accTxs.reduce((s, t) => s + t.withdrawal, 0);

        // Previous Balance is now fetched from DB (last tx < today)
        const prevBalance = prevBalances[acc] || 0;

        // Current Balance:
        // If there are txs today, use the last tx's balance (Truth).
        // If no txs, use prevBalance.
        let currentBalance = prevBalance + deposit - withdrawal;

        if (accTxs.length > 0) {
            currentBalance = accTxs[accTxs.length - 1].balance;
        }

        return { id: acc, prevBalance, deposit, withdrawal, currentBalance, hasTx: accTxs.length > 0 };
    }).filter(acc => {
        // HIDE if: Current Balance is 0 AND No transactions today
        // This handles closed/inactive accounts like '대전' after its closing date.
        if (acc.currentBalance === 0 && !acc.hasTx) return false;
        return true;
    });

    const totalSummary = {
        prevBalance: accountSummaries.reduce((s, a) => s + a.prevBalance, 0),
        deposit: accountSummaries.reduce((s, a) => s + a.deposit, 0),
        withdrawal: accountSummaries.reduce((s, a) => s + a.withdrawal, 0),
        currentBalance: accountSummaries.reduce((s, a) => s + a.currentBalance, 0),
    };

    const goDay = (offset: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + offset);
        setDate(d.toISOString().slice(0, 10));
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">자금일보</h2>
                    <p className="text-sm text-zinc-500 mt-1">계좌별 운용 현황 및 입출금 내역</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleAutoClassify}
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                        AI 자동분류
                    </button>

                    {/* Date Picker */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => goDay(-1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-zinc-400">chevron_left</span>
                        </button>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-bold text-white outline-none focus:border-yellow-500/50 [color-scheme:dark]" />
                        <button onClick={() => goDay(1)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-zinc-400">chevron_right</span>
                        </button>
                        <button onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                            className="px-3 py-2 text-xs font-bold text-zinc-400 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                            오늘
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Summary Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-900/80 text-[11px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-800">
                            <th className="px-4 py-3 text-center">은행</th>
                            <th className="px-4 py-3 text-right">전일잔액</th>
                            <th className="px-4 py-3 text-right">입금</th>
                            <th className="px-4 py-3 text-right">출금</th>
                            <th className="px-4 py-3 text-right">현재잔액</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {accountSummaries.map(acc => (
                            <tr key={acc.id} className="text-xs hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-center font-bold text-zinc-300">신한-{acc.id}</td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-500">
                                    {formatCurrency(acc.prevBalance)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-emerald-500">
                                    {acc.deposit > 0 ? formatCurrency(acc.deposit) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-red-400">
                                    {acc.withdrawal > 0 ? formatCurrency(acc.withdrawal) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-zinc-300">
                                    {formatCurrency(acc.currentBalance)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-zinc-800/30 font-bold text-xs border-t border-zinc-800">
                        <tr>
                            <td className="px-4 py-3 text-center text-zinc-400">계</td>
                            <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCurrency(totalSummary.prevBalance)}</td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-500">{formatCurrency(totalSummary.deposit)}</td>
                            <td className="px-4 py-3 text-right font-mono text-red-400">{formatCurrency(totalSummary.withdrawal)}</td>
                            <td className="px-4 py-3 text-right font-mono text-white">{formatCurrency(totalSummary.currentBalance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Transaction List */}
            {loading ? (
                <div className="text-center py-12 text-sm text-zinc-600">불러오는 중...</div>
            ) : txs.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                    <span className="material-symbols-outlined text-3xl text-zinc-700 mb-2 block">event_busy</span>
                    <div className="text-sm font-bold text-zinc-500">{date} 거래 내역 없음</div>
                </div>
            ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h3 className="text-sm font-bold text-white">상세 거래 내역 ({txs.length}건)</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-800">
                                <th className="px-4 py-3">계좌</th>
                                <th className="px-4 py-3">적요</th>
                                <th className="px-4 py-3">내용</th>
                                <th className="px-4 py-3 text-right">입금</th>
                                <th className="px-4 py-3 text-right">출금</th>
                                <th className="px-4 py-3 text-right">잔액</th>
                                <th className="px-4 py-3">분류</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {txs.map((tx, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors text-xs">
                                    <td className="px-4 py-3 text-zinc-500">{tx.account_name || '-'}</td>
                                    <td className="px-4 py-3 text-zinc-300 font-bold">{tx.summary}</td>
                                    <td className="px-4 py-3 text-zinc-500 truncate max-w-[150px]">{tx.description}</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-500">
                                        {tx.deposit > 0 ? `+${formatCurrency(tx.deposit)}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-red-400">
                                        {tx.withdrawal > 0 ? `-${formatCurrency(tx.withdrawal)}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCurrency(tx.balance)}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={tx.category}
                                            onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                                            className="bg-zinc-800 text-[10px] font-bold text-zinc-400 rounded-md px-2 py-1 outline-none focus:bg-zinc-700 w-full appearance-none cursor-pointer hover:bg-zinc-700 transition-colors text-center"
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            {!CATEGORIES.includes(tx.category) && <option value={tx.category}>{tx.category}</option>}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
