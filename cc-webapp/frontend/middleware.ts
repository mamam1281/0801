import { NextRequest, NextResponse } from 'next/server';

// 강제 게스트 차단: auth_token 쿠키 없으면 /login으로 즉시 리다이렉트
export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  
  console.log(`[MIDDLEWARE] 요청: ${pathname}`);

  // 허용 경로 (인증 불필요)
  const allowedPaths = [
    '/_next',
    '/api', 
    '/login',
    '/signup',
    '/admin-login',  // 관리자 로그인 페이지 허용
    '/favicon.ico',
    '/public',
    '/healthz'
  ];
  
  // 허용 경로인지 확인
  const isAllowed = allowedPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
  
  if (isAllowed) {
    console.log(`[MIDDLEWARE] 허용 경로: ${pathname}`);
    return NextResponse.next();
  }

  // 인증 토큰 확인 - 더 상세한 디버깅
  const token = req.cookies.get('auth_token')?.value;
  const allCookies = req.cookies.getAll();
  
  console.log(`[MIDDLEWARE] 토큰 상태: ${token ? '있음' : '없음'}`);
  console.log(`[MIDDLEWARE] 토큰 길이: ${token ? token.length : 0}`);
  console.log(`[MIDDLEWARE] 전체 쿠키 개수: ${allCookies.length}`);
  console.log(`[MIDDLEWARE] 쿠키 이름들: [${allCookies.map(c => c.name).join(', ')}]`);
  
  if (allCookies.length > 0) {
    console.log('[MIDDLEWARE] 쿠키 상세:');
    allCookies.forEach(cookie => {
      const preview = cookie.value.length > 50 ? cookie.value.substring(0, 50) + '...' : cookie.value;
      console.log(`  - ${cookie.name}: ${preview}`);
    });
  }
  
  console.log(`[MIDDLEWARE] 경로 ${pathname} 접근 시도`);
  
  if (!token) {
    console.log(`[MIDDLEWARE] 비인증 → 리다이렉트`);
    const redirectUrl = req.nextUrl.clone();
    
    // 관리자 페이지 접근 시 관리자 로그인으로 리다이렉션
    if (pathname.startsWith('/admin')) {
      console.log(`[MIDDLEWARE] 관리자 페이지 접근 → /admin-login 리다이렉트`);
      redirectUrl.pathname = '/admin-login';
      redirectUrl.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log(`[MIDDLEWARE] 일반 페이지 접근 → /login 리다이렉트`);
      redirectUrl.pathname = '/login';
      redirectUrl.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  console.log(`[MIDDLEWARE] 인증됨 → 계속`);
  return NextResponse.next();
}

// 강력한 매처: 루트 및 모든 보호 경로 매칭
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

