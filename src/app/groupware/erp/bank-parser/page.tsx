'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { BankTransaction, saveBankTransactions, getAllBankTransactions, clearBankTransactions, generateId, formatCurrency } from '@/lib/erp-store';

interface ExcelRow {
    [key: string]: any;
}

export default function BankParserPage() {
    const [rawText, setRawText] = useState('');
    const [parsed, setParsed] = useState<BankTransaction[]>([]);
    const [saved, setSaved] = useState<BankTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'sms' | 'excel'>('sms');
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
    const [excelFileName, setExcelFileName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSaved(getAllBankTransactions());
    }, []);

    // Excel file handler
    const handleExcelFile = useCallback((file: File) => {
        setExcelFileName(file.name);
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                if (jsonData.length === 0) {
                    setError('엑셀 파일에 데이터가 없습니다.');
                    return;
                }
                setExcelHeaders(Object.keys(jsonData[0]));
                setExcelData(jsonData);
            } catch (err: any) {
                setError('엑셀 파일을 읽지 못했습니다: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleExcelFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            handleExcelFile(file);
        } else {
            setError('.xlsx, .xls, .csv 파일만 지원합니다.');
        }
    };

    // Convert Excel data to BankTransactions via AI
    const handleExcelToAI = async () => {
        if (excelData.length === 0) return;
        setLoading(true);
        setError('');

        // Send first 50 rows as sample for AI classification
        const sample = excelData.slice(0, 50);
        const csvText = [excelHeaders.join(','), ...sample.map(row => excelHeaders.map(h => row[h]).join(','))].join('\n');

        try {
            const res = await fetch('/api/studio/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: 'data',
                    mode: 'team',
                    history: [],
                    message: `다음 엑셀/CSV 데이터를 분석하여 JSON 배열로 변환해주세요. 각 항목은 반드시 아래 형식을 따라야 합니다:
[{"date":"2021-03-15","time":"","type":"expense","amount":50000,"vendor":"스타벅스","category":"복리후생비","memo":"카드결제"}]

type은 "income" 또는 "expense"만 가능합니다.
category는 다음 중에서 선택: 매출, 복리후생비, 소모품비, 여비교통비, 통신비, 광고선전비, 접대비, 수수료, 임대료, 기타
금액이 양수면 입금(income), 음수이거나 출금이면 expense입니다.
꼭 JSON 배열만 출력하세요. 설명은 불필요합니다.

--- 엑셀 데이터 (CSV) ---
${csvText}`
                })
            });

            const data = await res.json();
            const responseText = data.response || '';
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const transactions: BankTransaction[] = JSON.parse(jsonMatch[0]).map((t: any) => ({
                    ...t,
                    id: generateId(),
                    amount: Math.abs(t.amount || 0),
                    balance: t.balance || 0,
                    raw: '',
                }));
                setParsed(transactions);
            } else {
                setError('AI가 엑셀 데이터를 분류하지 못했습니다.');
            }
        } catch (e: any) {
            setError('서버 오류: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    // Direct import without AI (raw excel rows as transactions)
    const handleDirectImport = () => {
        const transactions: BankTransaction[] = excelData.map(row => {
            // Attempt smart field mapping
            const findCol = (keywords: string[]) => {
                return excelHeaders.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';
            };
            const dateCol = findCol(['날짜', '일자', 'date', '거래일']);
            const timeCol = findCol(['시간', 'time']);
            const amountCol = findCol(['금액', '출금', '입금', 'amount', '거래금액']);
            const vendorCol = findCol(['사용처', '거래처', '적요', '내용', 'vendor', '가맹점']);
            const memoCol = findCol(['메모', '비고', 'memo', '적요']);

            const rawAmount = Number(String(row[amountCol] || '0').replace(/[^\d.-]/g, ''));

            return {
                id: generateId(),
                date: String(row[dateCol] || ''),
                time: String(row[timeCol] || ''),
                type: rawAmount >= 0 ? 'income' as const : 'expense' as const,
                amount: Math.abs(rawAmount),
                balance: 0,
                vendor: String(row[vendorCol] || ''),
                category: '기타',
                memo: String(row[memoCol] || ''),
                raw: JSON.stringify(row),
            };
        });
        setParsed(transactions);
    };

    const handleParse = async () => {
        if (!rawText.trim()) {
            setError('은행 문자 내역을 붙여넣어주세요.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/studio/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: 'data',
                    mode: 'team',
                    history: [],
                    message: `다음 은행 문자/거래 내역을 분석하여 JSON 배열로 변환해주세요. 각 항목은 반드시 아래 형식을 따라야 합니다:
[{"date":"2026-02-10","time":"14:30","type":"expense","amount":50000,"vendor":"스타벅스 천안점","category":"복리후생비","memo":"카드결제"}]

type은 "income" 또는 "expense"만 가능합니다.
category는 다음 중에서 선택: 매출, 복리후생비, 소모품비, 여비교통비, 통신비, 광고선전비, 접대비, 수수료, 임대료, 기타
꼭 JSON 배열만 출력하세요. 설명은 불필요합니다.

--- 은행 문자 내역 ---
${rawText}`
                })
            });

            const data = await res.json();
            const responseText = data.response || '';

            // Extract JSON from response
            const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                const transactions: BankTransaction[] = JSON.parse(jsonMatch[0]).map((t: any) => ({
                    ...t,
                    id: generateId(),
                    balance: t.balance || 0,
                    raw: '',
                }));
                setParsed(transactions);
            } else {
                setError('AI가 데이터를 파싱하지 못했습니다. 문자 형식을 확인해주세요.');
            }
        } catch (e: any) {
            setError('서버 오류: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        saveBankTransactions(parsed);
        setSaved(prev => [...prev, ...parsed]);
        setParsed([]);
        setRawText('');
    };

    const handleClear = () => {
        if (!confirm('모든 자금일보 데이터를 삭제하시겠습니까?')) return;
        clearBankTransactions();
        setSaved([]);
    };

    const incomeTotal = saved.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenseTotal = saved.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            '매출': 'bg-green-500/10 text-green-400',
            '복리후생비': 'bg-purple-500/10 text-purple-400',
            '소모품비': 'bg-blue-500/10 text-blue-400',
            '여비교통비': 'bg-cyan-500/10 text-cyan-400',
            '통신비': 'bg-indigo-500/10 text-indigo-400',
            '광고선전비': 'bg-pink-500/10 text-pink-400',
            '접대비': 'bg-amber-500/10 text-amber-400',
            '수수료': 'bg-orange-500/10 text-orange-400',
            '임대료': 'bg-red-500/10 text-red-400',
        };
        return colors[cat] || 'bg-zinc-500/10 text-zinc-400';
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">smart_toy</span>
                    AI 자금일보 조수
                </h2>
                <p className="text-sm text-zinc-500 mt-1">신한/신협 등 은행 문자를 붙여넣으면 AI가 자동 분류합니다</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500">총 입금</p>
                    <p className="text-xl font-bold text-green-400 font-mono mt-1">{formatCurrency(incomeTotal)}원</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500">총 출금</p>
                    <p className="text-xl font-bold text-red-400 font-mono mt-1">{formatCurrency(expenseTotal)}원</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-500">순이익</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${incomeTotal - expenseTotal >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {formatCurrency(incomeTotal - expenseTotal)}원
                    </p>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('sms')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'sms' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">sms</span>
                    은행 문자 입력
                </button>
                <button
                    onClick={() => setActiveTab('excel')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'excel' ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    엑셀 파일 업로드
                </button>
            </div>

            {/* SMS Input Area */}
            {activeTab === 'sms' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <label className="block text-sm font-bold text-zinc-300 mb-3">
                        📱 은행 문자 내역 붙여넣기
                    </label>
                    <textarea
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                        placeholder={`예시:\n[신한] 02/10 14:30 출금 50,000원 스타벅스천안점 잔액 1,234,567원\n[신한] 02/10 15:00 입금 710,000원 매장고객 잔액 1,944,567원\n[신한카드] 승인 김진수 50,000원 네이버페이 02/10 14:25\n\n여러 건의 문자를 한 번에 붙여넣으셔도 됩니다.`}
                        className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500/50 resize-none font-mono"
                    />
                    {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={handleParse}
                            disabled={loading}
                            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    AI 분석 중...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                    AI 자동 분류
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Excel Upload Area */}
            {activeTab === 'excel' && (
                <div className="space-y-4">
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`bg-zinc-900/50 border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-emerald-400 bg-emerald-500/5' : 'border-zinc-700 hover:border-zinc-500'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        <span className={`material-symbols-outlined text-4xl mb-3 block ${dragOver ? 'text-emerald-400' : 'text-zinc-500'}`}>cloud_upload</span>
                        <p className="text-sm font-bold text-zinc-300">엑셀 파일을 드래그하거나 클릭하여 업로드</p>
                        <p className="text-xs text-zinc-500 mt-1">.xlsx, .xls, .csv 형식 지원 (2021년 자금일보 등 과거 데이터 OK)</p>
                        {excelFileName && (
                            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[18px]">description</span>
                                {excelFileName}
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    {/* Excel Preview */}
                    {excelData.length > 0 && (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-zinc-800/30 border-b border-zinc-800 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-zinc-300">📊 엑셀 미리보기 ({excelData.length}행)</h4>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDirectImport}
                                        className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">table_rows</span>
                                        그대로 가져오기
                                    </button>
                                    <button onClick={handleExcelToAI}
                                        disabled={loading}
                                        className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                        {loading ? 'AI 분석 중...' : 'AI 자동 분류'}
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0">
                                        <tr className="bg-zinc-800">
                                            <th className="px-2 py-2 text-left text-zinc-400 font-bold">#</th>
                                            {excelHeaders.map(h => (
                                                <th key={h} className="px-2 py-2 text-left text-zinc-400 font-bold whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {excelData.slice(0, 30).map((row, i) => (
                                            <tr key={i} className="border-t border-zinc-800/30 hover:bg-zinc-800/20">
                                                <td className="px-2 py-1.5 text-zinc-500">{i + 1}</td>
                                                {excelHeaders.map(h => (
                                                    <td key={h} className="px-2 py-1.5 text-zinc-300 whitespace-nowrap max-w-[200px] truncate">{String(row[h] ?? '')}</td>
                                                ))}
                                            </tr>
                                        ))}
                                        {excelData.length > 30 && (
                                            <tr><td colSpan={excelHeaders.length + 1} className="px-2 py-2 text-center text-zinc-500 text-xs">... 외 {excelData.length - 30}행 더 있음</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Parsed Results Preview */}
            {parsed.length > 0 && (
                <div className="bg-zinc-900/50 border border-amber-500/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/20 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-amber-400">✨ AI 분류 결과 ({parsed.length}건)</h4>
                        <button onClick={handleSave}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                            <span className="material-symbols-outlined text-[16px]">save</span>
                            자금일보에 저장
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-zinc-800/30">
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">일자</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">시간</th>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-zinc-400">구분</th>
                                    <th className="px-3 py-2 text-right text-xs font-bold text-zinc-400">금액</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">사용처</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">카테고리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsed.map((t, i) => (
                                    <tr key={i} className="border-t border-zinc-800/30">
                                        <td className="px-3 py-2 text-zinc-300 text-xs">{t.date}</td>
                                        <td className="px-3 py-2 text-zinc-400 text-xs">{t.time}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {t.type === 'income' ? '입금' : '출금'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-xs font-bold text-white">{formatCurrency(t.amount)}</td>
                                        <td className="px-3 py-2 text-zinc-300 text-xs">{t.vendor}</td>
                                        <td className="px-3 py-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${getCategoryColor(t.category)}`}>{t.category}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Saved Transactions */}
            {saved.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-300">📋 자금일보 ({saved.length}건)</h4>
                        <button onClick={handleClear} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">전체 초기화</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-zinc-800/30">
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">일자</th>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-zinc-400">구분</th>
                                    <th className="px-3 py-2 text-right text-xs font-bold text-zinc-400">금액</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">사용처</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">카테고리</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">메모</th>
                                </tr>
                            </thead>
                            <tbody>
                                {saved.map((t, i) => (
                                    <tr key={t.id} className="border-t border-zinc-800/30 hover:bg-zinc-800/20">
                                        <td className="px-3 py-2 text-zinc-500 text-xs">{i + 1}</td>
                                        <td className="px-3 py-2 text-zinc-300 text-xs">{t.date}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {t.type === 'income' ? '입금' : '출금'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-xs font-bold text-white">{formatCurrency(t.amount)}</td>
                                        <td className="px-3 py-2 text-zinc-300 text-xs">{t.vendor}</td>
                                        <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded font-medium ${getCategoryColor(t.category)}`}>{t.category}</span></td>
                                        <td className="px-3 py-2 text-zinc-500 text-xs">{t.memo}</td>
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
