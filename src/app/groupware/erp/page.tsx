'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getAllSales, formatCurrency, BRANCHES } from '@/lib/erp-store';

export default function ErpDashboard() {
    const [todayTotal, setTodayTotal] = useState(0);
    const [monthTotal, setMonthTotal] = useState(0);
    const [recentCount, setRecentCount] = useState(0);

    useEffect(() => {
        const all = getAllSales();
        const today = new Date().toISOString().slice(0, 10);
        const yearMonth = today.slice(0, 7);

        setTodayTotal(all.filter(r => r.date === today).reduce((s, r) => s + r.totalAmount, 0));
        setMonthTotal(all.filter(r => r.date.startsWith(yearMonth)).reduce((s, r) => s + r.totalAmount, 0));
        setRecentCount(all.length);
    }, []);

    const quickLinks = [
        { name: '판매 입력', href: '/groupware/erp/input', icon: 'edit_note', color: 'from-blue-500 to-blue-600', desc: '오늘의 매출 전표 작성' },
        { name: '판매 조회', href: '/groupware/erp/list', icon: 'receipt_long', color: 'from-emerald-500 to-emerald-600', desc: '일자별 전표 리스트 확인' },
        { name: '매출 현황', href: '/groupware/erp/status', icon: 'calendar_month', color: 'from-amber-500 to-amber-600', desc: '월간 달력 매출 현황판' },
        { name: '재고 현황', href: '/groupware/erp/inventory', icon: 'inventory_2', color: 'from-orange-500 to-orange-600', desc: '실시간 소모품 및 상품 재고 관리' },
        { name: 'AI 자금일보', href: '/groupware/erp/bank-parser', icon: 'smart_toy', color: 'from-purple-500 to-purple-600', desc: '은행 문자 자동 분류' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">매출 관리 (ERP)</h2>
                <p className="text-sm text-zinc-500 mt-1">연희스튜디오 매출 관리 시스템</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">today</span>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">오늘 매출</p>
                            <p className="text-xl font-bold text-white font-mono">{formatCurrency(todayTotal)}원</p>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">이번 달 매출</p>
                            <p className="text-xl font-bold text-white font-mono">{formatCurrency(monthTotal)}원</p>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-500/10 rounded-lg text-green-500">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">전체 전표 수</p>
                            <p className="text-xl font-bold text-white">{recentCount}건</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-4">
                {quickLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="group flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-all"
                    >
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${link.color} text-white shadow-lg`}>
                            <span className="material-symbols-outlined text-[28px]">{link.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">{link.name}</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">{link.desc}</p>
                        </div>
                        <span className="ml-auto text-zinc-600 group-hover:text-zinc-400 transition-colors material-symbols-outlined">arrow_forward</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
