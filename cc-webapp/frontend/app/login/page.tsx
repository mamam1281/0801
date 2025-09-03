"use client";
import React, { useEffect } from 'react';
import App from '../App';
import { getRedirectParam, markAuthedCookie, readClientTokens } from '../../lib/authGuard';
import { useRouter } from 'next/navigation';

export const metadata = {
  title: 'Login - Casino-Club F2P',
  description: 'Sign in to Casino-Club F2P and continue your play.',
};

export default function LoginPage() {
  const router = useRouter();
  // 이미 로그인 상태라면 원위치로 이동
  useEffect(() => {
    const { access_token } = readClientTokens();
    if (access_token && access_token.length > 0) {
      markAuthedCookie();
      const target = getRedirectParam() || '/';
      router.replace(target);
    }
  }, [router]);
  return <App />;
}
