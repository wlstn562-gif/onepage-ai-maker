import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://studioyeonhee.com'),
  title: "연희스튜디오 (YEONHEE STUDIO) - Premium AI Photo & Video",
  description: "연희스튜디오 - AI 여권사진, 프리미엄 영상 생성 서비스 (studioyeonhee.com)",
  openGraph: {
    title: "연희스튜디오 (YEONHEE STUDIO)",
    description: "최고의 AI 기술로 만드는 고퀄리티 영상과 사진",
    images: ['/og-image.jpg'],
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${jakarta.className} bg-background-vibrant font-display text-[#181610] min-h-screen whitespace-normal overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
