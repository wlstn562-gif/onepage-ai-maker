'use client';

import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    FinanceTransaction, saveTransactions, generateFinanceId, formatCurrency
} from '@/lib/finance-store';

interface ExcelRow {
    [key: string]: any;
}

export default function FinanceImportPage() {
    const [excelData, setExcelData] = useState<ExcelRow[]>([]);
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [imported, setImported] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<FinanceTransaction[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Column mapping state
    const [colMap, setColMap] = useState({
        trans_date: '', type: '', amount: '', client: '',
        description: '', category: '', project_name: '',
    });

    const handleFile = useCallback((file: File) => {
        setFileName(file.name);
        setError('');
        setImported(false);
        setPreview([]);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                if (json.length === 0) {
                    setError('파일에 데이터가 없습니다.');
                    return;
                }
                const headers = Object.keys(json[0]);
                setExcelHeaders(headers);
                setExcelData(json);

                // Auto-map columns
                const autoMap = { ...colMap };
                const findCol = (keywords: string[]) =>
                    headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || '';

                autoMap.trans_date = findCol(['날짜', '일자', 'date', 'trans_date']);
                autoMap.type = findCol(['구분', 'type', '유형']);
                autoMap.amount = findCol(['금액', 'amount', '입금', '출금']);
                autoMap.client = findCol(['거래처', 'client', '사용처']);
                autoMap.description = findCol(['적요', '내용', 'description', '설명']);
                autoMap.category = findCol(['카테고리', '계정', 'category', '과목']);
                autoMap.project_name = findCol(['프로젝트', 'project', '사업']);
                setColMap(autoMap);
            } catch (err: any) {
                setError('파일 읽기 실패: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }, [colMap]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) {
            handleFile(file);
        } else {
            setError('.xlsx, .xls, .csv 파일만 지원합니다.');
        }
    };

    const handlePreview = () => {
        const txs: FinanceTransaction[] = excelData.map(row => {
            const rawType = String(row[colMap.type] || '지출');
            const type: '매출' | '지출' = rawType.includes('매출') || rawType.includes('income') || rawType.includes('입금') ? '매출' : '지출';
            const rawAmount = String(row[colMap.amount] || '0').replace(/[^0-9.-]/g, '');

            return {
                id: generateFinanceId(),
                trans_date: String(row[colMap.trans_date] || ''),
                type,
                amount: Math.abs(Number(rawAmount) || 0),
                client: String(row[colMap.client] || ''),
                description: String(row[colMap.description] || ''),
                category: String(row[colMap.category] || (type === '매출' ? '매출' : '기타운영비')),
                project_name: String(row[colMap.project_name] || '공통운영'),
                createdAt: new Date().toISOString(),
            };
        }).filter(tx => tx.amount > 0);

        setPreview(txs);
    };

    const handleImport = () => {
        if (preview.length === 0) return;
        setLoading(true);
        setTimeout(() => {
            saveTransactions(preview);
            setImportedCount(preview.length);
            setImported(true);
            setLoading(false);
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">upload_file</span>
                    CSV/엑셀 데이터 임포트
                </h2>
                <p className="text-sm text-zinc-500 mt-1">과거 자금일보 데이터를 업로드하여 일괄 등록합니다 (2021년 등)</p>
            </div>

            {imported && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-400 text-2xl">task_alt</span>
                    <div>
                        <p className="text-green-400 font-bold">{importedCount}건 임포트 완료!</p>
                        <p className="text-xs text-zinc-400">대시보드에서 확인하세요</p>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`bg-zinc-900/50 border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-400 bg-purple-500/5' : 'border-zinc-700 hover:border-zinc-500'
                    }`}
            >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
                <span className={`material-symbols-outlined text-4xl mb-3 block ${dragOver ? 'text-purple-400' : 'text-zinc-500'}`}>cloud_upload</span>
                <p className="text-sm font-bold text-zinc-300">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-xs text-zinc-500 mt-1">.xlsx, .xls, .csv 형식 지원</p>
                {fileName && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium">
                        <span className="material-symbols-outlined text-[18px]">description</span>
                        {fileName} ({excelData.length}행)
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Column Mapping */}
            {excelData.length > 0 && preview.length === 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-zinc-300 mb-4">🔗 컬럼 매핑 (자동 감지됨 — 수정 가능)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(colMap).map(([key, val]) => (
                            <div key={key}>
                                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">
                                    {key === 'trans_date' ? '날짜' : key === 'type' ? '구분' : key === 'amount' ? '금액' :
                                        key === 'client' ? '거래처' : key === 'description' ? '적요' :
                                            key === 'category' ? '계정과목' : '프로젝트'}
                                </label>
                                <select
                                    value={val}
                                    onChange={e => setColMap(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                                >
                                    <option value="">-- 선택 --</option>
                                    {excelHeaders.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-xs text-zinc-500">{excelData.length}행 감지됨</p>
                        <button onClick={handlePreview}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">
                            <span className="material-symbols-outlined text-[16px]">preview</span>
                            미리보기
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Table */}
            {preview.length > 0 && !imported && (
                <div className="bg-zinc-900/50 border border-purple-500/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-purple-500/5 border-b border-purple-500/20 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-purple-400">✨ 변환 미리보기 ({preview.length}건)</h4>
                        <button onClick={handleImport} disabled={loading}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors">
                            <span className="material-symbols-outlined text-[16px]">{loading ? 'progress_activity' : 'database'}</span>
                            {loading ? '저장 중...' : `${preview.length}건 일괄 저장`}
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0">
                                <tr className="bg-zinc-800">
                                    <th className="px-2 py-2 text-left text-zinc-400 font-bold">#</th>
                                    <th className="px-2 py-2 text-left text-zinc-400 font-bold">일자</th>
                                    <th className="px-2 py-2 text-center text-zinc-400 font-bold">구분</th>
                                    <th className="px-2 py-2 text-right text-zinc-400 font-bold">금액</th>
                                    <th className="px-2 py-2 text-left text-zinc-400 font-bold">거래처</th>
                                    <th className="px-2 py-2 text-left text-zinc-400 font-bold">적요</th>
                                    <th className="px-2 py-2 text-left text-zinc-400 font-bold">계정과목</th>
                                    <th className="px-2 py-2 text-left text-zinc-400 font-bold">프로젝트</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.slice(0, 50).map((tx, i) => (
                                    <tr key={i} className="border-t border-zinc-800/30 hover:bg-zinc-800/20">
                                        <td className="px-2 py-1.5 text-zinc-500">{i + 1}</td>
                                        <td className="px-2 py-1.5 text-zinc-300 font-mono">{tx.trans_date}</td>
                                        <td className="px-2 py-1.5 text-center">
                                            <span className={`px-1.5 py-0.5 rounded font-bold ${tx.type === '매출' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1.5 text-right text-white font-mono font-bold">{formatCurrency(tx.amount)}</td>
                                        <td className="px-2 py-1.5 text-zinc-300">{tx.client}</td>
                                        <td className="px-2 py-1.5 text-zinc-400 max-w-[200px] truncate">{tx.description}</td>
                                        <td className="px-2 py-1.5 text-zinc-400">{tx.category}</td>
                                        <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{tx.project_name}</span></td>
                                    </tr>
                                ))}
                                {preview.length > 50 && (
                                    <tr><td colSpan={8} className="px-2 py-2 text-center text-zinc-500">... 외 {preview.length - 50}건</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
