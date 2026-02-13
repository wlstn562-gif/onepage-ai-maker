'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllInventory, getAllInventoryLogs } from '@/lib/inventory-store';

interface Notice {
    id: string;
    title: string;
    date: string;
    tag: string;
}

interface Event {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
}

export default function GroupwareDashboard() {
    const [role, setRole] = useState('employee');
    const [userName, setUserName] = useState('직원');
    const [notices, setNotices] = useState<Notice[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);

    // Employee stats (could be fetched from /api/employee/me)
    const [leaveStats, setLeaveStats] = useState({ total: 0, used: 0, remaining: 0 });

    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        }
        const r = getCookie('user-role');
        if (r) setRole(r);

        const userNameCookie = getCookie('user-name');
        if (userNameCookie) {
            try {
                let decodedName = userNameCookie;
                for (let i = 0; i < 3; i++) {
                    if (decodedName.includes('%')) {
                        decodedName = decodeURIComponent(decodedName);
                    } else {
                        break;
                    }
                }
                setUserName(decodedName);
            } catch (e) {
                console.error("Failed to decode user-name", e);
                setUserName(userNameCookie);
            }
        } else {
            const userInfoStr = getCookie('user-info');
            if (userInfoStr) {
                try {
                    const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
                    if (userInfo.name) setUserName(userInfo.name);
                } catch (e) {
                    console.error("Failed to parse user-info", e);
                }
            } else if (r === 'admin') {
                setUserName('관리자');
            }
        }

        // Fetch Data
        fetch('/api/board/notices').then(res => res.json()).then(setNotices);
        fetch('/api/board/events').then(res => res.json()).then(setEvents);

        // Fetch Inventory Data
        const allItems = getAllInventory();
        const low = allItems.filter(i => i.currentStock <= i.minRequired);
        setInventoryItems(allItems);
        setLowStockItems(low.slice(0, 4));
        setRecentLogs(getAllInventoryLogs().slice().reverse().slice(0, 3));

        if (r !== 'admin') {
            fetch('/api/employee/me').then(res => res.json()).then(data => {
                const total = Number(data.totalLeave || 0);
                const used = Number(data.usedLeave || 0);
                setLeaveStats({ total, used, remaining: total - used });
            });
        }
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">환영합니다, {userName}님 👋</h2>
                <p className="mt-2 text-zinc-400">오늘도 즐거운 하루 되세요!</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Stats Cards - Common */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">mail</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">읽지 않은 메일</p>
                            <h3 className="text-2xl font-bold text-white">3</h3>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                            <span className="material-symbols-outlined">calendar_today</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">오늘의 일정</p>
                            <h3 className="text-2xl font-bold text-white">{events.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                            <span className="material-symbols-outlined">campaign</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">{role === 'admin' ? '전체 공지' : '사내 공지'}</p>
                            <h3 className="text-2xl font-bold text-white">{notices.length > 0 ? 'NEW' : '0'}</h3>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <span className="material-symbols-outlined">beach_access</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">{role === 'admin' ? '전체 직원' : '잔여 연차'}</p>
                            <h3 className="text-2xl font-bold text-white">{role === 'admin' ? '4' : leaveStats.remaining}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widgets Section */}
            {role === 'admin' ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Notices Widget (Admin View) */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 relative group">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">📢 최신 공지사항 (Admin)</h3>
                            <Link href="/groupware/admin/board" className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded transition-colors">
                                관리하기
                            </Link>
                        </div>
                        <ul className="space-y-4">
                            {notices.slice(0, 3).map((notice, i) => (
                                <li key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${notice.tag === '필독' ? 'bg-red-500/10 text-red-500' :
                                            notice.tag === '중요' ? 'bg-amber-500/10 text-amber-500' :
                                                'bg-zinc-700/30 text-zinc-400'
                                            }`}>{notice.tag}</span>
                                        <span className="text-sm text-zinc-200">{notice.title}</span>
                                    </div>
                                    <span className="text-xs text-zinc-500">{notice.date}</span>
                                </li>
                            ))}
                            {notices.length === 0 && <li className="text-sm text-zinc-500 text-center py-2">등록된 공지사항이 없습니다.</li>}
                        </ul>
                    </div>

                    {/* Events Widget (Admin View) */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 relative group">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">🗓️ 이번 주 일정 (Admin)</h3>
                            <Link href="/groupware/admin/board" className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded transition-colors">
                                관리하기
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {events.slice(0, 2).map((event, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-12 text-center">
                                        <div className="text-xs text-zinc-500 uppercase">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div className="text-lg font-bold text-white">{new Date(event.date).getDate()}</div>
                                    </div>
                                    <div className="flex-1 py-1">
                                        <div className={`h-full border-l-2 pl-4 ${event.type === 'meeting' ? 'border-blue-500' : 'border-green-500'}`}>
                                            <p className="text-sm font-medium text-zinc-200">{event.title}</p>
                                            <p className="text-xs text-zinc-500">{event.startTime} - {event.endTime}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && <p className="text-sm text-zinc-500 text-center py-2">예정된 일정이 없습니다.</p>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Inventory Status Widget (Employee View) */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 relative group">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                                <h3 className="text-lg font-semibold text-white">재고 현황 요약</h3>
                            </div>
                            <Link href="/groupware/erp/inventory" className="text-xs text-zinc-400 hover:text-yellow-500 transition-colors flex items-center gap-1 group/link">
                                상세 보기
                                <span className="material-symbols-outlined text-[14px] group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Low Stock Items Summary */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">재고 부족 (Low Stock)</p>
                            <div className="grid grid-cols-1 gap-2">
                                {lowStockItems.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-800/20 text-center text-zinc-500 text-sm italic">현재 부족한 재고가 없습니다.</div>
                                ) : (
                                    lowStockItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-red-500/10 bg-red-500/5">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                                <p className="text-[10px] text-zinc-500">{item.branch} • {item.itemCode}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-red-500">{item.currentStock} <span className="text-[10px] font-normal text-zinc-600">{item.unit}</span></p>
                                                <p className="text-[10px] text-zinc-500">기준: {item.minRequired}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-800/50">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">history</span> 최근 입출금 내역
                            </p>
                            <div className="space-y-2">
                                {recentLogs.length === 0 ? (
                                    <p className="text-xs text-zinc-600 italic pl-1">최근 기록이 없습니다.</p>
                                ) : (
                                    recentLogs.map((log) => {
                                        const item = inventoryItems.find(i => i.id === log.itemId);
                                        return (
                                            <div key={log.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-zinc-800/30 last:border-0">
                                                <span className={`material-symbols-outlined text-[14px] ${log.type === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {log.type === 'in' ? 'south_west' : 'north_east'}
                                                </span>
                                                <span className="text-zinc-300 truncate flex-1">{item?.name || '알 수 없는 품목'}</span>
                                                <span className={log.type === 'in' ? 'text-emerald-500' : 'text-red-500'}>
                                                    {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                                                </span>
                                                <span className="text-zinc-600 text-[10px] ml-2">{log.staffName}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Simple Quick Action Widget */}
                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-zinc-500">construction</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">게시판 기능 개편 중</h3>
                            <p className="text-zinc-400 text-sm max-w-xs">
                                사내 게시판과 일정 기능은 더 나은 서비스로 찾아뵙겠습니다.
                            </p>
                        </div>
                        <Link href="/groupware/erp/inventory" className="p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors group">
                            <div className="flex items-center justify-between font-bold">
                                <div className="text-white">
                                    <p className="text-xs text-yellow-500 mb-1">빠른 업무</p>
                                    <p className="text-lg">재고 현황 바로가기</p>
                                </div>
                                <span className="material-symbols-outlined text-4xl text-yellow-500 group-hover:translate-x-2 transition-transform">inventory_2</span>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
