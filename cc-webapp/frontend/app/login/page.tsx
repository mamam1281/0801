'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '../../components/LoginScreen';
import { api } from '../../lib/unifiedApi';
import { setTokens } from '../../utils/tokenStorage';

// Static metadata - moved to layout or use generateMetadata for client components
// export const metadata = {
//   title: 'Login - Casino-Club F2P',
//   description: 'Sign in to Casino-Club F2P and continue your play.',
// };

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (nickname: string, password: string): Promise<boolean> => {
    try {
      console.log('[LoginPage] 로그인 시도:', { nickname, password: '***' });
      console.log('[LoginPage] API 요청 URL 예상:', 'http://localhost:8000/api/auth/login');
      console.log('[LoginPage] 요청 데이터:', { site_id: nickname, password: '***' });
      
      const response = await api.post('auth/login', {
        site_id: nickname,  // nickname을 site_id로 전송
        password,
      }, {
        auth: false  // 로그인 요청은 인증이 필요하지 않음
      });

      console.log('[LoginPage] 로그인 응답:', response);

      if (response.access_token) {
        // 토큰 저장 (localStorage)
        setTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token || null,
        });

        // 쿠키에도 토큰 저장 (미들웨어용)
        document.cookie = `auth_token=${response.access_token}; path=/; max-age=3600`;
        
        // 저장 확인
        console.log('[LoginPage] 토큰 저장 완료');
        console.log('[LoginPage] 쿠키 확인:', document.cookie);
        
        // 짧은 지연 후 페이지 이동 (쿠키 동기화 시간 확보)
        setTimeout(() => {
          if (nickname === 'admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 100);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('[LoginPage] 로그인 에러:', error);
      return false;
    }
  };

  return <LoginScreen onLogin={handleLogin} />;
}
