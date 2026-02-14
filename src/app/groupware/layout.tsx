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
        { name: '── CEO 전용 ──', href: '', icon: '', divider: true, adminOnly: true },
        { name: 'CEO Executive Room', href: '/admin/ceo?key=edsence_ceo', icon: 'shield_person', adminOnly: true },
        { name: '── 매출 관리 ──', href: '', icon: '', divider: true },
        { name: '판매 입력', href: '/groupware/erp/input', icon: 'edit_note' },
        { name: '판매 조회', href: '/groupware/erp/list', icon: 'receipt_long' },
        { name: '재고 현황', href: '/groupware/erp/inventory', icon: 'inventory_2' },
        { name: '매출 현황', href: '/groupware/erp/status', icon: 'calendar_month', adminOnly: true },
        { name: '── 자금 관리 ──', href: '', icon: '', divider: true, adminOnly: true },
        { name: '계좌내역 임포트', href: '/groupware/erp/finance/import', icon: 'upload_file', adminOnly: true },
        { name: '자금 현황', href: '/groupware/erp/finance', icon: 'monitoring', adminOnly: true },
        { name: '자금일보', href: '/groupware/erp/finance/daily', icon: 'calendar_today', adminOnly: true },
        { name: '정산 대조', href: '/groupware/erp/finance/reconcile', icon: 'compare_arrows', adminOnly: true },
        { name: '월마감', href: '/groupware/erp/finance/monthly', icon: 'summarize', adminOnly: true },
        { name: '연간 리포트', href: '/groupware/erp/finance/annual', icon: 'bar_chart', adminOnly: true },
        { name: '예산 계획', href: '/groupware/erp/finance/budget', icon: 'savings', adminOnly: true },
        { name: '설정', href: '/groupware/erp/finance/settings', icon: 'settings', adminOnly: true },
    ].filter(item => !item.adminOnly || role === 'admin');

    if (role === 'admin') {
        menuItems.push({ name: '직원 관리 (Admin)', href: '/groupware/admin/employees', icon: 'admin_panel_settings' });
    }

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Menu Content */}
                    <aside className="absolute inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-2xl">
                        <div className="p-6 flex items-center justify-between border-b border-zinc-800">
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                                    GROUPWARE
                                </h1>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Mobile Menu</p>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto pb-10 scrollbar-hide">
                            {menuItems.map((item, idx) => {
                                if ((item as any).divider) {
                                    return (
                                        <div key={idx} className="pt-4 pb-1 px-4">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{item.name.replace(/─/g, '').trim()}</span>
                                        </div>
                                    );
                                }
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={idx}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
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

                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
                            <div className="flex items-center gap-3 px-2 py-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                    {role === 'admin' ? 'ADM' : 'EMP'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">logout</span>
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 hidden md:flex flex-col">
                <div className="p-6">
                    <Link href="/photo" className="block hover:opacity-80 transition-opacity">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                            YEONHEE GROUPWARE
                        </h1>
                        <p className="text-xs text-zinc-500 mt-1">직원 전용 인트라넷</p>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                    {menuItems.map((item, idx) => {
                        if ((item as any).divider) {
                            return (
                                <div key={idx} className="pt-4 pb-1 px-4">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{item.name.replace(/─/g, '').trim()}</span>
                                </div>
                            );
                        }
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
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
            <main className="flex-1 overflow-auto flex flex-col">
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 backdrop-blur md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-[28px]">menu</span>
                    </button>
                    <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">YEONHEE</span>
                    <div className="w-10"></div> {/* Symmetry spacer */}
                </header>
                <div className="p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
