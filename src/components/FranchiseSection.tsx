import React from 'react';
import Link from 'next/link';

const FranchiseSection: React.FC = () => {
    return (
        <section id="franchise" className="mt-40 bg-black rounded-[60px] overflow-hidden relative py-24 md:py-32">
            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-20 text-center">
                <div className="flex flex-col items-center gap-10 mb-20">
                    {/* Floating Icon */}
                    <div className="size-20 bg-zinc-900 rounded-[2rem] border border-white/10 flex items-center justify-center rotate-12 mb-4">
                        <span className="material-symbols-outlined text-white text-3xl">handshake</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
                        연희스튜디오와 함께 <br />
                        여정을 시작하시겠어요?
                    </h2>

                    <p className="text-white/60 text-lg md:text-xl font-bold max-w-2xl leading-relaxed">
                        독보적인 보정 기술력과 데이터 기반의 운영 시스템. <br />
                        전국 지점의 파트너가 되어 새로운 가치를 만들어가세요.
                    </p>
                </div>

                {/* Trust Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-20">
                    {[
                        { label: '누적 이용자', value: '1.2만+', sub: 'TRUSTED USERS' },
                        { label: '반려율', value: '0.1%', sub: 'REJECTION RATE' },
                        { label: '고객 만족도', value: '98%', sub: 'SATISFACTION' },
                        { label: '재방문율', value: '85%', sub: 'RE-VISIT RATE' }
                    ].map((m, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 flex flex-col items-center group hover:bg-white/10 transition-all">
                            <span className="text-white/40 text-[10px] font-black tracking-[0.2em] mb-3 uppercase">{m.sub}</span>
                            <span className="text-3xl md:text-4xl font-black text-[#FF9F0A] mb-2">{m.value}</span>
                            <span className="text-white/60 text-sm font-bold">{m.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap justify-center gap-6 mb-20">
                    <Link
                        href="#franchise-apply"
                        className="flex items-center justify-center rounded-[2rem] h-20 px-12 bg-white text-black text-2xl font-black shadow-xl active:scale-95 transition-all group"
                    >
                        가맹 신청하기
                        <span className="material-symbols-outlined ml-3 text-3xl group-hover:translate-x-2 transition-transform">chevron_right</span>
                    </Link>

                    <Link
                        href="#consultation"
                        className="flex items-center justify-center rounded-[2rem] h-20 px-12 bg-white/5 backdrop-blur-xl text-white text-2xl font-black border border-white/20 hover:bg-white/10 transition-all flex items-center gap-3"
                    >
                        상담 신청서
                        <span className="material-symbols-outlined text-2xl">description</span>
                    </Link>
                </div>

                {/* Bottom Tags */}
                <div className="flex justify-center gap-8 md:gap-16 opacity-30">
                    <span className="text-white text-sm font-black tracking-[0.2em] uppercase">Quality Matters</span>
                    <span className="text-white text-sm font-black tracking-[0.2em] uppercase">Success Together</span>
                    <span className="text-white text-sm font-black tracking-[0.2em] uppercase">Global Standard</span>
                </div>
            </div>
        </section>
    );
};

export default FranchiseSection;
