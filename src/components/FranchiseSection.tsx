import React from 'react';

const FranchiseSection: React.FC = () => {
    return (
        <div id="service" className="mt-32">
            <div className="bg-black rounded-[50px] p-12 md:p-20 flex flex-col items-center text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-10 -left-10 size-64 rounded-full bg-accent-blue blur-3xl"></div>
                    <div className="absolute -bottom-10 -right-10 size-64 rounded-full bg-accent-pink blur-3xl"></div>
                </div>

                <div className="relative z-10 w-full max-w-2xl">
                    <div className="size-24 bg-white/10 backdrop-blur-md rounded-[32px] flex items-center justify-center mb-10 transform rotate-12 mx-auto border border-white/20">
                        <span className="material-symbols-outlined text-white text-5xl">handshake</span>
                    </div>

                    <h3 className="text-4xl md:text-5xl font-black mb-6 text-white leading-tight">
                        연희스튜디오와 함께<br />여정을 시작하시겠어요?
                    </h3>

                    <p className="text-white/60 font-bold text-lg mb-12">
                        독보적인 보정 기술력과 데이터 기반의 운영 시스템.<br />
                        전국 지점의 파트너가 되어 새로운 가치를 만들어가세요.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-6 w-full">
                        <button className="flex-1 bg-white text-black px-10 py-5 rounded-[24px] font-black text-xl shadow-[0_6px_0_0_#ccc] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3">
                            가맹 신청하기
                            <span className="material-symbols-outlined">send</span>
                        </button>
                        <button className="flex-1 bg-zinc-900 text-white border-2 border-white/20 px-10 py-5 rounded-[24px] font-black text-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-3">
                            상담 신청서
                            <span className="material-symbols-outlined text-lg">description</span>
                        </button>
                    </div>

                    <div className="mt-16 flex items-center justify-center gap-10 opacity-30 grayscale contrast-200">
                        {/* Brand logos or icons could go here */}
                        <div className="text-white font-black text-xs uppercase tracking-widest">Quality Matters</div>
                        <div className="text-white font-black text-xs uppercase tracking-widest">Success Together</div>
                        <div className="text-white font-black text-xs uppercase tracking-widest">Global Standard</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FranchiseSection;
