'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoginScreen } from '../../components/AdminLoginScreen';
import { api } from '../../lib/unifiedApi';
import { setTokens } from '../../utils/tokenStorage';

export default function AdminLoginPage() {
  const router = useRouter();

  const handleAdminLogin = async (adminId: string, password: string): Promise<boolean> => {
    try {
      console.log('[AdminLoginPage] 관리자 로그인 시도:', { adminId, password: '***' });
      
      const response = await api.post('auth/admin/login', {
        admin_id: adminId,
        password,
      }, {
        auth: false  // 로그인 요청은 인증이 필요하지 않음
      });

      console.log('[AdminLoginPage] 관리자 로그인 응답:', response);

      if (response?.access_token) {
        // 토큰 저장
        const tokens = {
          access_token: response.access_token,
          refresh_token: response.refresh_token || '',
          expires_at: response.expires_at || null
        };
        
        setTokens(tokens);
        console.log('[AdminLoginPage] 관리자 토큰 저장 완료');

        // 쿠키도 설정
        try {
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
          document.cookie = `auth_token=${response.access_token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
          console.log('[AdminLoginPage] 관리자 쿠키 설정 완료');
          
          // 쿠키 설정 확인
          setTimeout(() => {
            const allCookies = document.cookie;
            console.log('[AdminLoginPage] 설정 후 모든 쿠키:', allCookies);
            const hasAuthToken = allCookies.includes('auth_token=');
            console.log('[AdminLoginPage] auth_token 쿠키 존재:', hasAuthToken);
          }, 100);
        } catch (error) {
          console.error('[AdminLoginPage] 쿠키 설정 실패:', error);
        }

        // 관리자 로그인 성공 후 관리자 페이지로 이동
        setTimeout(() => {
          console.log('[AdminLoginPage] 관리자 페이지로 이동: /admin');
          window.location.href = '/admin'; // 강제 새로고침으로 미들웨어 재실행
        }, 500);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AdminLoginPage] 관리자 로그인 에러:', error);
      return false;
    }
  };

  const handleBackToLogin = () => {
    console.log('[AdminLoginPage] 일반 로그인 페이지로 이동');
    router.push('/login');
  };

  return (
    <AdminLoginScreen 
      onAdminLogin={handleAdminLogin}
      onBackToLogin={handleBackToLogin}
      isLoading={false}
    />
  );
}
