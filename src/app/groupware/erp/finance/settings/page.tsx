'use client';

import { useState, useEffect } from 'react';
import { clearAllData, clearTransactions, exportAllData, importBackup, getAllTransactions, restoreCategoriesFromBackup, pushToCloud, pullFromCloud, getAllSettlements, isAutoSyncEnabled, setAutoSyncEnabled } from '@/lib/finance-store';

export default function SettingsPage() {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [autoSync, setAutoSync] = useState(false);

    useEffect(() => {
        loadLocalCounts();
        setAutoSync(isAutoSyncEnabled());
    }, []);

    const loadLocalCounts = async () => {
        // No longer needed to fetchRedisStatus here, but if we need counts for other checks we can keep it simple
    };


    const handleToggleAutoSync = (enabled: boolean) => {
        setAutoSync(enabled);
        setAutoSyncEnabled(enabled);
        if (enabled) {
            setMessage('✅ 자동 동기화가 활성화되었습니다.');
        } else {
            setMessage('ℹ️ 자동 동기화가 비활성화되었습니다.');
        }
    };

    // ... (existing handlers)

    const handleSmartRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!confirm('현재 거래내역에 백업 파일의 분류 정보를 덮어씌웁니다.\n계속하시겠습니까?')) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const json = evt.target?.result as string;
                const count = await restoreCategoriesFromBackup(json);
                setMessage(`✅ 분류 복원 완료: ${count}건 업데이트됨`);
            } catch {
                setMessage('❌ 복원 실패: 유효하지 않은 파일');
            }
            setLoading(false);
        };
        reader.readAsText(file);
    };

    const handleCheckData = async () => {
        await loadLocalCounts();
    };

    const handleClearAll = async () => {
        if (!confirm('⚠️ 모든 자금 데이터(거래내역, 정산, 예산)를 삭제합니다.\n이 작업은 되돌릴 수 없습니다.\n\n계속하시겠습니까?')) return;
        if (!confirm('정말로 전체 데이터를 삭제하시겠습니까?')) return;
        setLoading(true);
        await clearAllData();
        setMessage('✅ 모든 데이터가 삭제되었습니다.');
        await loadLocalCounts();
        setLoading(false);
    };

    const handleClearTx = async () => {
        if (!confirm('거래 내역만 삭제합니다. 정산/예산 데이터는 유지됩니다.\n계속하시겠습니까?')) return;
        setLoading(true);
        await clearTransactions();
        setMessage('✅ 거래 내역이 삭제되었습니다.');
        await loadLocalCounts();
        setLoading(false);
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const json = await exportAllData();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            setMessage('✅ 백업 파일이 다운로드되었습니다.');
        } catch {
            setMessage('❌ 내보내기 실패');
        }
        setLoading(false);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const json = evt.target?.result as string;
                const stats = await importBackup(json);
                setMessage(`✅ 복원 완료: 거래 ${stats.txCount}건, 정산 ${stats.settleCount}건, 예산 ${stats.budgetCount}건`);
                await loadLocalCounts();
            } catch {
                setMessage('❌ 복원 실패: 유효하지 않은 파일');
            }
            setLoading(false);
        };
        reader.readAsText(file);
    };

    const handleDeleteOldDB = () => {
        if (!confirm('이전 버전의 IndexedDB (finance_db)를 삭제합니다. 계속하시겠습니까?')) return;
        try {
            indexedDB.deleteDatabase('finance_db');
            indexedDB.deleteDatabase('finance_db_v2');
            setMessage('✅ 이전 DB 삭제 완료');
        } catch {
            setMessage('❌ 삭제 실패');
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold text-white">설정</h2>
                <p className="text-sm text-zinc-500 mt-1">데이터 관리 및 시스템 설정</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border text-sm font-bold ${message.includes('❌') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    {message}
                </div>
            )}

            {/* Cloud Sync */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 shadow-xl shadow-yellow-500/5">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-yellow-500 text-2xl">cloud_sync</span>
                    <div>
                        <h3 className="text-sm font-bold text-white">클라우드 동기화 설정</h3>
                        <p className="text-[10px] text-zinc-500">다른 기기와 데이터를 공유하려면 동기화 기능을 활용하세요.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${autoSync ? 'text-yellow-500' : 'text-zinc-600'}`}>
                            {autoSync ? 'sync' : 'sync_disabled'}
                        </span>
                        <div>
                            <div className="text-xs font-bold text-white">자동 동기화</div>
                            <div className="text-[10px] text-zinc-500">데이터 변경 시 서버에 자동 저장 및 앱 실행 시 자동 로드</div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggleAutoSync(!autoSync)}
                        className={`w-10 h-5 rounded-full transition-all relative ${autoSync ? 'bg-yellow-500' : 'bg-zinc-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoSync ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                    <p className="text-[10px] text-zinc-500 leading-normal">
                        <span className="text-yellow-500 font-bold">💡 Tip:</span> 이제 수동 동기화(올리기/받기)는 <strong>계좌내역 임포트</strong> 페이지에서 한 번의 동기화 버튼으로 간편하게 수행할 수 있습니다.
                    </p>
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[18px] text-blue-500">model_training</span> 분류 복원 (Smart Restore)
                </h3>
                <div className="text-sm text-zinc-400 mb-4">
                    <p>데이터 초기화 후 엑셀을 다시 업로드했을 때, <strong className="text-white">이존에 분류했던 카테고리만</strong> 다시 불러옵니다.</p>
                    <p className="text-xs text-zinc-500 mt-1">* 날짜, 금액, 적요가 일치하는 거래를 찾아 자동으로 적용합니다.</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">restore_page</span>
                        분류만 복원하기 (JSON)
                        <input type="file" accept=".json" onChange={handleSmartRestore} className="hidden" />
                    </label>
                </div>
            </div>


            {/* Backup & Restore */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[18px] text-blue-400">backup</span> 백업 / 복원
                </h3>
                <div className="flex gap-3">
                    <button onClick={handleExport} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all">
                        <span className="material-symbols-outlined text-[16px]">download</span> JSON 내보내기
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">upload</span> JSON 복원
                        <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                    </label>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[18px]">warning</span> 위험 영역
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                        <div>
                            <div className="text-sm font-bold text-zinc-300">거래 내역 초기화</div>
                            <div className="text-[10px] text-zinc-500">정산/예산 데이터는 유지됩니다</div>
                        </div>
                        <button onClick={handleClearTx} disabled={loading}
                            className="px-4 py-2 bg-zinc-800 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl transition-all">
                            초기화
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                        <div>
                            <div className="text-sm font-bold text-zinc-300">전체 데이터 삭제</div>
                            <div className="text-[10px] text-zinc-500">거래내역, 정산, 예산 모든 데이터 삭제</div>
                        </div>
                        <button onClick={handleClearAll} disabled={loading}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl transition-all">
                            전체 삭제
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                        <div>
                            <div className="text-sm font-bold text-zinc-300">이전 버전 DB 삭제</div>
                            <div className="text-[10px] text-zinc-500">구 finance_db, finance_db_v2 정리</div>
                        </div>
                        <button onClick={handleDeleteOldDB}
                            className="px-4 py-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 text-sm font-bold rounded-xl transition-all">
                            정리
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
