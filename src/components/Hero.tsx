import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <div className="flex flex-col @container mt-10">
      <div className="flex flex-col gap-10 items-center lg:flex-row lg:justify-between">

        {/* Left Image Section */}
        <div className="w-full max-w-[500px] relative group z-10">
          <div className="absolute inset-0 bg-white/20 rounded-[40px] blur-3xl -z-10 group-hover:bg-white/30 transition-all"></div>
          <div className="relative bg-white p-4 rounded-[40px] shadow-card border-[6px] border-white transform hover:rotate-2 transition-transform duration-500">
            <div
              className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover rounded-[30px]"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAlylwZ3YZiTwOANKPbxu7T659qcMAeQt3b6OQ7yKkqV1JEbbU_xkfxOBhETNyUAO-tJB4Bpo429uCnS3hHbCwWI8vzLLhZe8NoWYRK4n4IcOpR2miJvi7HWiVKrHk5ZbNdwkT4W_M1W9TKYajeae1S1kWV9lbNpNvZ06AlEZiskazcGsBEuuUFDkBBklX12gO6KIM_kejtxb-7LtO2DzBZHUCknYczkFwrFpeLS5iVBKwa_c_8SropnBthoJRjClzdz3ahbCSfyrpB")' }}
            >
            </div>
          </div>
          {/* Badge */}
          <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-[#FFB200] to-[#FF8A00] text-white p-4 rounded-3xl shadow-xl transform rotate-12 flex flex-col items-center animate-bounce duration-[3000ms]">
            <span className="material-symbols-outlined text-4xl">auto_awesome</span>
            <span className="text-[10px] font-black uppercase">Magic Studio</span>
          </div>
        </div>

        {/* Right Text Section */}
        <div className="flex flex-col gap-8 max-w-[600px] items-center lg:items-start text-center lg:text-left mt-10 lg:mt-0">
          <div className="flex flex-col gap-4 items-center lg:items-start">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full w-fit shadow-md">
              <span className="material-symbols-outlined text-[#FF9F0A] text-xl">verified</span>
              <span className="text-sm font-extrabold text-[#111111]">BEST STUDIO 2024</span>
            </div>
            <h1 className="text-[#111111] text-6xl md:text-7xl font-black leading-[1.1] tracking-tight">
              여권사진,<br />딸깍 하면 끝!
            </h1>
            <p className="text-[#111111]/80 text-xl font-bold leading-relaxed max-w-md">
              가장 깔끔하고 간편한 여권사진 만들기. 전문가의 손길을 거친 듯 완벽하게 보정해드려요!
            </p>
          </div>

          <Link
            href="#branches"
            className="flex w-full max-w-sm items-center justify-center rounded-3xl h-20 px-10 bg-gradient-to-br from-[#FFB200] to-[#FF8A00] text-white text-2xl font-black shadow-[0_8px_0_0_#E67E00] active:translate-y-2 active:shadow-none transition-all group"
          >
            가까운 지점 예약하기
            <span className="material-symbols-outlined ml-3 text-3xl group-hover:translate-x-2 transition-transform">event_available</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Hero;