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
        <Link className="text-sm font-black text-black bg-white px-6 py-2 rounded-full shadow-sm" href="#features">모바일 여권사진</Link>
        <Link className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#demo">데모보기</Link>
        <Link className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#service">가격안내</Link>
      </div>

      {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.reload();
            }}
            className="text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors px-2"
          >
            로그아웃
          </button>
          <Link href="/groupware" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-2xl h-12 px-6 bg-yellow-400 text-black text-sm font-bold shadow-3d-yellow active:shadow-none active:translate-y-1 transition-all border-2 border-black">
            <span>그룹웨어</span>
          </Link>
        </div>
      ) : (
        <Link href="/login" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-2xl h-12 px-6 bg-black text-white text-sm font-bold shadow-3d-black active:shadow-none active:translate-y-1 transition-all">
          <span>로그인</span>
        </Link>
      )}
    </header>
  );
};

export default Header;