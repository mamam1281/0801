"use client";

import { cookies } from 'next/headers';

export type AuthTokens = { access_token?: string | null; refresh_token?: string | null };

export function readClientTokens(): AuthTokens {
  try {
    const legacy = typeof window !== 'undefined' ? localStorage.getItem('cc_access_token') : null;
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cc_auth_tokens') : null;
    const bundle = raw ? JSON.parse(raw) : null;
    return { access_token: legacy || bundle?.access_token || null, refresh_token: bundle?.refresh_token || null };
  } catch {
    return { access_token: null, refresh_token: null };
  }
}

// 로그인 직후 호출: SSR 미들웨어용 쿠키 플래그를 동기화
export function markAuthedCookie() {
  try {
    document.cookie = `cc_authed=1; path=/`;
  } catch {}
}

export function clearAuthedCookie() {
  try {
    document.cookie = `cc_authed=; Max-Age=0; path=/`;
  } catch {}
}

// redirect 파라미터로 원위치 이동
export function getRedirectParam(): string | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const redirect = url.searchParams.get('redirect');
  return redirect && redirect.startsWith('/') ? redirect : null;
}
