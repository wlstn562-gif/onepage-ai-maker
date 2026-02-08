'use client';

import { useState, useEffect, useRef } from 'react';

interface LeaveHistory {
    id: string;
    date: string;
    type: string;
    days: number;
    reason: string;
    createdAt: string;
}

interface Employee {
    id: string;
    name: string;
    totalLeave: number;
    usedLeave: number;
    leaveHistory?: LeaveHistory[];
}

export default function LeaveManagementPage() {
    const [me, setMe] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Date State
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [day, setDay] = useState(new Date().getDate().toString().padStart(2, '0'));

    const [type, setType] = useState('annual');
    const [reason, setReason] = useState('');

    // Refs for focus management
    const monthRef = useRef<HTMLInputElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);

    const fetchMe = async () => {
        try {
            const res = await fetch('/api/employee/me');
            if (res.ok) {
                const data = await res.json();
                setMe(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchMe();
    }, []);

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.length <= 4) setYear(val);
        if (val.length === 4) monthRef.current?.focus();
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.length <= 2) setMonth(val);
        if (val.length === 2) dayRef.current?.focus();
    };

    // Auto-pad month on blur
    const handleMonthBlur = () => {
        if (month.length === 1) setMonth(month.padStart(2, '0'));
    };

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.length <= 2) setDay(val);
    };

    const handleDayBlur = () => {
        if (day.length === 1) setDay(day.padStart(2, '0'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Basic Validation
        if (!year || !month || !day) {
            alert('날짜를 정확히 입력해주세요.');
            return;
        }

        if (!confirm(`${dateStr}에 연차를 사용하시겠습니까?`)) return;

        const days = type === 'annual' ? 1 : 0.5;

        try {
            const res = await fetch('/api/employee/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    type,
                    days,
                    reason
                })
            });

            if (res.ok) {
                alert('연차 사용이 등록되었습니다.');
                setReason('');
                fetchMe();
            } else {
                alert('등록 실패');
            }
        } catch (e) {
            alert('오류 발생');
        }
    }

    const handleDelete = async (id: string, date: string) => {
        if (!confirm(`${date} 연차 기록을 삭제(취소)하시겠습니까?\n삭제하면 연차가 다시 복구됩니다.`)) return;

        try {
            const res = await fetch(`/api/employee/leave?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('삭제되었습니다.');
                fetchMe();
            } else {
                alert('삭제 실패');
            }
        } catch (e) {
            alert('오류 발생');
        }
    }

    if (isLoading) return <div className="p-8 text-zinc-500">로딩 중...</div>;
    if (!me) return <div className="p-8 text-zinc-500">정보를 불러올 수 없습니다.</div>;

    const remaining = me.totalLeave - me.usedLeave;

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">내 연차 관리</h2>
                <p className="text-zinc-400">안녕하세요, {me.name}님. 연차 현황을 확인하고 사용을 신청할 수 있습니다.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center justify-center gap-2">
                    <span className="text-zinc-500 text-sm font-medium">총 발생 연차</span>
                    <span className="text-4xl font-black text-white">{me.totalLeave}</span>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center justify-center gap-2">
                    <span className="text-zinc-500 text-sm font-medium">사용 연차</span>
                    <span className="text-4xl font-black text-rose-400">{me.usedLeave}</span>
                </div>
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500/5 blur-xl"></div>
                    <span className="text-yellow-500 text-sm font-medium relative">잔여 연차</span>
                    <span className="text-4xl font-black text-yellow-500 relative">{remaining}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Apply Form */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">연차 사용 등록</h3>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">날짜</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={year}
                                            onChange={handleYearChange}
                                            placeholder="YYYY"
                                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-3 text-center text-white focus:border-yellow-500 focus:outline-none transition-colors"
                                            maxLength={4}
                                        />
                                        <span className="absolute right-2 top-3 text-xs text-zinc-600">년</span>
                                    </div>
                                    <div className="relative w-20">
                                        <input
                                            ref={monthRef}
                                            type="text"
                                            value={month}
                                            onChange={handleMonthChange}
                                            onBlur={handleMonthBlur}
                                            placeholder="MM"
                                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-3 text-center text-white focus:border-yellow-500 focus:outline-none transition-colors"
                                            maxLength={2}
                                        />
                                        <span className="absolute right-2 top-3 text-xs text-zinc-600">월</span>
                                    </div>
                                    <div className="relative w-20">
                                        <input
                                            ref={dayRef}
                                            type="text"
                                            value={day}
                                            onChange={handleDayChange}
                                            onBlur={handleDayBlur}
                                            placeholder="DD"
                                            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-3 text-center text-white focus:border-yellow-500 focus:outline-none transition-colors"
                                            maxLength={2}
                                        />
                                        <span className="absolute right-2 top-3 text-xs text-zinc-600">일</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">유형</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="annual"
                                            checked={type === 'annual'}
                                            onChange={(e) => setType(e.target.value)}
                                            className="peer sr-only"
                                        />
                                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 py-3 text-center text-sm font-medium text-zinc-400 peer-checked:border-yellow-500 peer-checked:text-yellow-500 peer-checked:bg-yellow-500/10 transition-all">
                                            연차 (1일)
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="half"
                                            checked={type === 'half'}
                                            onChange={(e) => setType(e.target.value)}
                                            className="peer sr-only"
                                        />
                                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 py-3 text-center text-sm font-medium text-zinc-400 peer-checked:border-yellow-500 peer-checked:text-yellow-500 peer-checked:bg-yellow-500/10 transition-all">
                                            반차 (0.5일)
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">사유 (선택)</label>
                                <input
                                    name="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="예: 개인 사정"
                                    className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3 text-white focus:border-yellow-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full rounded-xl bg-yellow-500 py-4 text-sm font-bold text-black hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20"
                            >
                                사용 등록하기
                            </button>
                        </form>
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">사용 내역</h3>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 min-h-[400px]">
                        {!me.leaveHistory || me.leaveHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                                <span className="material-symbols-outlined text-4xl">history_toggle_off</span>
                                <p className="text-sm">사용 내역이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {me.leaveHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800 group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.days >= 1
                                                        ? 'bg-rose-500/10 text-rose-500'
                                                        : 'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {item.days >= 1 ? '연차' : '반차'}
                                                </span>
                                                <span className="text-white font-medium">{item.date}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500">{item.reason || '사유 없음'}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-rose-400">-{item.days}</span>
                                            <button
                                                onClick={() => handleDelete(item.id, item.date)}
                                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity p-1"
                                                title="삭제(사용 취소)"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
