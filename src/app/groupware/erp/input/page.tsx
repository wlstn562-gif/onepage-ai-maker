'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SalesRecord, SalesItem, saveSalesRecord, generateId, BRANCHES, PAYMENT_TYPES, ITEM_NAMES, VISIT_ROUTES, formatCurrency } from '@/lib/erp-store';

const DRAFT_KEY = 'erp-sales-input-draft';

const emptyItem = (): SalesItem => ({
    reservationName: '',
    time: '',
    itemCode: '00001',
    itemName: '여권',
    pax: 1,
    paymentType: '플레이스',
    paymentCount: 1,
    unitPrice: 10000,
    supplyValue: 9091,
    vat: 909,
    visitRoute: '재방문',
    address: '',
    foreignNationality: '',
    note: '',
});

export default function SalesInputPage() {
    const today = new Date().toISOString().slice(0, 10);

    const [date, setDate] = useState(today);
    const [staffName, setStaffName] = useState('');
    const [branch, setBranch] = useState('천안점');
    const [customer, setCustomer] = useState('매장고객');
    const [items, setItems] = useState<SalesItem[]>([emptyItem(), emptyItem(), emptyItem()]);
    const [saved, setSaved] = useState(false);
    const [lastAutoSave, setLastAutoSave] = useState<string>('');
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [pendingDraft, setPendingDraft] = useState<any>(null);

    // Load staff name from cookie
    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };
        const n = getCookie('user-name');
        if (n) {
            try {
                let decoded = n;
                for (let i = 0; i < 3; i++) {
                    if (decoded.includes('%')) decoded = decodeURIComponent(decoded);
                    else break;
                }
                setStaffName(decoded);
            } catch { setStaffName(n); }
        }

        // Check for draft — show dialog instead of auto-restoring
        try {
            const draft = localStorage.getItem(DRAFT_KEY);
            if (draft) {
                const d = JSON.parse(draft);
                const hasData = d.items && d.items.some((item: any) => item.reservationName?.trim());
                if (hasData) {
                    setPendingDraft(d);
                }
            }
        } catch { }
    }, []);

    const applyDraft = () => {
        if (!pendingDraft) return;
        if (pendingDraft.date) setDate(pendingDraft.date);
        if (pendingDraft.branch) setBranch(pendingDraft.branch);
        if (pendingDraft.customer) setCustomer(pendingDraft.customer);
        if (pendingDraft.items && pendingDraft.items.length > 0) setItems(pendingDraft.items);
        if (pendingDraft.staffName) setStaffName(pendingDraft.staffName);
        setLastAutoSave('임시저장 복원됨');
        setPendingDraft(null);
    };

    const discardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setPendingDraft(null);
    };

    // Auto-save draft function
    const saveDraft = useCallback(() => {
        try {
            const draft = { date, staffName, branch, customer, items };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            const now = new Date();
            setLastAutoSave(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} 자동저장`);
        } catch { }
    }, [date, staffName, branch, customer, items]);

    // Auto-save every 1 minute
    useEffect(() => {
        autoSaveTimerRef.current = setInterval(() => {
            saveDraft();
        }, 60000); // 1분
        return () => {
            if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
        };
    }, [saveDraft]);

    // Save draft on tab close / refresh
    useEffect(() => {
        const handleBeforeUnload = () => {
            try {
                const draft = { date, staffName, branch, customer, items };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            } catch { }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [date, staffName, branch, customer, items]);

    const updateItem = (index: number, field: keyof SalesItem, value: any) => {
        setItems(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };

            // Auto-calculate supply/vat when unitPrice or pax changes
            if (field === 'unitPrice' || field === 'pax' || field === 'paymentCount') {
                const item = next[index];
                const total = item.unitPrice * item.paymentCount;
                next[index].supplyValue = Math.round(total / 1.1);
                next[index].vat = total - Math.round(total / 1.1);
            }
            return next;
        });
    };

    const addRow = () => setItems(prev => [...prev, emptyItem()]);

    const removeRow = (index: number) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.paymentCount), 0);

    const handleSave = () => {
        const validItems = items.filter(item => item.reservationName.trim() !== '');
        if (validItems.length === 0) {
            alert('최소 1건 이상의 예약자명을 입력해주세요.');
            return;
        }

        const record: SalesRecord = {
            id: generateId(),
            date,
            staffId: '',
            staffName,
            branch,
            customer,
            taxType: '부가세포함 적용',
            items: validItems,
            totalAmount: validItems.reduce((sum, item) => sum + (item.unitPrice * item.paymentCount), 0),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        saveSalesRecord(record);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);

        // Clear draft after successful save
        localStorage.removeItem(DRAFT_KEY);
        setLastAutoSave('');

        // Reset for next entry
        setItems([emptyItem(), emptyItem(), emptyItem()]);
    };

    return (
        <div className="space-y-6">
            {/* Draft Restore Dialog */}
            {pendingDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-400">history</span>
                            </div>
                            <div>
                                <h3 className="text-white font-bold">임시저장 데이터 발견</h3>
                                <p className="text-xs text-zinc-500">이전에 작성 중이던 데이터가 있습니다</p>
                            </div>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-3 mb-5 text-sm">
                            <div className="flex justify-between text-zinc-400">
                                <span>일자</span>
                                <span className="text-white font-mono">{pendingDraft.date || '-'}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 mt-1">
                                <span>지점</span>
                                <span className="text-white">{pendingDraft.branch || '-'}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400 mt-1">
                                <span>입력 건수</span>
                                <span className="text-white">{pendingDraft.items?.filter((i: any) => i.reservationName?.trim()).length || 0}건</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={discardDraft}
                                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 font-medium text-sm transition-colors">
                                취소
                            </button>
                            <button onClick={applyDraft}
                                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors">
                                적용
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">판매입력</h2>
                    <p className="text-sm text-zinc-500 mt-1">이카운트 ERP 스타일 판매 전표 입력</p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        저장 완료!
                    </div>
                )}
                {!saved && lastAutoSave && (
                    <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                        {lastAutoSave}
                    </div>
                )}
            </div>

            {/* Header Info - eCount Style */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">일자</label>
                        <input
                            type="date"
                            value={date}
                            min="2021-01-01"
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">거래처</label>
                        <input
                            type="text"
                            value={customer}
                            onChange={e => setCustomer(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">담당자</label>
                        <input
                            type="text"
                            value={staffName}
                            onChange={e => setStaffName(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">출하창고 (지점)</label>
                        <select
                            value={branch}
                            onChange={e => setBranch(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50"
                        >
                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                    <span>거래유형: <strong className="text-zinc-300">부가세포함 적용</strong></span>
                    <span>통화: <strong className="text-zinc-300">내자</strong></span>
                </div>
            </div>

            {/* Grid Table - eCount Style */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-800/50 border-b border-zinc-700">
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 w-8">#</th>
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 min-w-[100px]">예약자명</th>
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 w-20">시간대</th>
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 min-w-[80px]">품목명</th>
                                <th className="px-2 py-3 text-center text-xs font-bold text-zinc-400 w-16">총인원</th>
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 min-w-[90px]">결제유형</th>
                                <th className="px-2 py-3 text-center text-xs font-bold text-zinc-400 w-16">결제수량</th>
                                <th className="px-2 py-3 text-right text-xs font-bold text-zinc-400 w-24">단가(VAT포함)</th>
                                <th className="px-2 py-3 text-right text-xs font-bold text-zinc-400 w-24">공급가액</th>
                                <th className="px-2 py-3 text-right text-xs font-bold text-zinc-400 w-20">부가세</th>
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 min-w-[80px]">방문경로</th>
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 min-w-[80px]">주소지</th>
                                <th className="px-2 py-3 text-left text-xs font-bold text-zinc-400 min-w-[60px]">비고</th>
                                <th className="px-2 py-3 w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-2 py-1.5">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">{idx + 1}</span>
                                    </td>
                                    <td className="px-1 py-1">
                                        <input type="text" value={item.reservationName} onChange={e => updateItem(idx, 'reservationName', e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500/50 focus:bg-zinc-800" placeholder="이름" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input type="text" value={item.time} onChange={e => updateItem(idx, 'time', e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500/50" placeholder="1000" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <select value={item.itemName} onChange={e => updateItem(idx, 'itemName', e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white">
                                            {ITEM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-1 py-1">
                                        <input type="number" value={item.pax} onChange={e => updateItem(idx, 'pax', Number(e.target.value))}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white text-center" min={1} />
                                    </td>
                                    <td className="px-1 py-1">
                                        <select value={item.paymentType} onChange={e => updateItem(idx, 'paymentType', e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white">
                                            {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-1 py-1">
                                        <input type="number" value={item.paymentCount} onChange={e => updateItem(idx, 'paymentCount', Number(e.target.value))}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white text-center" min={1} />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 text-right text-zinc-300 font-mono text-xs">{formatCurrency(item.supplyValue)}</td>
                                    <td className="px-2 py-1.5 text-right text-zinc-400 font-mono text-xs">{formatCurrency(item.vat)}</td>
                                    <td className="px-1 py-1">
                                        <select value={item.visitRoute} onChange={e => updateItem(idx, 'visitRoute', e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white">
                                            {VISIT_ROUTES.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-1 py-1">
                                        <input type="text" value={item.address} onChange={e => updateItem(idx, 'address', e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white" placeholder="동/구" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input type="text" value={item.note} onChange={e => updateItem(idx, 'note', e.target.value)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded px-2 py-1.5 text-sm text-white" placeholder="" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <button onClick={() => removeRow(idx)} className="text-zinc-600 hover:text-red-400 transition-colors" title="삭제">
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/30 border-t border-zinc-700">
                    <div className="flex items-center gap-2">
                        <button onClick={addRow} className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            행 추가
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="text-xs text-zinc-500">합계 금액</span>
                            <p className="text-lg font-bold text-white font-mono">{formatCurrency(totalAmount)}원</p>
                        </div>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            저장(F8)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
