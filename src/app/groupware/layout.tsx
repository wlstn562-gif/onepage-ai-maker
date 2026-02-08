'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function GroupwareLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const [role, setRole] = useState('employee');
    const [userName, setUserName] = useState('직원');

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
            setUserName(decodeURIComponent(userNameCookie));
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
    }, []);


    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    const menuItems = [
        { name: '대시보드', href: '/groupware', icon: 'dashboard' },
        { name: '내 연차 관리', href: '/groupware/leave', icon: 'event_available' },
    ];

    if (role === 'admin') {
        menuItems.push({ name: '직원 관리 (Admin)', href: '/groupware/admin/employees', icon: 'admin_panel_settings' });
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 hidden md:flex flex-col">
                <div className="p-6">
                    <Link href="/photo" className="block hover:opacity-80 transition-opacity">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                            YEONHEE GROUPWARE
                        </h1>
                        <p className="text-xs text-zinc-500 mt-1">직원 전용 인트라넷</p>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-yellow-500/10 text-yellow-500'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
                            {role === 'admin' ? 'ADM' : 'EMP'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{userName}</p>
                            <p className="text-xs text-zinc-500 truncate">{role === 'admin' ? '시스템 관리' : '연희스튜디오'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                            title="로그아웃"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 backdrop-blur md:hidden">
                    <span className="text-lg font-bold">Groupware</span>
                    {/* Mobile menu button could go here */}
                </header>
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
