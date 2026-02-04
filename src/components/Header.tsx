import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 md:px-20 py-6">
      <div className="flex items-center gap-3 cursor-pointer">
        <img
          src="/logo/3.png"
          alt="연희스튜디오"
          className="h-12 w-auto object-contain hover:scale-105 transition-transform"
        />
      </div>

      <div className="hidden md:flex items-center gap-2 bg-white/30 backdrop-blur-md px-2 py-2 rounded-full border border-white/40 shadow-sm">
        <a className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#">홈</a>
        <a className="text-sm font-black text-black bg-white px-6 py-2 rounded-full shadow-sm" href="#features">AI 여권사진</a>
        <a className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#demo">데모보기</a>
        <a className="text-sm font-bold text-black/70 hover:text-black px-6 py-2 rounded-full transition-colors" href="#service">가격안내</a>
      </div>

      <button className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-2xl h-12 px-6 bg-black text-white text-sm font-bold shadow-3d-black active:shadow-none active:translate-y-1 transition-all">
        <span>로그인</span>
      </button>
    </header>
  );
};

export default Header;