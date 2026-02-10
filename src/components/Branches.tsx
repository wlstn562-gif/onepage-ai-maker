import React from 'react';

const BranchCard = ({
    name,
    color,
    shadowColor,
    link
}: {
    name: string;
    color: string;
    shadowColor: string;
    link: string
}) => (
    <div className="bg-white p-8 rounded-[32px] shadow-xl flex flex-col items-center text-center transform hover:-translate-y-2 transition-all group">
        <div
            className={`size-24 ${color} rounded-3xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}
            style={{ boxShadow: `0 10px 0 0 ${shadowColor}` }}
        >
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
            </span>
        </div>
        <h4 className="text-3xl font-black mb-6">{name}</h4>
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center h-14 bg-black text-white rounded-2xl font-black text-sm shadow-3d-black active:translate-y-1 active:shadow-none transition-all gap-2"
        >
            예약하러 가기
            <span className="material-symbols-outlined text-xl">calendar_month</span>
        </a>
    </div>
);

const Branches: React.FC = () => {
    return (
        <div id="features" className="mt-32">
            <div className="text-center mb-16">
                <span className="px-4 py-1.5 bg-white rounded-full text-[10px] font-black shadow-sm mb-4 inline-block uppercase tracking-widest">Our Studios</span>
                <h3 className="text-5xl font-black text-black mb-4">가까운 지점을 선택하세요</h3>
                <p className="text-zinc-500 font-bold text-lg">전 지점 0.1% 반려율, 동일한 스튜디오 서비스를 제공합니다.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <BranchCard
                    name="천안점"
                    color="bg-accent-blue"
                    shadowColor="#1971C2"
                    link="https://map.naver.com"
                />
                <BranchCard
                    name="청주점"
                    color="bg-accent-purple"
                    shadowColor="#862E9C"
                    link="https://map.naver.com"
                />
                <BranchCard
                    name="대전점"
                    color="bg-accent-green"
                    shadowColor="#2F9E44"
                    link="https://map.naver.com"
                />
            </div>
        </div>
    );
};

export default Branches;
