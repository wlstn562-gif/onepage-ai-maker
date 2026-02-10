import React from 'react';

const PriceItem = ({ title, price, description }: { title: string; price: string; description: string }) => (
    <div className="flex items-center justify-between py-6 border-b border-zinc-100 last:border-0 group hover:bg-zinc-50/50 transition-colors px-4 rounded-xl">
        <div className="flex flex-col gap-1">
            <h5 className="text-xl font-black text-black">{title}</h5>
            <p className="text-sm font-bold text-zinc-400">{description}</p>
        </div>
        <div className="text-2xl font-black text-black">{price}</div>
    </div>
);

const PriceSection: React.FC = () => {
    return (
        <div id="pricing" className="mt-32">
            <div className="bg-white rounded-[50px] p-8 md:p-16 shadow-card border-4 border-black relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[200px] -z-0"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div>
                            <span className="inline-block px-4 py-1.5 bg-black text-white text-[10px] font-black rounded-full mb-4 uppercase tracking-widest">Studio Pricing</span>
                            <h3 className="text-5xl md:text-6xl font-black text-black leading-tight">정직한 가격표</h3>
                        </div>
                        <div className="md:text-right">
                            <p className="text-zinc-500 font-bold mb-2">프리미엄 보정이 포함된 정찰제 가격입니다.</p>
                            <div className="flex gap-2 justify-center md:justify-end">
                                <span className="size-3 rounded-full bg-accent-blue"></span>
                                <span className="size-3 rounded-full bg-accent-pink"></span>
                                <span className="size-3 rounded-full bg-accent-green"></span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-4">
                        <PriceItem
                            title="증명/여권 사진"
                            price="25,000원"
                            description="전문가 1:1 보정 + 인화 8매 + 디지털 파일"
                        />
                        <PriceItem
                            title="컬러 프로필 사진"
                            price="50,000원"
                            description="나만의 무드 컬러 배경 + 시그니처 보정"
                        />
                        <PriceItem
                            title="가족 사진 (3-4인)"
                            price="150,000원"
                            description="대형 고급 액자 1개 + 원본/보정본 전체 제공"
                        />
                        <PriceItem
                            title="가족 사진 (5-6인)"
                            price="220,000원"
                            description="대형 고급 액자 + 특수 정밀 보정 포함"
                        />
                        <PriceItem
                            title="커플/우정 스냅"
                            price="80,000원"
                            description="2인 기준 + 개별 인화 + 전체 파일 제공"
                        />
                        <PriceItem
                            title="반려동물 단독 촬영"
                            price="45,000원"
                            description="우리 아이를 위한 단독 조명 셋업 촬영"
                        />
                        <PriceItem
                            title="비지니스 헤드샷"
                            price="70,000원"
                            description="전문직/기업용 프리미엄 상반신 프로필"
                        />
                        <PriceItem
                            title="홈 셀프 여권 (Web)"
                            price="3,900원"
                            description="방문 전 미리 보는 셀프 분석 서비스"
                        />
                    </div>

                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="aspect-square bg-zinc-100 rounded-3xl overflow-hidden shadow-inner border-2 border-zinc-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-zinc-300">family_restroom</span>
                        </div>
                        <div className="aspect-square bg-zinc-100 rounded-3xl overflow-hidden shadow-inner border-2 border-zinc-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-zinc-300">group</span>
                        </div>
                        <div className="aspect-square bg-zinc-100 rounded-3xl overflow-hidden shadow-inner border-2 border-zinc-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-zinc-300">groups</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceSection;
