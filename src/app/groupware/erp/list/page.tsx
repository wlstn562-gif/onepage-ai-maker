'use client';

import { useState, useEffect } from 'react';
import { getAllSales, deleteSalesRecord, SalesRecord, formatCurrency, BRANCHES } from '@/lib/erp-store';

export default function SalesListPage() {
    const [records, setRecords] = useState<SalesRecord[]>([]);
    const [filterBranch, setFilterBranch] = useState('전체');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    useEffect(() => {
        loadRecords();
        // Default date range: current month
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        setFilterDateFrom(`${y}-${m}-01`);
        setFilterDateTo(now.toISOString().slice(0, 10));
    }, []);

    const loadRecords = () => setRecords(getAllSales());

    const filtered = records.filter(r => {
        if (filterBranch !== '전체' && r.branch !== filterBranch) return false;
        if (filterDateFrom && r.date < filterDateFrom) return false;
        if (filterDateTo && r.date > filterDateTo) return false;
        return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

    const handleDelete = (id: string) => {
        if (!confirm('이 전표를 삭제하시겠습니까?')) return;
        deleteSalesRecord(id);
        loadRecords();
    };

    const totalFiltered = filtered.reduce((sum, r) => sum + r.totalAmount, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">판매조회</h2>
                <p className="text-sm text-zinc-500 mt-1">일자별 판매 전표 리스트</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">시작일</label>
                        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <span className="text-zinc-500 pb-2">~</span>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">종료일</label>
                        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">창고</label>
                        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50">
                            <option value="전체">전체</option>
                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <button onClick={loadRecords}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        조회
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-800/50 border-b border-zinc-700">
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 w-10">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400">일자-No.</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400">거래처</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400">품목명(요약)</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-400">금액합계</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400">거래유형</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400">창고명</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-zinc-400">삭제</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                                        <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">receipt_long</span>
                                        조회 결과가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((record, idx) => {
                                    const itemSummary = record.items.length > 0
                                        ? `${record.items[0].itemName} 외 ${record.items.length}건`
                                        : '-';
                                    return (
                                        <tr key={record.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-4 py-3 text-zinc-500">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-blue-400 font-medium">{record.date}</span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-300">{record.customer}</td>
                                            <td className="px-4 py-3 text-zinc-300">{itemSummary}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-white">{formatCurrency(record.totalAmount)}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-medium">부가세포함 적용</span>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-300">{record.branch}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleDelete(record.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Summary */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/30 border-t border-zinc-700">
                    <span className="text-xs text-zinc-500">{filtered.length}건 조회됨</span>
                    <div className="text-right">
                        <span className="text-xs text-zinc-500 mr-3">합계</span>
                        <span className="text-lg font-bold text-yellow-400 font-mono">{formatCurrency(totalFiltered)}원</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
