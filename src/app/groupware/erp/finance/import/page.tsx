'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { BankTransaction, parseShinhanXlsx, saveTransactions, formatCurrency, applyClassificationRules, pushToCloud, pullFromCloud } from '@/lib/finance-store';

export default function ShinhanImportPage() {
    // ... (state remains same)
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [rawGrid, setRawGrid] = useState<any[][]>([]);
    const [parsedTxs, setParsedTxs] = useState<BankTransaction[]>([]);
    const [saveStats, setSaveStats] = useState<{ inserted: number; skipped: number } | null>(null);
    const [fileName, setFileName] = useState('');
    const [accountName, setAccountName] = useState('086');
    const [importType, setImportType] = useState<'excel' | 'text'>('excel');
    const [smsText, setSmsText] = useState('');

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

    const handleTextParse = async () => {
        if (!smsText.trim()) return;
        setLoading(true);
        setMessage('');
        setSaveStats(null);
        try {
            const res = await fetch('/api/groupware/erp/finance/parse-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: smsText, accountName })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const txs = data.transactions.map((t: any) => ({
                ...t,
                id: Math.random().toString(36).slice(2, 9),
                createdAt: new Date().toISOString(),
                account_name: t.account_name || accountName
            }));

            // AI Learning: Apply learned rules
            const optimizedTxs = await applyClassificationRules(txs);

            setParsedTxs(optimizedTxs);
            setMessage(`✅ ${optimizedTxs.length}건의 거래가 텍스트에서 추출되었습니다.`);
        } catch (err) {
            setMessage(`❌ 텍스트 처리 오류: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
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

    const handleSync = async () => {
        setLoading(true);
        setMessage('🔄 클라우드와 동기화 중...');
        try {
            // Push local changes first
            await pushToCloud();
            // Pull latest from cloud
            const stats = await pullFromCloud();
            setMessage(`✅ 동기화 완료! (가져온 데이터: ${stats.txCount}건)`);
        } catch (err) {
            setMessage('❌ 동기화 실패: ' + (err as Error).message);
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">계좌내역 임포트</h2>
                    <p className="text-sm text-zinc-500 mt-1">신한은행 xlsx 파일에서 거래 내역을 자동으로 추출합니다</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-yellow-500 rounded-xl text-sm font-bold transition-all border border-zinc-700 hover:border-yellow-500/50"
                    title="클라우드 데이터와 양방향 동기화"
                >
                    <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>sync</span>
                    동기화
                </button>
            </div>

            {/* Tab Container */}
            <div className="flex gap-2">
                <button
                    onClick={() => setImportType('excel')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${importType === 'excel'
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                >
                    Excel 파일 임포트
                </button>
                <button
                    onClick={() => setImportType('text')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${importType === 'text'
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                >
                    SMS/텍스트 직접 붙여넣기
                </button>
            </div>

            {/* Account Selector & Upload/Paste Area */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 space-y-6">
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

                {importType === 'excel' ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-800/50 hover:border-yellow-500/30 transition-all group">
                        <span className="material-symbols-outlined text-3xl text-zinc-600 group-hover:text-yellow-500 mb-2">upload_file</span>
                        <span className="text-sm font-bold text-zinc-400 group-hover:text-white">
                            {fileName || '신한은행 xlsx 파일 선택'}
                        </span>
                        <span className="text-[10px] text-zinc-600 mt-1">계좌거래내역 엑셀 파일</span>
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                    </label>
                ) : (
                    <div className="space-y-4">
                        <textarea
                            value={smsText}
                            onChange={(e) => setSmsText(e.target.value)}
                            placeholder="은행에서 온 SMS나 앱 알림 텍스트를 이곳에 붙여넣으세요.&#10;여러 건을 한꺼번에 붙여넣어도 AI가 자동으로 분류합니다."
                            className="w-full h-48 bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-600 resize-none"
                        />
                        <div className="flex justify-center">
                            <button
                                onClick={handleTextParse}
                                disabled={loading || !smsText.trim()}
                                className="px-8 py-3 bg-zinc-100 hover:bg-white text-black rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-30"
                            >
                                <span className="material-symbols-outlined text-[20px]">psychology</span>
                                AI로 텍스트 분석하기
                            </button>
                        </div>
                    </div>
                )}
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
