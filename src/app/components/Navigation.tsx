"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (pathname === "/" || pathname === "/godeliver") return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="text-2xl font-black">
              <span className="text-white">YEONHEE</span>
              <span className="text-[#D4AF37]">.STUDIO</span>
            </div>
            <span className="text-sm text-gray-400 font-medium tracking-widest hidden md:block">STAFF HUB</span>
          </Link>

          {/* Navigation Links for Yeonhee Studio */}
          <div className="flex gap-8 items-center">
            <div className="hidden md:flex gap-8">
              {['Home', 'Service', 'Locations'].map((item) => (
                <Link
                  key={item}
                  href={`/#${item.toLowerCase()}`}
                  className="text-sm font-bold tracking-wide text-gray-500 hover:text-white transition-colors uppercase"
                >
                  {item}
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-4 bg-white/20"></div>

            {/* Strategy Hub Link */}
            <Link
              href="/strategy"
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isActive("/strategy")
                ? "bg-[var(--premium-gold)] text-black"
                : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              💼 Strategy Center
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
