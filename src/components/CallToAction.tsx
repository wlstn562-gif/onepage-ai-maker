import React from 'react';

const CallToAction: React.FC = () => {
  return (
    <div id="service" className="mt-32 relative">
      <div className="bg-white rounded-[50px] p-12 md:p-20 flex flex-col items-center text-center shadow-[0_20px_0_0_rgba(0,0,0,0.05)] border-4 border-black relative z-10">

        <div className="size-24 bg-primary rounded-3xl flex items-center justify-center mb-8 transform -rotate-6 shadow-xl">
          <span className="material-symbols-outlined text-white text-5xl">auto_fix_high</span>
        </div>

        <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight text-black">여권사진 준비되셨나요?</h3>

        <p className="text-xl font-bold text-gray-600 mb-10 max-w-lg">
          10,000명 이상의 여행자들이 연희스튜디오와 함께<br />새로운 모험을 시작하고 있습니다.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <button className="bg-accent-pink text-white px-10 py-5 rounded-[24px] font-black text-xl md:text-2xl shadow-3d-pink hover:translate-y-1 hover:shadow-3d-pink-sm active:translate-y-2 active:shadow-none transition-all">
            무료로 시작하기
          </button>
          <button className="bg-white text-black border-4 border-black px-10 py-5 rounded-[24px] font-black text-xl md:text-2xl shadow-3d-black hover:translate-y-1 hover:shadow-[0_4px_0_0_#000] active:translate-y-2 active:shadow-none transition-all">
            갤러리 보기
          </button>
        </div>

        <div className="mt-12 flex items-center gap-2 bg-accent-green/10 px-6 py-2 rounded-full">
          <span className="material-symbols-outlined text-accent-green font-bold text-lg">verified_user</span>
          <span className="text-accent-green font-black text-sm uppercase">국제 표준 ISO 19794-5 준수</span>
        </div>
      </div>

      {/* Decorative Background Element */}
      <div className="absolute -top-16 -left-10 md:-left-20 w-32 h-32 opacity-20 transform -rotate-12 z-0">
        <span className="material-symbols-outlined text-[120px] text-black">pets</span>
      </div>
    </div>
  );
};

export default CallToAction;