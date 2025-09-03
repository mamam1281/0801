"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import App from './App';
import { readClientTokens, markAuthedCookie } from '../lib/authGuard';

export const metadata = {
  title: 'Home - Casino-Club F2P',
  description: 'Home hub for Casino-Club F2P. Explore games, shop, and your profile.',
};

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  // 토큰 존재 여부를 로컬에서만 판단 (SSR 불가)
  useEffect(() => {
    try {
      const { access_token: token } = readClientTokens();
      const hasToken = typeof token === 'string' && token.length > 0;
      setAuthed(hasToken);
      setReady(true);
      if (!hasToken) {
        // 메인 접근 시 비로그인이면 로그인 페이지로 이동
        router.replace('/login');
      }
      if (hasToken) {
        // SSR 미들웨어가 참조하는 쿠키 플래그 동기화
        markAuthedCookie();
      }
    } catch {
      setAuthed(false);
      setReady(true);
      router.replace('/login');
    }
  }, [router]);

  // 초기 체크 동안은 빈 상태 유지(플리커 방지)
  if (!ready) return null;
  if (!authed) return null; // 즉시 로그인 페이지로 교체되므로 이 화면은 보이지 않음

  return <App />;
}
