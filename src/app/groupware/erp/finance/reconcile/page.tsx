'use client';

import { useEffect, useState } from 'react';
import {
    getAllTransactions, getAllSettlements, saveSettlement, deleteSettlement,
    BankTransaction, Settlement, formatCurrency, generateId
} from '@/lib/finance-store';

type Tab = 'unmatched' | 'matched' | 'manual';

export default function ReconcilePage() {
    const [tab, setTab] = useState<Tab>('unmatched');
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);

    // Manual settlement form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        sale_date: new Date().toISOString().slice(0, 10),
        expected_date: '',
        type: '카드' as Settlement['type'],
        gross_amount: '',
        fee: '',
        card_company: '',
        memo: '',
    });

    const reload = async () => {
        setLoading(true);
        const [txs, stls] = await Promise.all([getAllTransactions(), getAllSettlements()]);
        setTransactions(txs);
        setSettlements(stls);
        setLoading(false);
    };

    useEffect(() => { reload(); }, []);

    // Unmatched settlements (no bank tx matched)
    const unmatchedSettlements = settlements.filter(s => !s.matched_tx_id);
    const matchedSettlements = settlements.filter(s => s.matched_tx_id);

    // Expected settlements (unmatched and expected date >= today)
    const today = new Date().toISOString().slice(0, 10);
    const expectedSettlements = settlements.filter(s => !s.matched_tx_id && s.expected_date >= today).sort((a, b) => a.expected_date.localeCompare(b.expected_date));

    // Find potential bank tx matches for a settlement
    const findMatches = (s: Settlement): BankTransaction[] => {
        return transactions.filter(tx => {
            if (tx.deposit === 0) return false;
            // Amount match (within 5% tolerance for fee deductions)
            const diff = Math.abs(tx.deposit - s.net_amount);
            const tolerance = s.gross_amount * 0.05;
            if (diff > tolerance) return false;
            // Date within 7 days of expected
            if (s.expected_date) {
                const expected = new Date(s.expected_date).getTime();
                const actual = new Date(tx.date).getTime();
                const daysDiff = Math.abs(actual - expected) / 86400000;
                if (daysDiff > 7) return false;
            }
            return true;
        });
    };

    const handleMatch = async (settlementId: string, txId: string) => {
        const s = settlements.find(s => s.id === settlementId);
        if (!s) return;
        const tx = transactions.find(t => t.id === txId);
        if (!tx) return;

        await saveSettlement({
            ...s,
            matched_tx_id: txId,
            settled_date: tx.date,
            status: '완료',
        });
        await reload();
    };

    // Auto-calculate expected date based on type
    const handleTypeChange = (type: Settlement['type']) => {
        let daysToAdd = 0;
        if (type === '카드') daysToAdd = 3; // Approx 3 days
        if (type === '네이버페이') daysToAdd = 1; // Approx 1 day

        const d = new Date(form.sale_date);
        d.setDate(d.getDate() + daysToAdd);

        setForm({ ...form, type, expected_date: d.toISOString().slice(0, 10) });
    };

    const handleAddSettlement = async () => {
        const gross = Number(form.gross_amount) || 0;
        const fee = Number(form.fee) || 0;

        await saveSettlement({
            id: generateId(),
            sale_date: form.sale_date,
            expected_date: form.expected_date || form.sale_date,
            settled_date: null,
            type: form.type,
            gross_amount: gross,
            fee,
            net_amount: gross - fee,
            card_company: form.card_company,
            status: '대기',
            memo: form.memo,
            createdAt: new Date().toISOString(),
        });
        setShowForm(false);
        setForm({ sale_date: new Date().toISOString().slice(0, 10), expected_date: '', type: '카드', gross_amount: '', fee: '', card_company: '', memo: '' });
        await reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정산 내역을 삭제하시겠습니까?')) return;
        await deleteSettlement(id);
        await reload();
    };

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: 'unmatched', label: '미매칭', count: unmatchedSettlements.length },
        { key: 'matched', label: '매칭 완료', count: matchedSettlements.length },
        // Use 'expected' as a virtual tab in UI but map to unmatched with filter? No, let's keep it simple.
        // Actually, user wants "Expected Deposit Calendar".
        // Let's add a separate view for logic.
        { key: 'expected' as any, label: '입금 예정', count: expectedSettlements.length },
        { key: 'manual', label: '정산 등록', count: 0 },
    ];

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">정산 대조</h2>
                    <p className="text-sm text-zinc-500 mt-1">카드/네이버페이 정산 ↔ 은행 입금 매칭</p>
                </div>
                <button onClick={() => { setTab('manual'); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-black rounded-xl transition-all">
                    <span className="material-symbols-outlined text-[16px]">add</span> 정산 등록
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 w-fit">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.key ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        {t.label} {t.count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-zinc-800 text-[10px]">{t.count}</span>}
                    </button>
                ))}
            </div>

            {loading && <div className="text-center py-12 text-sm text-zinc-600">불러오는 중...</div>}

            {/* Unmatched Tab */}
            {!loading && tab === 'unmatched' && (
                unmatchedSettlements.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                        <span className="material-symbols-outlined text-3xl text-emerald-600 mb-2 block">check_circle</span>
                        <div className="text-sm font-bold text-zinc-500">모든 정산이 매칭되었습니다</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {unmatchedSettlements.map(s => {
                            const matches = findMatches(s);
                            return (
                                <div key={s.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-500/10 text-yellow-500">{s.type}</span>
                                            <span className="text-sm font-bold text-white">{s.card_company || s.type}</span>
                                            <span className="text-xs text-zinc-500">판매일 {s.sale_date} / <span className="text-zinc-400">입금예정 {s.expected_date}</span></span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-white">₩{formatCurrency(s.net_amount)}</span>
                                            <button onClick={() => handleDelete(s.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    {matches.length > 0 ? (
                                        <div className="space-y-1 mt-2">
                                            <div className="text-[10px] text-zinc-500 font-bold">매칭 가능한 입금 내역:</div>
                                            {matches.map(tx => (
                                                <div key={tx.id} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <span className="text-zinc-500 font-mono">{tx.date}</span>
                                                        <span className="text-zinc-300">{tx.description}</span>
                                                        <span className="text-emerald-500 font-mono">₩{formatCurrency(tx.deposit)}</span>
                                                    </div>
                                                    <button onClick={() => handleMatch(s.id, tx.id)}
                                                        className="px-3 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px] font-bold rounded-lg transition-all">
                                                        매칭
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-zinc-600 mt-1">매칭 가능한 은행 입금 내역 없음</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Matched Tab */}
            {!loading && tab === 'matched' && (
                matchedSettlements.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                        <span className="material-symbols-outlined text-3xl text-zinc-700 mb-2 block">link_off</span>
                        <div className="text-sm font-bold text-zinc-500">매칭된 정산 내역 없음</div>
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-800">
                                    <th className="px-4 py-3">유형</th>
                                    <th className="px-4 py-3">판매일</th>
                                    <th className="px-4 py-3">입금일</th>
                                    <th className="px-4 py-3 text-right">매출액</th>
                                    <th className="px-4 py-3 text-right">수수료</th>
                                    <th className="px-4 py-3 text-right">정산액</th>
                                    <th className="px-4 py-3">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {matchedSettlements.map(s => (
                                    <tr key={s.id} className="hover:bg-white/5 transition-colors text-xs">
                                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-300">{s.type}</span></td>
                                        <td className="px-4 py-3 font-mono text-zinc-400">{s.sale_date}</td>
                                        <td className="px-4 py-3 font-mono text-zinc-400">{s.settled_date || '-'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-zinc-300">₩{formatCurrency(s.gross_amount)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-red-400">{s.fee > 0 ? `-₩${formatCurrency(s.fee)}` : '-'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-500 font-bold">₩{formatCurrency(s.net_amount)}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-500">{s.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Expected Tab */}
            {!loading && (tab as any) === 'expected' && (
                expectedSettlements.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                        <span className="material-symbols-outlined text-3xl text-zinc-700 mb-2 block">event_available</span>
                        <div className="text-sm font-bold text-zinc-500">입금 예정 내역 없음</div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">입금 예정 리스트</h3>
                            <div className="space-y-3">
                                {expectedSettlements.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <div className="text-[10px] font-bold text-zinc-500">입금예정</div>
                                                <div className="text-sm font-black text-white">{s.expected_date}</div>
                                            </div>
                                            <div className="h-8 w-px bg-zinc-800"></div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500">{s.type}</span>
                                                    <span className="text-sm font-bold text-zinc-300">{s.card_company}</span>
                                                </div>
                                                <div className="text-xs text-zinc-500">판매일: {s.sale_date}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-base font-black text-emerald-500">₩{formatCurrency(s.net_amount)}</div>
                                            <div className="text-[10px] text-zinc-500">수수료 제외 후</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Manual Tab - Add Form */}
            {tab === 'manual' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-5">
                    <h3 className="text-sm font-bold text-white">정산 내역 등록</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">판매일</label>
                            <input type="date" value={form.sale_date} onChange={e => {
                                setForm({ ...form, sale_date: e.target.value });
                                // Recalculate expected date? Maybe user will trigger it via type change or manual input
                            }}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-yellow-500/50" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">예상 입금일</label>
                            <input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-yellow-500/50" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">정산 유형</label>
                            <select value={form.type} onChange={e => handleTypeChange(e.target.value as any)}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none">
                                <option value="카드">카드</option>
                                <option value="네이버페이">네이버페이</option>
                                <option value="현금">현금</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">카드사/플랫폼</label>
                            <input type="text" value={form.card_company} onChange={e => setForm({ ...form, card_company: e.target.value })}
                                placeholder="예: 삼성카드, 네이버페이"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-yellow-500/50" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">매출액</label>
                            <input type="number" value={form.gross_amount} onChange={e => setForm({ ...form, gross_amount: e.target.value })}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-yellow-500/50" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">수수료</label>
                            <input type="number" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-yellow-500/50" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 block mb-1">메모</label>
                        <input type="text" value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-yellow-500/50" />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleAddSettlement}
                            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-black rounded-xl transition-all">
                            등록
                        </button>
                        <button onClick={() => setTab('unmatched')}
                            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm font-bold rounded-xl transition-all">
                            취소
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
