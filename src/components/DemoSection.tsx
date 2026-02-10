"use client";
import React from 'react';
import PassportAnalyzer from './PassportAnalyzer';

const DemoSection: React.FC = () => {
  return (
    <div id="demo" className="mt-20 py-24 bg-[#fffedb] rounded-[60px] mx-4 border-8 border-white shadow-inner">
      <div className="flex flex-col items-center mb-16 px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-black leading-tight mb-4 tracking-tighter relative inline-block">
          집에서 <span className="relative inline-block px-2">
            <span className="relative z-10">3,900원</span>
            <div className="absolute -bottom-1 left-0 w-full h-4 bg-[#f6ab1a]/50 -rotate-1 z-0 rounded-sm"></div>
          </span>으로 먼저 해보기
        </h2>
        {/* Guarantee Badge */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-3xl shadow-xl border-2 border-[#f6ab1a]/20">
            <span className="material-symbols-outlined text-[#f6ab1a] text-2xl font-black">verified_user</span>
            <span className="text-black font-black text-lg tracking-tight">여권 반려 시 50% 할인 촬영 제공</span>
          </div>
          <p className="text-zinc-400 text-sm font-bold">
            * 본 파일로 반려 시, 캡처본(반려사유) 확인 후 <br className="md:hidden" /> 전 지점 사용 가능한 50% 촬영권을 드립니다.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* The functional analyzer component in Mockup Style */}
        <PassportAnalyzer />

        <div className="mt-16 text-center text-[12px] text-zinc-400 font-bold uppercase tracking-widest">
          Yeonhee Studio • Professional Standards
        </div>
      </div>
    </div>
  );
};

export default DemoSection;