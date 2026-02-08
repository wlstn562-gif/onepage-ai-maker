'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notice {
    id: string;
    title: string;
    date: string;
    tag: string;
    content: string;
}

interface Event {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
}

export default function AdminBoardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'notice' | 'event'>('notice');
    const [notices, setNotices] = useState<Notice[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [noticeForm, setNoticeForm] = useState({ title: '', date: '', tag: '일반', content: '' });
    const [eventForm, setEventForm] = useState({ title: '', date: '', startTime: '', endTime: '', type: 'meeting' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [nRes, eRes] = await Promise.all([
                fetch('/api/board/notices'),
                fetch('/api/board/events')
            ]);
            setNotices(await nRes.json());
            setEvents(await eRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNoticeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/board/notices', {
            method: 'POST',
            body: JSON.stringify(noticeForm)
        });
        setNoticeForm({ title: '', date: '', tag: '일반', content: '' });
        fetchData();
    };

    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/board/events', {
            method: 'POST',
            body: JSON.stringify(eventForm)
        });
        setEventForm({ title: '', date: '', startTime: '', endTime: '', type: 'meeting' });
        fetchData();
    };

    const handleDelete = async (type: 'notices' | 'events', id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        await fetch(`/api/board/${type}?id=${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <div className="space-y-8 text-white max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">게시판/일정 관리</h1>
                <div className="flex gap-2 text-sm bg-zinc-900 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('notice')}
                        className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'notice' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        공지사항
                    </button>
                    <button
                        onClick={() => setActiveTab('event')}
                        className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'event' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        일정
                    </button>
                </div>
            </div>

            {activeTab === 'notice' ? (
                <div className="space-y-8">
                    {/* Notice Form */}
                    <section className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h2 className="text-lg font-bold mb-4">공지사항 등록</h2>
                        <form onSubmit={handleNoticeSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="제목"
                                    className="col-span-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                                    value={noticeForm.title}
                                    onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                                    value={noticeForm.date}
                                    onChange={e => setNoticeForm({ ...noticeForm, date: e.target.value })}
                                    required
                                />
                                <select
                                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                                    value={noticeForm.tag}
                                    onChange={e => setNoticeForm({ ...noticeForm, tag: e.target.value })}
                                >
                                    <option value="일반">일반</option>
                                    <option value="중요">중요</option>
                                    <option value="필독">필독</option>
                                </select>
                            </div>
                            <textarea
                                placeholder="내용"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 h-24"
                                value={noticeForm.content}
                                onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })}
                                required
                            />
                            <div className="flex justify-end">
                                <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold transition-colors">
                                    등록하기
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Notice List */}
                    <section className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h2 className="text-lg font-bold mb-4">등록된 공지사항</h2>
                        <div className="space-y-2">
                            {notices.map(notice => (
                                <div key={notice.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-0.5 rounded ${notice.tag === '필독' ? 'bg-red-500/20 text-red-500' :
                                                notice.tag === '중요' ? 'bg-amber-500/20 text-amber-500' :
                                                    'bg-zinc-700/50 text-zinc-400'
                                            }`}>
                                            {notice.tag}
                                        </span>
                                        <span className="text-sm font-medium">{notice.title}</span>
                                        <span className="text-xs text-zinc-500">{notice.date}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete('notices', notice.id)}
                                        className="text-zinc-500 hover:text-red-500"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            ))}
                            {notices.length === 0 && <p className="text-sm text-zinc-500 py-4 text-center">등록된 공지사항이 없습니다.</p>}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Event Form */}
                    <section className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h2 className="text-lg font-bold mb-4">일정 등록</h2>
                        <form onSubmit={handleEventSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="일정 제목"
                                    className="col-span-2 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                                    value={eventForm.title}
                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                                    value={eventForm.date}
                                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                                    required
                                />
                                <select
                                    className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                                    value={eventForm.type}
                                    onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                                >
                                    <option value="meeting">회의</option>
                                    <option value="event">행사</option>
                                    <option value="vacation">휴가</option>
                                </select>
                                <div className="flex items-center gap-2 col-span-2">
                                    <input
                                        type="time"
                                        className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 flex-1"
                                        value={eventForm.startTime}
                                        onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })}
                                        required
                                    />
                                    <span className="text-zinc-500">~</span>
                                    <input
                                        type="time"
                                        className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 flex-1"
                                        value={eventForm.endTime}
                                        onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold transition-colors">
                                    등록하기
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Event List */}
                    <section className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h2 className="text-lg font-bold mb-4">등록된 일정</h2>
                        <div className="space-y-2">
                            {events.map(event => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-0.5 rounded ${event.type === 'meeting' ? 'bg-blue-500/20 text-blue-500' :
                                                event.type === 'event' ? 'bg-purple-500/20 text-purple-500' :
                                                    'bg-green-500/20 text-green-500'
                                            }`}>
                                            {event.type.toUpperCase()}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{event.title}</span>
                                            <span className="text-xs text-zinc-500">{event.date} {event.startTime} - {event.endTime}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete('events', event.id)}
                                        className="text-zinc-500 hover:text-red-500"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            ))}
                            {events.length === 0 && <p className="text-sm text-zinc-500 py-4 text-center">등록된 일정이 없습니다.</p>}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
