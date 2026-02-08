'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DemoSection from '@/components/DemoSection';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        }
        const token = getCookie('auth-token');
        setIsLoggedIn(!!token);
    }, []);

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-[#f8b84e]/10">
            {/* Staff Login / Internal Hub Link Overlay */}
            <div className="absolute top-4 right-4 z-50">
                {isLoggedIn ? (
                    <Link href="/hub" className="text-xs font-bold text-white hover:text-zinc-100 transition-colors flex items-center gap-1 bg-black/80 hover:bg-black px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                        <span className="material-symbols-outlined text-[16px]">settings</span>
                        직원 전용 (Hub)
                    </Link>
                ) : (
                    <Link href="/login" className="text-xs font-bold text-zinc-600 hover:text-black transition-colors flex items-center gap-1 bg-white/50 hover:bg-white px-3 py-1.5 rounded-full backdrop-blur-md">
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                        직원 로그인
                    </Link>
                )}
            </div>

            <div className="layout-container flex h-full grow flex-col bg-white/50 backdrop-blur-sm">
                <Header />
                <main className="flex-1 px-4 md:px-20 lg:px-40 pb-20">
                    <Hero />
                    <Features />
                    <DemoSection />
                    <CallToAction />
                </main>
                <Footer />
            </div>
        </div>
    );
}
