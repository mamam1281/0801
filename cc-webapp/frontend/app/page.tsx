
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import App from './App';

export const metadata = {
  title: 'Home - Casino-Club F2P',
  description: 'Home hub for Casino-Club F2P. Explore games, shop, and your profile.',
};

export default function Home() {
  const router = useRouter();
  useEffect(() => {
      // SSR/CSR 모두에서 쿠키 기반 인증 체크
      let token = null;
      if (typeof document !== 'undefined') {
        // 클라이언트: document.cookie에서 직접 추출
        const match = document.cookie.match(/(^|;)\s*auth_token=([^;]*)/);
        token = match ? match[2] : null;
      }
      if (!token) router.replace('/login');
  }, []);
  return <App />;
}
