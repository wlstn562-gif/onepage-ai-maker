'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    }
    const token = getCookie('auth-token');
    const role = getCookie('user-role');

    if (token || role) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <header className="flex items-center justify-between px-6 md:px-20 py-6">
      <Link href="/photo" className="flex items-center gap-3 cursor-pointer">
        <img
          src="/logo/1_BLACK.png?v=2"
          alt="Yeonhui Studio"
          className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform"
        />
      </Link>

      <div className="hidden md:flex items-center gap-2 bg-white/30 backdrop-blur-md px-2 py-2 rounded-full border border-white/40 shadow-sm">
        <Link className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#">홈</Link>
        <Link className="text-sm font-black text-black bg-white px-6 py-2 rounded-full shadow-sm" href="#branches">지점 예약</Link>
        <Link className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#demo">직접 해보기</Link>
        <Link className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#service">가격안내</Link>
      </div>

      {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.reload();
            }}
            className="text-sm font-bold text-[#1A1100]/50 hover:text-red-600 transition-colors px-2"
          >
            로그아웃
          </button>
          <Link href="/groupware" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-2xl h-12 px-6 bg-[#B48A00] text-white text-sm font-bold shadow-[0_4px_0_0_#8C6C00] active:shadow-none active:translate-y-1 transition-all">
            <span>그룹웨어</span>
          </Link>
        </div>
      ) : (
        <Link href="/login" className="flex min-w-[100px] items-center justify-center rounded-2xl h-12 px-6 bg-gradient-to-br from-[#FFB200] to-[#FF8A00] text-white text-sm font-black shadow-[0_6px_0_0_#E67E00] hover:brightness-110 transition-all active:translate-y-1 active:shadow-none">
          로그인
        </Link>
      )}
    </header>
  );
};

export default Header;