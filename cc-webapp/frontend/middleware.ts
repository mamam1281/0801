import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenSSR } from './lib/verifyToken';

// 보호 경로 패턴: 로그인/정적/헬스 제외 모든 앱 페이지 보호(필요시 확장)
const PUBLIC_PATHS = [
  '/login',
  '/_next',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
  '/health',
  '/landing',
  '/terms',
  '/privacy',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  // SSR에서 쿠키 기반 인증 + 토큰 검증
  const authed = req.cookies.get('cc_authed')?.value === '1';
  const token = req.cookies.get('cc_token')?.value;
  if (!authed || !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    const orig = pathname + (search || '');
    url.searchParams.set('redirect', orig);
    return NextResponse.redirect(url);
  }
  // SSR 토큰 실제 검증(백엔드 API 호출)
  const valid = await verifyTokenSSR(token);
  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    const orig = pathname + (search || '');
    url.searchParams.set('redirect', orig);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // API 라우트(Next API), 정적 파일 제외, 앱 라우트 전체에 적용
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico).*)'],
};

