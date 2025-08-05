import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

/**
 * 백엔드 API 서버 상태 확인을 위한 헬스 체크 라우트
 * Next.js 서버 라우트로 구현
 */
export async function GET(request: NextRequest) {
  try {
    // 백엔드 API 서버 헬스 체크
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    let apiStatus = false;
    let apiError: string | null = null;
    
    try {
      const apiResponse = await fetch(`${apiUrl}/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        // 짧은 타임아웃 설정
        signal: AbortSignal.timeout(2000)
      });
      apiStatus = apiResponse.ok;
    } catch (error) {
      console.error('API 서버 연결 오류:', error);
      apiError = error instanceof Error ? error.message : '알 수 없는 오류';
      // 개발 환경에서는 API 서버 연결 실패를 허용
      if (process.env.NODE_ENV === 'development') {
        apiStatus = true;
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        frontend: {
          status: 'online',
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
        },
        backend: {
          status: apiStatus ? 'online' : 'offline',
          error: apiError
        }
      },
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('헬스 체크 오류:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
