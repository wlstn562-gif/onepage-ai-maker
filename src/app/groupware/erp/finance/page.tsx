'use client';

import { useState, useEffect } from 'react';
import {
    FinanceTransaction, saveTransaction, getProjects, addProject,
    CATEGORIES, generateFinanceId, formatCurrency
} from '@/lib/finance-store';

export default function FinanceInputPage() {
    const today = new Date().toISOString().slice(0, 10);

    const [transDate, setTransDate] = useState(today);
    const [type, setType] = useState<'매출' | '지출'>('지출');
    const [amount, setAmount] = useState('');
    const [client, setClient] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('기타운영비');
    const [projectName, setProjectName] = useState('공통운영');
    const [projects, setProjects] = useState<string[]>([]);
    const [newProject, setNewProject] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);
    const [saved, setSaved] = useState(false);
    const [recentTx, setRecentTx] = useState<FinanceTransaction[]>([]);

    useEffect(() => {
        setProjects(getProjects());
    }, []);

    // Format amount with commas
    const handleAmountChange = (val: string) => {
        const num = val.replace(/[^0-9]/g, '');
        setAmount(num);
    };

    const displayAmount = amount ? Number(amount).toLocaleString('ko-KR') : '';

    const handleAddProject = () => {
        if (newProject.trim()) {
            addProject(newProject.trim());
            setProjects(getProjects());
            setProjectName(newProject.trim());
            setNewProject('');
            setShowNewProject(false);
        }
    };

    const handleSave = () => {
        if (!amount || Number(amount) === 0) {
            alert('금액을 입력해주세요.');
            return;
        }
        if (!client.trim()) {
            alert('거래처를 입력해주세요.');
            return;
        }

        const tx: FinanceTransaction = {
            id: generateFinanceId(),
            trans_date: transDate,
            type,
            amount: Number(amount),
            client: client.trim(),
            description: description.trim(),
            category: type === '매출' ? '매출' : category,
            project_name: projectName,
            createdAt: new Date().toISOString(),
        };

        saveTransaction(tx);
        setRecentTx(prev => [tx, ...prev].slice(0, 5));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);

        // Reset form
        setAmount('');
        setClient('');
        setDescription('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400">account_balance</span>
                        자금 등록
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">매출/지출 내역을 등록합니다</p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        저장 완료!
                    </div>
                )}
            </div>

            {/* Input Form */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 날짜 */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-2">날짜</label>
                        <input
                            type="date"
                            value={transDate}
                            onChange={e => setTransDate(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {/* 구분 */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-2">구분</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setType('매출')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === '매출'
                                        ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                                    }`}
                            >
                                📈 입금 (매출)
                            </button>
                            <button
                                onClick={() => setType('지출')}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === '지출'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                                    }`}
                            >
                                📉 출금 (지출)
                            </button>
                        </div>
                    </div>

                    {/* 금액 */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-2">금액</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={displayAmount}
                                onChange={e => handleAmountChange(e.target.value)}
                                placeholder="0"
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white font-mono text-right pr-10 focus:ring-2 focus:ring-emerald-500/50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">원</span>
                        </div>
                    </div>

                    {/* 거래처 */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-2">거래처</label>
                        <input
                            type="text"
                            value={client}
                            onChange={e => setClient(e.target.value)}
                            placeholder="거래처명 입력"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {/* 적요 */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-2">적요 (내용)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="상세 내용 입력"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    {/* 계정과목 (지출일 때만) */}
                    {type === '지출' && (
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-2">계정과목</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50"
                            >
                                {CATEGORIES.filter(c => c !== '매출').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 관련 프로젝트 */}
                    <div className={type === '매출' ? 'md:col-span-2' : ''}>
                        <label className="block text-xs font-bold text-zinc-400 mb-2">관련 프로젝트</label>
                        <div className="flex gap-2">
                            <select
                                value={projectName}
                                onChange={e => {
                                    if (e.target.value === '__new__') {
                                        setShowNewProject(true);
                                    } else {
                                        setProjectName(e.target.value);
                                    }
                                }}
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500/50"
                            >
                                {projects.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                                <option value="__new__">＋ 신규 프로젝트 추가</option>
                            </select>
                        </div>
                        {showNewProject && (
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    value={newProject}
                                    onChange={e => setNewProject(e.target.value)}
                                    placeholder="새 프로젝트명"
                                    className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500/50"
                                    onKeyDown={e => e.key === 'Enter' && handleAddProject()}
                                />
                                <button onClick={handleAddProject}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">
                                    추가
                                </button>
                                <button onClick={() => setShowNewProject(false)}
                                    className="px-3 py-2 bg-zinc-700 text-zinc-400 rounded-lg text-xs transition-colors">
                                    취소
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-emerald-600/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        저장
                    </button>
                </div>
            </div>

            {/* Recent Transactions */}
            {recentTx.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-zinc-800/30 border-b border-zinc-800">
                        <h4 className="text-sm font-bold text-zinc-300">📋 방금 등록한 내역</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-zinc-800/20">
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">일자</th>
                                    <th className="px-3 py-2 text-center text-xs font-bold text-zinc-400">구분</th>
                                    <th className="px-3 py-2 text-right text-xs font-bold text-zinc-400">금액</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">거래처</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">적요</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-zinc-400">프로젝트</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.map(tx => (
                                    <tr key={tx.id} className="border-t border-zinc-800/30">
                                        <td className="px-3 py-2 text-zinc-300 text-xs font-mono">{tx.trans_date}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${tx.type === '매출' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-xs font-bold text-white">{formatCurrency(tx.amount)}</td>
                                        <td className="px-3 py-2 text-zinc-300 text-xs">{tx.client}</td>
                                        <td className="px-3 py-2 text-zinc-400 text-xs">{tx.description}</td>
                                        <td className="px-3 py-2">
                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">{tx.project_name}</span>
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
