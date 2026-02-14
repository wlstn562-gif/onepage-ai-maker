'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllTransactions, BankTransaction, formatCurrency, getMonthlySummary, autoPullIfNewer } from '@/lib/finance-store';

interface QuickStat {
    label: string;
    value: string;
    sub: string;
    icon: string;
    color: string;
}

export default function FinanceDashboard() {
    const [txCount, setTxCount] = useState(0);
    const [todayStats, setTodayStats] = useState({ deposit: 0, withdrawal: 0 });
    const [monthStats, setMonthStats] = useState({ deposit: 0, withdrawal: 0, net: 0, count: 0 });
    const [lastBalance, setLastBalance] = useState(0);
    const [recentTxs, setRecentTxs] = useState<BankTransaction[]>([]);

    const loadStats = async () => {
        // Auto-pull from cloud first
        const wasUpdated = await autoPullIfNewer();

        const all = await getAllTransactions();
        setTxCount(all.length);

        // Today
        const today = new Date().toISOString().slice(0, 10);
        const todayTxs = all.filter(t => t.date === today);
        setTodayStats({
            deposit: todayTxs.reduce((s, t) => s + t.deposit, 0),
            withdrawal: todayTxs.reduce((s, t) => s + t.withdrawal, 0),
        });

        // This month
        const ym = today.slice(0, 7);
        const summary = await getMonthlySummary(ym);
        setMonthStats({
            deposit: summary.totalDeposit,
            withdrawal: summary.totalWithdrawal,
            net: summary.netAmount,
            count: summary.txCount,
        });

        // Last balance
        const sorted = [...all].sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id));
        if (sorted.length > 0) {
            setLastBalance(sorted[sorted.length - 1].balance);
        }

        // Recent 8
        setRecentTxs(sorted.slice(-8).reverse());
    };

    useEffect(() => {
        loadStats();
    }, []);

    const today = new Date().toISOString().slice(0, 10);
    const ym = today.slice(0, 7);

    const stats: QuickStat[] = [
        { label: '현재 잔액', value: `₩${formatCurrency(lastBalance)}`, sub: '전체 계좌 합계', icon: 'account_balance', color: 'text-yellow-500' },
        { label: '오늘 입출금', value: `+${formatCurrency(todayStats.deposit)} / -${formatCurrency(todayStats.withdrawal)}`, sub: `${today}`, icon: 'today', color: 'text-blue-400' },
        { label: '이번달 입출금', value: `+${formatCurrency(monthStats.deposit)} / -${formatCurrency(monthStats.withdrawal)}`, sub: `${ym} 누적`, icon: 'calendar_month', color: 'text-purple-400' },
        { label: '당월 순이익', value: `₩${formatCurrency(monthStats.net)}`, sub: monthStats.net >= 0 ? '흑자' : '적자', icon: 'monitoring', color: monthStats.net >= 0 ? 'text-emerald-400' : 'text-red-400' },
    ];

    const menuItems = [
        { href: '/groupware/erp/finance/import', label: '계좌내역 임포트', icon: 'upload_file', desc: '신한은행 xlsx 업로드' },
        { href: '/groupware/erp/finance/list', label: '전체 거래내역', icon: 'list_alt', desc: '조회/수정/삭제' },
        { href: '/groupware/erp/finance/daily', label: '자금일보', icon: 'calendar_today', desc: '일일 입출금 조회' },
        { href: '/groupware/erp/finance/reconcile', label: '정산 대조', icon: 'compare_arrows', desc: '카드/네이버페이 매칭' },
        { href: '/groupware/erp/finance/monthly', label: '월마감', icon: 'event_note', desc: '월간 손익 요약' },
        { href: '/groupware/erp/finance/annual', label: '연간 리포트', icon: 'bar_chart', desc: '12개월 추이' },
        { href: '/groupware/erp/finance/budget', label: '예산 계획', icon: 'savings', desc: '예산 대 실적' },
    ];

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">자금 관리</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">등록 거래 {txCount.toLocaleString()}건</p>
                </div>
                <Link href="/groupware/erp/finance/settings"
                    className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                    <span className="material-symbols-outlined text-zinc-500">settings</span>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</span>
                        </div>
                        <div className="text-lg font-black text-white">{s.value}</div>
                        <div className="text-[10px] text-zinc-600 mt-1">{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {menuItems.map((item, i) => (
                    <Link key={i} href={item.href}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:bg-zinc-800/80 hover:border-yellow-500/20 transition-all group">
                        <span className="material-symbols-outlined text-2xl text-zinc-600 group-hover:text-yellow-500 transition-colors">{item.icon}</span>
                        <div className="mt-3">
                            <div className="text-sm font-bold text-white">{item.label}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Transactions */}
            {recentTxs.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                        <h3 className="text-sm font-bold text-white">최근 거래</h3>
                    </div>
                    <div className="divide-y divide-zinc-800/50">
                        {recentTxs.map((tx, idx) => (
                            <div key={idx} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-zinc-600 w-20">{tx.date}</span>
                                    <span className="text-zinc-300 font-bold">{tx.description || tx.summary}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-mono font-bold ${tx.deposit > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                        {tx.deposit > 0 ? `+${formatCurrency(tx.deposit)}` : `-${formatCurrency(tx.withdrawal)}`}
                                    </span>
                                    <span className="font-mono text-zinc-600 w-24 text-right">{formatCurrency(tx.balance)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {txCount === 0 && (
                <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-zinc-700 mb-3 block">inbox</span>
                    <div className="text-sm font-bold text-zinc-500 mb-1">거래 내역이 없습니다</div>
                    <div className="text-xs text-zinc-600 mb-4">신한은행 xlsx 파일을 임포트하여 시작하세요</div>
                    <Link href="/groupware/erp/finance/import"
                        className="inline-flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-black rounded-xl transition-all">
                        <span className="material-symbols-outlined text-[16px]">upload_file</span> 임포트 시작
                    </Link>
                </div>
            )}
        </div>
    );
}
