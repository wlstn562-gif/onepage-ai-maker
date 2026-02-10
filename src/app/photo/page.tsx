import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DemoSection from '@/components/DemoSection';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

export default function App() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden" style={{ backgroundColor: '#fff0c1' }}>
      <div className="layout-container flex h-full grow flex-col bg-[#fff0c1]">
        <Header />
        <main className="flex-1 px-4 md:px-20 lg:px-40 pb-20">
          <Hero />
          <Features />
          <DemoSection />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </div>
  );
}
