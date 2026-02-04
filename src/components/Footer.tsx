import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-16 px-6 md:px-20 mt-20 rounded-t-[40px] md:rounded-t-[60px]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-4">
          <img
            src="/logo/1.png"
            alt="Yeonhui Studio"
            className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold opacity-70">
          <a className="hover:opacity-100 transition-opacity" href="#">이용약관</a>
          <a className="hover:opacity-100 transition-opacity" href="#">개인정보처리방침</a>
          <a className="hover:opacity-100 transition-opacity" href="#">고객센터</a>
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