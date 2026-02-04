import React from 'react';

const FeatureCard = ({
  icon,
  color,
  title,
  description,
  shadowColor
}: {
  icon: string;
  color: string;
  title: string;
  description: string;
  shadowColor: string
}) => (
  <div className="bg-white p-8 rounded-[32px] shadow-xl flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform cursor-default">
    <div
      className={`size-20 ${color} rounded-2xl flex items-center justify-center text-white mb-6`}
      style={{ boxShadow: `0 8px 0 0 ${shadowColor}` }}
    >
      <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
    </div>
    <h4 className="text-xl font-black mb-2">{title}</h4>
    <p className="text-gray-500 font-bold leading-snug">{description}</p>
  </div>
);

const Features: React.FC = () => {
  return (
    <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
      <FeatureCard
        icon="face_retouching_natural"
        color="bg-accent-blue"
        shadowColor="#1971C2"
        title="AI 자동 보정"
        description="클릭 한 번으로 피부톤과 머릿결을 완벽하게."
      />
      <FeatureCard
        icon="straighten"
        color="bg-accent-purple"
        shadowColor="#862E9C"
        title="여권 규격 준수"
        description="전 세계 여권 사진 규격에 맞게 자동 크롭."
      />
      <FeatureCard
        icon="download"
        color="bg-accent-green"
        shadowColor="#2F9E44"
        title="즉시 다운로드"
        description="인화 가능한 고해상도 파일을 바로 받으세요."
      />
    </div>
  );
};

export default Features;