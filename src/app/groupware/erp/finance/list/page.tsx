'use client';

import { useEffect, useState } from 'react';
import {
    getAllTransactions,
    BankTransaction,
    formatCurrency,
    CATEGORIES,
    updateTransaction,
    deleteTransaction
} from '@/lib/finance-store';

export default function FinanceListPage() {
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [filtered, setFiltered] = useState<BankTransaction[]>([]);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [account, setAccount] = useState('all');
    const [category, setCategory] = useState('all');
    const [keyword, setKeyword] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 50;

    // Editing
    const [editingTx, setEditingTx] = useState<BankTransaction | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [transactions, startDate, endDate, account, category, keyword]);

    const loadData = async () => {
        const all = await getAllTransactions();
        // Default sort by date desc
        all.sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
        setTransactions(all);
    };

    const applyFilters = () => {
        let res = [...transactions];

        if (startDate) res = res.filter(t => t.date >= startDate);
        if (endDate) res = res.filter(t => t.date <= endDate);
        if (account !== 'all') res = res.filter(t => t.account_name === account);
        if (category !== 'all') res = res.filter(t => t.category === category);
        if (keyword) {
            const low = keyword.toLowerCase();
            res = res.filter(t =>
                t.summary.toLowerCase().includes(low) ||
                t.description.toLowerCase().includes(low) ||
                t.memo.toLowerCase().includes(low)
            );
        }

        setFiltered(res);
        setPage(1);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까? 복구할 수 없습니다.')) return;
        await deleteTransaction(id);
        await loadData();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTx) return;
        await updateTransaction(editingTx);
        setEditingTx(null);
        await loadData();
    };

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / pageSize);
    const currentData = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-6 max-w-7xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">전체 거래내역</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        총 {filtered.length.toLocaleString()}건
                        {filtered.length !== transactions.length && ` (전체 ${transactions.length.toLocaleString()}건 중)`}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">기간</label>
                    <div className="flex items-center gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-yellow-500" />
                        <span className="text-zinc-600">~</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-yellow-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">계좌</label>
                    <select value={account} onChange={e => setAccount(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-yellow-500 w-32">
                        <option value="all">전체</option>
                        <option value="086">086</option>
                        <option value="110">110</option>
                        <option value="청주">청주</option>
                        <option value="726">726</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">카테고리</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-yellow-500 w-32">
                        <option value="all">전체</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 mb-1">검색</label>
                    <input type="text" placeholder="적요, 내용, 메모 검색" value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-yellow-500" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden min-h-[500px]">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900 border-b border-zinc-800">
                        <tr className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            <th className="px-4 py-3">날짜</th>
                            <th className="px-4 py-3">계좌</th>
                            <th className="px-4 py-3">적요/내용</th>
                            <th className="px-4 py-3 text-right">금액</th>
                            <th className="px-4 py-3 text-right">잔액</th>
                            <th className="px-4 py-3">분류</th>
                            <th className="px-4 py-3">메모</th>
                            <th className="px-4 py-3 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {currentData.map(tx => (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors text-xs group">
                                <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">{tx.date}</td>
                                <td className="px-4 py-3 text-zinc-500">{tx.account_name || '-'}</td>
                                <td className="px-4 py-3">
                                    <div className="text-zinc-300 font-bold">{tx.summary}</div>
                                    {tx.description && tx.description !== tx.summary && (
                                        <div className="text-zinc-600 truncate max-w-[200px]">{tx.description}</div>
                                    )}
                                </td>
                                <td className={`px-4 py-3 text-right font-mono font-bold ${tx.deposit > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                    {tx.deposit > 0 ? `+${formatCurrency(tx.deposit)}` : `-${formatCurrency(tx.withdrawal)}`}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-zinc-500">{formatCurrency(tx.balance)}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{tx.category}</span>
                                </td>
                                <td className="px-4 py-3 text-zinc-500 max-w-[150px] truncate">{tx.memo}</td>
                                <td className="px-4 py-3 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingTx(tx)} className="text-blue-400 hover:text-blue-300">수정</button>
                                    <button onClick={() => handleDelete(tx.id)} className="text-red-400 hover:text-red-300">삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {currentData.length === 0 && (
                    <div className="p-10 text-center text-zinc-500 text-sm">검색 결과가 없습니다.</div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-zinc-800 rounded text-zinc-400 disabled:opacity-50">prev</button>
                    <span className="px-3 py-1 text-zinc-500 text-sm">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 bg-zinc-800 rounded text-zinc-400 disabled:opacity-50">next</button>
                </div>
            )}

            {/* Edit Modal */}
            {editingTx && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <form onSubmit={handleUpdate} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-[400px] space-y-4">
                        <h3 className="text-lg font-bold text-white">거래 내역 수정</h3>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">날짜</label>
                            <input type="date" required value={editingTx.date} onChange={e => setEditingTx({ ...editingTx, date: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 output-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">계좌</label>
                            <select value={editingTx.account_name || '086'} onChange={e => setEditingTx({ ...editingTx, account_name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none">
                                <option value="086">086</option>
                                <option value="110">110</option>
                                <option value="청주">청주</option>
                                <option value="726">726</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">적요</label>
                            <input type="text" required value={editingTx.summary} onChange={e => setEditingTx({ ...editingTx, summary: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">내용</label>
                            <input type="text" value={editingTx.description} onChange={e => setEditingTx({ ...editingTx, description: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">카테고리</label>
                            <select value={editingTx.category} onChange={e => setEditingTx({ ...editingTx, category: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1">메모</label>
                            <input type="text" value={editingTx.memo} onChange={e => setEditingTx({ ...editingTx, memo: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button type="button" onClick={() => setEditingTx(null)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm font-bold">취소</button>
                            <button type="submit" className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-bold">저장</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
