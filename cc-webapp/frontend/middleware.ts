import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/* 프록시 요청 시, 클라이언트 쿠키에 존재하는 토큰을 읽어
 * 백엔드로 전달될 Authorization 헤더를 주입합니다.
 * - Playwright page.request('/api/...') 시에도 헤더가 포함되도록 보장
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/')) {
    // 우선 cc_auth_tokens(JSON) → access_token, 아니면 cc_access_token 쿠키 사용
    let token: string | undefined;
    const bundle = req.cookies.get('cc_auth_tokens')?.value;
    if (bundle) {
      try { token = (JSON.parse(bundle) || {}).access_token; } catch { /* ignore */ }
    }
    if (!token) token = req.cookies.get('cc_access_token')?.value;

    if (token) {
      const requestHeaders = new Headers(req.headers);
      if (!requestHeaders.has('authorization')) {
        requestHeaders.set('authorization', `Bearer ${token}`);
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
