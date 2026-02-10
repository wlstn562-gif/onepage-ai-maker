"use client";
import React from 'react';
import PassportAnalyzer from './PassportAnalyzer';

const DemoSection: React.FC = () => {
  return (
    <div id="demo" className="mt-20 py-24 bg-[#fffedb] rounded-[60px] mx-4 border-8 border-white shadow-inner">
      <div className="flex flex-col items-center mb-16 px-4 text-center">
        <h2 className="text-5xl md:text-6xl font-black text-black leading-tight mb-4 tracking-tighter relative inline-block">
          집에서 3,900원으로 먼저 해보기
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-2 bg-black rounded-full"></div>
        </h2>
        <p className="text-zinc-500 font-bold text-lg max-w-lg mt-8">
          내 손안의 작은 스튜디오.<br />
          AI가 선사하는 완벽한 결과물을 경험해보세요.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* The functional analyzer component in Mockup Style */}
        <PassportAnalyzer />

        <div className="mt-16 text-center text-[12px] text-zinc-400 font-bold uppercase tracking-widest">
          Yeonhui AI Studio • Professional Standards • 2026
        </div>
      </div>
    </div>
  );
};

export default DemoSection;