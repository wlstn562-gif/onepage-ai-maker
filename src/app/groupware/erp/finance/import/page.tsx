'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { BankTransaction, parseShinhanXlsx, saveTransactions, formatCurrency, applyClassificationRules } from '@/lib/finance-store';

export default function ShinhanImportPage() {
    // ... (state remains same)
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [rawGrid, setRawGrid] = useState<any[][]>([]);
    const [parsedTxs, setParsedTxs] = useState<BankTransaction[]>([]);
    const [saveStats, setSaveStats] = useState<{ inserted: number; skipped: number } | null>(null);
    const [fileName, setFileName] = useState('');
    const [accountName, setAccountName] = useState('086');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        setMessage('');
        setSaveStats(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = evt.target?.result;
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
                setRawGrid(grid);

                const txs = parseShinhanXlsx(grid, accountName);

                // AI Learning: Apply learned rules
                const optimizedTxs = await applyClassificationRules(txs);

                setParsedTxs(optimizedTxs);
                setMessage(`✅ ${optimizedTxs.length}건의 거래가 추출되고 AI 규칙이 적용되었습니다.`);
            } catch (err) {
                setMessage(`❌ 파일 처리 오류: ${(err as Error).message}`);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSave = async () => {
        if (parsedTxs.length === 0) return;
        setLoading(true);
        setMessage('💾 저장 중...');
        try {
            const res = await saveTransactions(parsedTxs, true);
            setSaveStats(res);
            setParsedTxs([]);
            setRawGrid([]);
            setMessage('✅ 저장 완료!');
        } catch {
            setMessage('❌ 저장 실패');
        } finally {
            setLoading(false);
        }
    };

    // Summary stats
    const totalDeposit = parsedTxs.reduce((s, t) => s + t.deposit, 0);
    const totalWithdrawal = parsedTxs.reduce((s, t) => s + t.withdrawal, 0);
    const dateRange = parsedTxs.length > 0
        ? `${parsedTxs[parsedTxs.length - 1].date} ~ ${parsedTxs[0].date}`
        : '';

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-white">계좌내역 임포트</h2>
                <p className="text-sm text-zinc-500 mt-1">신한은행 xlsx 파일에서 거래 내역을 자동으로 추출합니다</p>
            </div>

            {/* Account Selector & Upload Area */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-4">
                <div className="flex justify-center">
                    <select
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-yellow-500"
                    >
                        <option value="086">086 (법인 메인)</option>
                        <option value="110">110 (서브)</option>
                        <option value="대전">대전 (폐쇄)</option>
                        <option value="청주">청주 (지사)</option>
                        <option value="726">726 (기타)</option>
                    </select>
                </div>

                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-800/50 hover:border-yellow-500/30 transition-all group">
                    <span className="material-symbols-outlined text-3xl text-zinc-600 group-hover:text-yellow-500 mb-2">upload_file</span>
                    <span className="text-sm font-bold text-zinc-400 group-hover:text-white">
                        {fileName || '신한은행 xlsx 파일 선택'}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-1">계좌거래내역 엑셀 파일</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                </label>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-xl border text-sm font-bold ${message.includes('❌') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {loading && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-middle" />}
                    {message}
                </div>
            )}

            {/* Save Stats */}
            {saveStats && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
                        <div>
                            <div className="text-sm font-bold text-white">임포트 완료</div>
                            <div className="text-xs text-zinc-500">중복 내역은 자동으로 제외되었습니다.</div>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-center">
                            <div className="text-xl font-black text-emerald-500">{saveStats.inserted}</div>
                            <div className="text-[10px] text-zinc-500 font-bold">추가됨</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-black text-zinc-400">{saveStats.skipped}</div>
                            <div className="text-[10px] text-zinc-500 font-bold">중복 제외</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Table */}
            {parsedTxs.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    {/* Summary Header */}
                    <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">{parsedTxs.length}건 미리보기</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">{dateRange}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-500">입금 합계</div>
                                <div className="text-sm font-bold text-emerald-500">+{formatCurrency(totalDeposit)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-500">출금 합계</div>
                                <div className="text-sm font-bold text-red-400">-{formatCurrency(totalWithdrawal)}</div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-sm font-black transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span> 저장
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-zinc-900 z-10">
                                <tr className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-800">
                                    <th className="px-4 py-3">날짜</th>
                                    <th className="px-4 py-3">적요</th>
                                    <th className="px-4 py-3">내용</th>
                                    <th className="px-4 py-3 text-right">입금</th>
                                    <th className="px-4 py-3 text-right">출금</th>
                                    <th className="px-4 py-3 text-right">잔액</th>
                                    <th className="px-4 py-3">분류</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {parsedTxs.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors text-xs">
                                        <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">{tx.date}</td>
                                        <td className="px-4 py-3 text-zinc-300 font-bold">{tx.summary}</td>
                                        <td className="px-4 py-3 text-zinc-500 truncate max-w-[180px]">{tx.description}</td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-500">
                                            {tx.deposit > 0 ? `+${formatCurrency(tx.deposit)}` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-red-400">
                                            {tx.withdrawal > 0 ? `-${formatCurrency(tx.withdrawal)}` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCurrency(tx.balance)}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-400">{tx.category}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
