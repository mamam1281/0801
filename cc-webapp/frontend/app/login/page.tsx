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
      
      const response = await api.post('auth/login', {
        site_id: nickname,  // nickname을 site_id로 전송
        password,
      }, {
        auth: false  // 로그인 요청은 인증이 필요하지 않음
      });

      console.log('[LoginPage] 로그인 응답:', response);

      if (response.access_token) {
        // 토큰 저장
        setTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token || null,
        });

        // 관리자 계정이면 관리자 페이지로, 아니면 메인 페이지로
        if (nickname === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        
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
