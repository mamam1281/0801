// cc-webapp/frontend/app/layout.tsx
import React from 'react';
import type { Metadata } from 'next';
import { Epilogue, Exo, IBM_Plex_Sans_KR } from 'next/font/google';

// 1. 글로벌 CSS 임포트
import '../styles/global.css'; // 올바른 경로로 수정
import '../styles/miniapp-override.css'; // 미니앱 전용 스타일
import '../styles/profile.css'; // 프로필 전용 스타일
// auth-nav.css 파일 임시 제거 (청크 로드 오류 해결을 위함)

// 2. 클라이언트 컴포넌트 임포트
import LayoutWrapper from './LayoutWrapper';

// 3. Google Fonts 최적화 설정
const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-epilogue',
  display: 'swap',
});

const exo = Exo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-exo',
  display: 'swap',
});

const ibmPlexSansKR = IBM_Plex_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-sans-kr',
  display: 'swap',
});

// 4. 메타데이터 정의
export const metadata: Metadata = {
  title: {
    default: 'GamePlatform App',
    template: '%s | GamePlatform',
  },
  description: 'A modern gaming platform application with React 19 and Next.js 15',
  keywords: ['game', 'platform', 'rewards', 'entertainment'],
  authors: [{ name: 'GamePlatform Team' }],
  creator: 'GamePlatform',
  publisher: 'GamePlatform',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: 'GamePlatform App',
    description: 'A modern gaming platform application',
    siteName: 'GamePlatform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GamePlatform App',
    description: 'A modern gaming platform application',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'verification_token',
    // yandex: 'verification_token',
    // yahoo: 'verification_token',
  },
};

// 5. Viewport 설정 (Next.js 15 요구사항)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  minimumScale: 1,
  themeColor: '#000000',
  colorScheme: 'dark light',
};

export interface RootLayoutProps {
  children: React.ReactNode;
}

// 5. 서버 컴포넌트 RootLayout
export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html 
      lang="ko" 
      className={`${epilogue.variable} ${exo.variable} ${ibmPlexSansKR.variable} font-[var(--font-primary)]`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body 
        className="theme-dark min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased"
        suppressHydrationWarning
      >
        {/* 6. 클라이언트 래퍼로 상태 관리 위임 */}
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
