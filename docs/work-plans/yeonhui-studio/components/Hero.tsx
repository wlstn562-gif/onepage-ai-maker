import React from 'react';

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
          <div className="absolute -bottom-6 -right-6 bg-accent-pink text-white p-4 rounded-3xl shadow-xl transform rotate-12 flex flex-col items-center animate-bounce duration-[3000ms]">
            <span className="material-symbols-outlined text-4xl">auto_awesome</span>
            <span className="text-[10px] font-black uppercase">Magic AI</span>
          </div>
        </div>

        {/* Right Text Section */}
        <div className="flex flex-col gap-8 max-w-[600px] items-center lg:items-start text-center lg:text-left mt-10 lg:mt-0">
          <div className="flex flex-col gap-4 items-center lg:items-start">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full w-fit shadow-md">
              <span className="material-symbols-outlined text-primary text-xl">verified</span>
              <span className="text-sm font-extrabold text-black">BEST STUDIO 2024</span>
            </div>
            <h1 className="text-black text-6xl md:text-7xl font-black leading-[1.1] tracking-tight">
              Ttalkkak<br />Passport AI
            </h1>
            <p className="text-black/80 text-xl font-bold leading-relaxed max-w-md">
              The cutest way to get your passport photos. Instant AI correction with a playful touch!
            </p>
          </div>

          <button className="group relative flex w-full max-w-sm cursor-pointer items-center justify-center rounded-3xl h-20 px-10 bg-black text-white text-2xl font-black shadow-[0_10px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.2)] hover:translate-y-[5px] active:translate-y-[10px] active:shadow-none transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="truncate">Start Now!</span>
            <span className="material-symbols-outlined ml-3 text-3xl">camera_enhance</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Hero;