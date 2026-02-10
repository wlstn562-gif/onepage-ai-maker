'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    FinanceTransaction, saveTransactionsAsync, getAllTransactionsAsync, clearAllTransactionsAsync,
    deduplicateTransactionsAsync, generateFinanceId, formatCurrency, getMonthlySummaryAsync, CATEGORIES
} from '@/lib/finance-store';

interface ExcelRow {
    [key: string]: any;
}

export default function FundDailyPage() {
    const [rawText, setRawText] = useState('');
    const [parsed, setParsed] = useState<FinanceTransaction[]>([]);
    const [savedCount, setSavedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'sms' | 'excel'>('sms');
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
    const [excelRawText, setExcelRawText] = useState('');
    const [excelFileName, setExcelFileName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Quick stats
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [monthlySummary, setMonthlySummary] = useState<{ yearMonth: string; totalIncome: number; totalExpense: number; netProfit: number; count: number } | null>(null);

    const refreshStats = async () => {
        const all = await getAllTransactionsAsync();
        setSavedCount(all.length);
        setMonthlySummary(await getMonthlySummaryAsync(currentYM));
    };

    useEffect(() => {
        refreshStats();
    }, [currentYM]);

    // ===== Excel Handling =====
    const handleExcelFile = useCallback((file: File) => {
        setExcelFileName(file.name);
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                // Raw text for AI
                const allText: string[] = [];
                workbook.SheetNames.forEach(name => {
                    const sheet = workbook.Sheets[name];
                    allText.push(XLSX.utils.sheet_to_csv(sheet, { blankrows: false }));
                });
                setExcelRawText(allText.join('\n'));
                // JSON for direct mapping
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                if (jsonData.length > 0) {
                    setExcelHeaders(Object.keys(jsonData[0]));
                    setExcelData(jsonData);
                }
            } catch (err: any) {
                setError('파일 읽기 실패: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
            handleExcelFile(file);
        } else {
            setError('.xlsx, .xls, .csv 파일만 지원합니다.');
        }
    };

    // ===== AI Parse: SMS =====
    const handleParseSMS = async () => {
        if (!rawText.trim()) { setError('은행 문자 내역을 붙여넣어주세요.'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/studio/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: 'data', mode: 'team', history: [],
                    message: `다음 은행 문자/거래 내역을 분석하여 JSON 배열로 변환해주세요.
각 항목은 반드시 아래 형식:
[{"trans_date":"2026-02-10","type":"지출","amount":50000,"client":"스타벅스","description":"카드결제","category":"식대/복리후생","project_name":"공통운영"}]

type: "매출" 또는 "지출"
category: ${CATEGORIES.join(', ')}
project_name: 프로젝트명 (모르면 "공통운영")
꼭 JSON 배열만 출력. 설명 불필요.

--- 은행 문자 ---
${rawText}`
                })
            });
            const data = await res.json();
            const responseText = (data.response || '').replace(/```json\s*/g, '').replace(/```\s*/g, '');
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const txs: FinanceTransaction[] = JSON.parse(jsonMatch[0]).map((t: any) => ({
                    id: generateFinanceId(),
                    trans_date: t.trans_date || t.date || '',
                    type: String(t.type || '').includes('매출') || String(t.type || '').includes('income') ? '매출' as const : '지출' as const,
                    amount: Math.abs(Number(t.amount) || 0),
                    client: t.client || t.vendor || '',
                    description: t.description || t.memo || '',
                    category: t.category || '기타운영비',
                    project_name: t.project_name || '공통운영',
                    createdAt: new Date().toISOString(),
                })).filter((tx: FinanceTransaction) => tx.amount > 0);
                setParsed(txs);
            } else {
                setError('AI가 데이터를 파싱하지 못했습니다.');
            }
        } catch (e: any) { setError('서버 오류: ' + e.message); }
        finally { setLoading(false); }
    };

    // ===== AI Parse: Excel =====
    const handleParseExcel = async () => {
        if (!excelRawText && excelData.length === 0) { setError('먼저 파일을 업로드해주세요.'); return; }
        setLoading(true); setError('');
        try {
            const truncated = excelRawText.length > 8000 ? excelRawText.slice(0, 8000) : excelRawText;
            const res = await fetch('/api/studio/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: 'data', mode: 'team', history: [],
                    message: `아래 엑셀 데이터에서 자금 거래 내역을 추출하세요.
JSON 배열 형식:
[{"trans_date":"2021-03-25","type":"지출","amount":50000,"client":"스타벅스","description":"카드결제","category":"식대/복리후생","project_name":"공통운영"}]

type: "매출"(입금/수입) 또는 "지출"(출금/비용)
category: ${CATEGORIES.join(', ')}
합계행/잔액행 제외. JSON만 출력.

--- 엑셀 데이터 ---
${truncated}`
                })
            });
            const data = await res.json();
            const responseText = (data.response || '').replace(/```json\s*/g, '').replace(/```\s*/g, '');
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const txs: FinanceTransaction[] = JSON.parse(jsonMatch[0]).map((t: any) => ({
                    id: generateFinanceId(),
                    trans_date: t.trans_date || t.date || '',
                    type: String(t.type || '').includes('매출') || String(t.type || '').includes('income') ? '매출' as const : '지출' as const,
                    amount: Math.abs(Number(String(t.amount || '0').replace(/[^0-9.-]/g, '')) || 0),
                    client: t.client || t.vendor || '',
                    description: t.description || t.memo || '',
                    category: t.category || '기타운영비',
                    project_name: t.project_name || t.project || '공통운영',
                    createdAt: new Date().toISOString(),
                })).filter((tx: FinanceTransaction) => tx.amount > 0);
                setParsed(txs);
            } else {
                setError('AI가 데이터를 파싱하지 못했습니다.');
            }
        } catch (e: any) { setError('서버 오류: ' + e.message); }
        finally { setLoading(false); }
    };

    // ===== Direct Excel Import (clean CSV) =====
    const handleDirectImport = () => {
        if (excelData.length === 0) return;
        const findCol = (keywords: string[]) =>
            excelHeaders.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';
        const dateCol = findCol(['날짜', '일자', 'date', 'trans_date']);
        const typeCol = findCol(['구분', 'type', '유형']);
        const amountCol = findCol(['금액', 'amount', '입금', '출금']);
        const clientCol = findCol(['거래처', 'client', '사용처', '상호']);
        const descCol = findCol(['적요', '내용', 'description', '설명', '메모']);
        const catCol = findCol(['카테고리', '계정', 'category', '과목']);
        const projCol = findCol(['프로젝트', 'project', '사업']);

        const txs: FinanceTransaction[] = excelData.map(row => {
            const rawType = String(row[typeCol] || '지출');
            const type: '매출' | '지출' = rawType.includes('매출') || rawType.includes('income') || rawType.includes('입금') ? '매출' : '지출';
            return {
                id: generateFinanceId(),
                trans_date: String(row[dateCol] || ''),
                type,
                amount: Math.abs(Number(String(row[amountCol] || '0').replace(/[^0-9.-]/g, '')) || 0),
                client: String(row[clientCol] || ''),
                description: String(row[descCol] || ''),
                category: String(row[catCol] || (type === '매출' ? '매출' : '기타운영비')),
                project_name: String(row[projCol] || '공통운영'),
                createdAt: new Date().toISOString(),
            };
        }).filter(tx => tx.amount > 0);
        setParsed(txs);
    };

    // ===== Save to finance_transactions =====
    const handleSave = async () => {
        const result = await saveTransactionsAsync(parsed);
        if (result.skipped > 0) {
            alert(`저장 완료!\n✅ 신규 ${result.inserted}건 저장\n⚠️ 중복 ${result.skipped}건 스킵`);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setParsed([]);
        setRawText('');
        setExcelData([]);
        setExcelRawText('');
        setExcelFileName('');
        refreshStats();
    };

    const handleClear = async () => {
        if (!confirm('모든 자금일보 데이터를 삭제하시겠습니까?')) return;
        await clearAllTransactionsAsync();
        refreshStats();
    };

    const handleDeduplicate = async () => {
        const result = await deduplicateTransactionsAsync();
        if (result.removed === 0) {
            alert('중복 데이터가 없습니다.');
        } else {
            alert(`중복 정리 완료!\n전체 ${result.before}건 → ${result.after}건\n🗑️ ${result.removed}건 제거`);
        }
        refreshStats();
    };

    const getCatColor = (cat: string) => {
        const m: Record<string, string> = {
            '매출': 'bg-green-500/10 text-green-400', '식대/복리후생': 'bg-purple-500/10 text-purple-400',
            '인건비': 'bg-rose-500/10 text-rose-400', '장비비': 'bg-blue-500/10 text-blue-400',
            '소모품비': 'bg-cyan-500/10 text-cyan-400', '기타운영비': 'bg-zinc-500/10 text-zinc-400',
        };
        return m[cat] || 'bg-zinc-500/10 text-zinc-400';
    };

    return (
        <div className="space-y-6">
            {/* Header + Quick Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400">account_balance</span>
                        자금일보
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">은행 문자 또는 거래내역을 올리면 AI가 자동 분류합니다</p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        자금일보 적용 완료!
                    </div>
                )}
            </div>

            {/* Quick Stats Bar */}
            {monthlySummary && (
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-zinc-500">이번 달 매출</p>
                        <p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(monthlySummary.totalIncome)}원</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-zinc-500">이번 달 지출</p>
                        <p className="text-sm font-bold text-red-400 font-mono">{formatCurrency(monthlySummary.totalExpense)}원</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-zinc-500">순이익</p>
                        <p className={`text-sm font-bold font-mono ${monthlySummary.netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatCurrency(monthlySummary.netProfit)}원</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-zinc-500">전체 등록</p>
                        <p className="text-sm font-bold text-amber-400 font-mono">{savedCount}건</p>
                    </div>
                </div>
            )}

            {/* Data Management */}
            <div className="flex gap-2 justify-end">
                <button onClick={handleDeduplicate}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                    중복 정리
                </button>
                <button onClick={handleClear}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                    전체 초기화
                </button>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                <button onClick={() => setActiveTab('sms')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'sms' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">sms</span>
                    은행 문자 붙여넣기
                </button>
                <button onClick={() => setActiveTab('excel')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'excel' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    엑셀/CSV 업로드
                </button>
            </div>

            {/* SMS Tab */}
            {activeTab === 'sms' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <textarea
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                        rows={8}
                        placeholder={`신한카드 승인\n이디센스\n50,000원\n03/15 14:30\n스타벅스 천안점\n누적 1,234,567원\n\n여러 건을 한번에 붙여넣어도 됩니다`}
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 resize-none focus:ring-2 focus:ring-amber-500/50 font-mono"
                    />
                    <div className="mt-3 flex justify-end">
                        <button onClick={handleParseSMS} disabled={loading}
                            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-amber-500/20">
                            {loading ? (
                                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>분석 중...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">auto_awesome</span>AI 자동 분류</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Excel Tab */}
            {activeTab === 'excel' && (
                <div className="space-y-4">
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`bg-zinc-900/50 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-amber-400 bg-amber-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}
                    >
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && handleExcelFile(e.target.files[0])} className="hidden" />
                        <span className={`material-symbols-outlined text-3xl mb-2 block ${dragOver ? 'text-amber-400' : 'text-zinc-500'}`}>cloud_upload</span>
                        <p className="text-sm font-bold text-zinc-300">파일을 드래그하거나 클릭</p>
                        <p className="text-xs text-zinc-500 mt-1">.xlsx, .xls, .csv — 어떤 형식이든 AI가 알아서 파악</p>
                        {excelFileName && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-medium">
                                <span className="material-symbols-outlined text-[16px]">description</span>
                                {excelFileName} ({excelData.length}행)
                            </div>
                        )}
                    </div>
                    {(excelData.length > 0 || excelRawText) && parsed.length === 0 && (
                        <div className="flex gap-2 justify-end">
                            <button onClick={handleDirectImport}
                                className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                                <span className="material-symbols-outlined text-[16px]">table_view</span>
                                컬럼 자동매핑 (깔끔한 CSV용)
                            </button>
                            <button onClick={handleParseExcel} disabled={loading}
                                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-bold px-5 py-2 rounded-lg text-xs transition-colors shadow-lg shadow-amber-500/20">
                                {loading ? (
                                    <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>분석 중...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-[16px]">auto_awesome</span>🤖 AI 자동 분석</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-sm text-red-400 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">error</span>{error}</p>}

            {/* Parsed Preview */}
            {parsed.length > 0 && (
                <div className="bg-zinc-900/50 border border-amber-500/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-amber-400">✨ AI 분석 결과 ({parsed.length}건)</h4>
                        <div className="flex gap-2">
                            <button onClick={() => setParsed([])}
                                className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded border border-zinc-700">다시 분석</button>
                            <button onClick={handleSave}
                                className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-green-600/20">
                                <span className="material-symbols-outlined text-[16px]">save</span>
                                자금일보 적용 ({parsed.length}건)
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0">
                                <tr className="bg-zinc-800">
                                    <th className="px-2 py-2 text-left text-zinc-400">#</th>
                                    <th className="px-2 py-2 text-left text-zinc-400">일자</th>
                                    <th className="px-2 py-2 text-center text-zinc-400">구분</th>
                                    <th className="px-2 py-2 text-right text-zinc-400">금액</th>
                                    <th className="px-2 py-2 text-left text-zinc-400">거래처</th>
                                    <th className="px-2 py-2 text-left text-zinc-400">적요</th>
                                    <th className="px-2 py-2 text-left text-zinc-400">계정과목</th>
                                    <th className="px-2 py-2 text-left text-zinc-400">프로젝트</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsed.slice(0, 100).map((tx, i) => (
                                    <tr key={i} className="border-t border-zinc-800/30 hover:bg-zinc-800/20">
                                        <td className="px-2 py-1.5 text-zinc-500">{i + 1}</td>
                                        <td className="px-2 py-1.5 text-zinc-300 font-mono">{tx.trans_date}</td>
                                        <td className="px-2 py-1.5 text-center">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tx.type === '매출' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{tx.type}</span>
                                        </td>
                                        <td className="px-2 py-1.5 text-right text-white font-mono font-bold">{formatCurrency(tx.amount)}</td>
                                        <td className="px-2 py-1.5 text-zinc-300">{tx.client}</td>
                                        <td className="px-2 py-1.5 text-zinc-400 max-w-[180px] truncate">{tx.description}</td>
                                        <td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCatColor(tx.category)}`}>{tx.category}</span></td>
                                        <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px]">{tx.project_name}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer actions */}
            {savedCount > 0 && (
                <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>현재 {savedCount}건 등록됨 · 월마감 페이지에서 전체 현황을 확인하세요</span>
                    <button onClick={handleClear} className="text-red-500/50 hover:text-red-400 transition-colors">전체 삭제</button>
                </div>
            )}
        </div>
    );
}
