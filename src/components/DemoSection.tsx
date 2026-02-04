"use client";
import React from 'react';

const DemoSection: React.FC = () => {
  return (
    <div id="demo" className="mt-32">
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-5xl font-black text-center mb-4 text-black">비포 & 애프터의 마법</h2>
        <div className="h-2 w-32 bg-black rounded-full"></div>
      </div>

      <div className="bg-white/40 p-4 md:p-12 rounded-[50px] border-4 border-white shadow-2xl backdrop-blur-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Image Comparison */}
          <div className="relative flex flex-col gap-6">
            <div className="bg-white p-4 rounded-[40px] shadow-lg relative overflow-hidden group cursor-crosshair">
              <div className="relative aspect-[3/4] rounded-[30px] overflow-hidden">
                {/* Before Image (Default) */}
                <div
                  className="absolute inset-0 bg-center bg-cover transition-opacity duration-500 opacity-100 group-hover:opacity-0"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHV0GQ06KsC7jNq7Wa6qL2E1jl_93MaBxh8_YfUzIJ3V_WXtoMap3axgnPonmqiHk3t8OcbY9_mMYNHLToogItPtnDL5GM3HHRHD2pY6hRdPREEDcnEDFlk54nxkp5HCuRMundvyhJ19BiYU_KrS8SYttC1SuVUertyyitB_6LPR_Nr1uvHjq6dbfQ3RLTXo2-aa5uZj-suyHOXPDgXDYDDA1tJ5fDOoaUV8q0GFv8wvLP6X6DJA-dV3-uxq4L76Q8k6vtgexd00Bp")' }}
                ></div>

                {/* After Image (Hover) */}
                <div
                  className="absolute inset-0 bg-center bg-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAyi922AQOju_SQe9JF3XChXy8f-imtktkIeDfH_6AtPgwO1NUkhdJjdCSVV9U4fzGRerMxygjsqtiJZhI0uj2YXNq3lFgr_q-kt8_AH8NCvm9q5a85kivovesZ4nWy4NTIMZFdL2mEtCDeCWK3EU2AYE11a3TMDL4Ae84H7ylDEJRMGYAARnwvtkN-zmWMjQd3n_Ns6G2kM-6cNfxkwRDa_Fz4fjuy6i47ZmuEZXVj_EFYRojtgb8cMvbalmiI6xg1S8kGcnjS13HP")' }}
                ></div>

                {/* Badge */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <div className="bg-black text-white px-4 py-2 rounded-full font-black text-xs group-hover:hidden transition-all">원본</div>
                  <div className="bg-accent-pink text-white px-4 py-2 rounded-full font-black text-xs hidden group-hover:block transition-all animate-pulse">AI 보정 후</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full text-white font-bold text-sm pointer-events-none transition-opacity group-hover:opacity-0">
                마우스를 올려보세요 ✨
              </div>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex flex-col gap-8 items-center">
            <div className="bg-black p-4 rounded-[60px] shadow-[0_30px_60px_rgba(0,0,0,0.3)] border-[8px] border-[#333] relative w-full max-w-[350px]">
              {/* Phone Screen */}
              <div className="bg-[#F8F9FA] rounded-[50px] overflow-hidden aspect-[9/19] flex flex-col relative">

                {/* Status Bar Mock */}
                <div className="absolute top-0 w-full h-8 flex justify-center items-end">
                  <div className="w-20 h-6 bg-black rounded-b-2xl"></div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 mt-8">
                  <div className="size-24 bg-background-vibrant/30 rounded-full flex items-center justify-center">
                    <div className="size-16 bg-white rounded-xl shadow-lg flex items-center justify-center transform -rotate-6">
                      <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <h5 className="text-xl font-black mb-1">업로드하면 끝!</h5>
                    <p className="text-gray-500 text-sm font-bold">오직 3초면 완성됩니다</p>
                  </div>

                  <div className="w-full flex flex-col gap-3 px-2">
                    <button className="h-12 w-full bg-accent-blue rounded-2xl shadow-[0_4px_0_0_#1971C2] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white font-black text-xs tracking-wide">
                      피부 보정
                    </button>
                    <button className="h-12 w-full bg-accent-purple rounded-2xl shadow-[0_4px_0_0_#862E9C] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white font-black text-xs tracking-wide">
                      배경 합성
                    </button>
                    <button className="h-12 w-full bg-accent-green rounded-2xl shadow-[0_4px_0_0_#2F9E44] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center text-white font-black text-xs tracking-wide">
                      완료!
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Island / Notch Cover (for style) */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full pointer-events-none"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DemoSection;