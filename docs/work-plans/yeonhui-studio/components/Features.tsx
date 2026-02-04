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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
      <FeatureCard 
        icon="face_retouching_natural"
        color="bg-accent-blue"
        shadowColor="#1971C2"
        title="AI Correction"
        description="Perfect skin tone and hair with one click."
      />
      <FeatureCard 
        icon="straighten"
        color="bg-accent-purple"
        shadowColor="#862E9C"
        title="Passport Specs"
        description="Auto-fit to global official standards."
      />
      <FeatureCard 
        icon="download"
        color="bg-accent-green"
        shadowColor="#2F9E44"
        title="Instant Download"
        description="High-res files ready for printing."
      />
    </div>
  );
};

export default Features;