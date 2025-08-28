import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 기본 미들웨어: 통과 시키되 명시적으로 Response를 반환하여 런타임 오류를 방지합니다.
export default function middleware(_req: NextRequest) {
	// 필요 시 향후 A/B 라우팅, 보안 헤더 추가 등 확장
	return NextResponse.next();
}

export const config = {
	// 전역 적용은 유지하되, _next 내부 정적 자원과 API는 제외할 수 있음
	matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};

