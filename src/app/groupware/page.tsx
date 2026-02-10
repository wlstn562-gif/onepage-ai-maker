'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
                // Employee View: System Maintenance Placeholder
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                        <span className="material-symbols-outlined text-3xl text-zinc-500">construction</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">게시판 시스템 개편 중</h3>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto">
                        더 나은 서비스를 위해 사내 게시판과 일정 기능을 개선하고 있습니다.<br />
                        빠른 시일 내에 오픈할 예정이니 조금만 기다려주세요! 🚧
                    </p>
                </div>
            )}
        </div>
    );
}
