import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  // SSR에서 쿠키 기반으로 인증 여부 판정
  const authed = req.cookies.get('cc_authed')?.value === '1';
  if (!authed) {
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

