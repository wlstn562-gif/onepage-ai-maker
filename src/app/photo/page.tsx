import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Branches from '@/components/Branches';
import DemoSection from '@/components/DemoSection';
import PriceSection from '@/components/PriceSection';
import FranchiseSection from '@/components/FranchiseSection';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot';

export default function App() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden" style={{ backgroundColor: '#fff0c1' }}>
      <div className="layout-container flex h-full grow flex-col bg-[#fff0c1]">
        <Header />
        <main className="flex-1 px-4 md:px-20 lg:px-40 pb-32">
          <Hero />
          <Branches />
          <DemoSection />
          <PriceSection />
          <FranchiseSection />
        </main>
        <Footer />
        <Chatbot />
      </div>
    </div>
  );
}
