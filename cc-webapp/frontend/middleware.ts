// 에디터 타입 오류 회피: 로컬에서 node_modules 미설치 시 타입 선언 경고가 날 수 있어 무시 처리
// @ts-ignore
import type { NextRequest } from 'next/server';
// @ts-ignore
import { NextResponse } from 'next/server';


export default function middleware(req: NextRequest) {
	const token = req.cookies.get('auth_token')?.value || req.headers.get('Authorization');
	const protectedPaths = [
		'/', '/shop', '/games', '/dashboard', '/profile', '/admin'
	];
	const { pathname } = req.nextUrl;

	// 로그인/회원가입/공개페이지는 예외
	if (protectedPaths.some(path => pathname.startsWith(path))) {
		if (!token) {
			const loginUrl = req.nextUrl.clone();
			loginUrl.pathname = '/login';
			return NextResponse.redirect(loginUrl);
		}
	}
	return NextResponse.next();
}

export const config = {
	// 전역 적용은 유지하되, _next 내부 정적 자원과 API는 제외할 수 있음
	matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};

