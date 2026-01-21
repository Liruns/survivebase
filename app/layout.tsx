import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ThemeProvider from '@/components/ui/ThemeProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://survivebase.vercel.app'),
  title: {
    default: 'SurviveBase - 오픈월드 생존 건설 게임 큐레이션',
    template: '%s | SurviveBase',
  },
  description:
    '서바이벌, 오픈월드, 건설, 자동화 장르의 Steam 게임을 한눈에 탐색하고 비교하세요. Satisfactory, Factorio, 7 Days to Die 같은 게임을 찾아보세요.',
  keywords: [
    '스팀 게임',
    '생존 게임',
    '오픈월드',
    '건설 게임',
    '서바이벌',
    '팩토리오',
    '세티스팩토리',
    'Steam',
    'survival games',
    'base building',
  ],
  authors: [{ name: 'SurviveBase' }],
  creator: 'SurviveBase',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'SurviveBase',
    title: 'SurviveBase - 오픈월드 생존 건설 게임 큐레이션',
    description:
      '서바이벌, 오픈월드, 건설, 자동화 장르의 Steam 게임을 한눈에 탐색하고 비교하세요.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SurviveBase - 오픈월드 생존 건설 게임 큐레이션',
    description:
      '서바이벌, 오픈월드, 건설, 자동화 장르의 Steam 게임을 한눈에 탐색하고 비교하세요.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-bg-primary text-text-primary antialiased flex flex-col min-h-screen">
        <ThemeProvider>
          <Header />
          <main className="flex-grow pt-16 pb-20 md:pb-0">
            {children}
          </main>
          <Footer className="hidden md:block" />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
