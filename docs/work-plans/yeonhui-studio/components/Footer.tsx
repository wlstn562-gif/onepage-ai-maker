import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-16 px-6 md:px-20 mt-20 rounded-t-[40px] md:rounded-t-[60px]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-black">
            <span className="material-symbols-outlined font-bold">pets</span>
          </div>
          <span className="text-2xl font-black tracking-tight">Yeonhui Studio</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold opacity-70">
          <a className="hover:opacity-100 transition-opacity" href="#">Terms</a>
          <a className="hover:opacity-100 transition-opacity" href="#">Privacy</a>
          <a className="hover:opacity-100 transition-opacity" href="#">Help Center</a>
          <a className="hover:opacity-100 transition-opacity" href="#">Instagram</a>
        </div>
        
        <div className="text-sm font-bold opacity-40">
          © 2024 Yeonhui Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;