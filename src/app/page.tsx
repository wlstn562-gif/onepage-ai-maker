'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HubPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Simple client-side check for auth token or user role
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        }
        const token = getCookie('auth-token');
        const role = getCookie('user-role');

        if (token || role) {
            setIsLoggedIn(true);

            // Get User Name
            const userNameCookie = getCookie('user-name');
            if (userNameCookie) {
                setUserName(decodeURIComponent(userNameCookie));
            } else {
                const userInfoStr = getCookie('user-info');
                if (userInfoStr) {
                    try {
                        const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
                        if (userInfo.name) setUserName(userInfo.name);
                    } catch (e) { console.error(e); }
                }
            }
        }
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 font-sans text-white">
            <header className="mb-12 text-center relative w-full max-w-6xl">
                <div className="absolute right-0 top-0 hidden sm:block">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-zinc-400">환영합니다, {userName}님</span>
                            <Link href="/groupware" className="text-xs font-bold text-black hover:text-zinc-800 transition-colors flex items-center gap-1 bg-[#f6ab1a] px-3 py-1.5 rounded-full">
                                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                                그룹웨어
                            </Link>
                        </div>
                    ) : (
                        <Link href="/login" className="text-xs font-medium text-zinc-500 hover:text-[#f6ab1a] transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">lock</span>
                            직원 로그인
                        </Link>
                    )}
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                    ONE PAGE AI MAKER
                </h1>
                <p className="mt-4 text-zinc-400">
                    크리에이터를 위한 올인원 AI 솔루션
                </p>
            </header>

            <main className="grid w-full max-w-6xl gap-6 sm:grid-cols-3">
                {/* Card 1: Yeonhui Studio (Photo) */}
                <Link
                    href="/photo"
                    className="group relative flex h-80 flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900 p-6 transition-all hover:scale-[1.02] hover:bg-zinc-800 hover:ring-2 hover:ring-[#f6ab1a]/50"
                >
                    <div className="z-10">
                        <h2 className="text-2xl font-bold text-white group-hover:text-[#f6ab1a] transition-colors">연희스튜디오</h2>
                        <p className="mt-2 text-sm text-zinc-400">AI 증명/여권 사진 생성</p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-full opacity-10 transition-opacity group-hover:opacity-20">
                        <div className="h-full w-full bg-gradient-to-br from-[#f6ab1a] to-transparent" />
                    </div>
                    <div className="z-10 mt-auto flex items-center text-sm font-medium text-zinc-300 group-hover:text-[#f6ab1a] transition-colors">
                        바로가기 <span className="ml-2">→</span>
                    </div>
                </Link>

                {/* Card 2: Ddalkak Video */}
                <Link
                    href="/video"
                    className="group relative flex h-80 flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900 p-6 transition-all hover:scale-[1.02] hover:bg-zinc-800 hover:ring-2 hover:ring-indigo-500/50"
                >
                    <div className="z-10">
                        <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400">딸깍영상</h2>
                        <p className="mt-2 text-sm text-zinc-400">쇼츠/릴스 자동 제작 원클릭</p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-full opacity-10 transition-opacity group-hover:opacity-20">
                        <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-transparent" />
                    </div>
                    <div className="z-10 mt-auto flex items-center text-sm font-medium text-zinc-300 group-hover:text-indigo-400">
                        바로가기 <span className="ml-2">→</span>
                    </div>
                </Link>

                {/* Card 3: Team Console (Pivot) */}
                <Link
                    href="/studio"
                    className="group relative flex h-80 flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900 p-6 transition-all hover:scale-[1.02] hover:bg-zinc-800 hover:ring-2 hover:ring-rose-500/50"
                >
                    <div className="z-10">
                        <h2 className="text-2xl font-bold text-white group-hover:text-rose-400">Team Console</h2>
                        <p className="mt-2 text-sm text-zinc-400">8개 전문 AI팀 협업 스튜디오</p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-full opacity-10 transition-opacity group-hover:opacity-20">
                        <div className="h-full w-full bg-gradient-to-br from-rose-500 to-transparent" />
                    </div>
                    <div className="z-10 mt-auto flex items-center text-sm font-medium text-zinc-300 group-hover:text-rose-400">
                        입장하기 <span className="ml-2">→</span>
                    </div>
                </Link>
            </main>

            <footer className="mt-16 text-center text-xs text-zinc-600">
                © 2026 Onepage AI Maker. All rights reserved.
            </footer>
        </div>
    );
}
