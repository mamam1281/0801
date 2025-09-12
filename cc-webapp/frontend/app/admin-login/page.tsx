'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoginScreen } from '@/components/AdminLoginScreen';
import { api } from '@/lib/unifiedApi';
import { setTokens } from '@/utils/tokenStorage';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (adminId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('[DEBUG] 관리자 로그인 시도:', { adminId, password: '***' });
    
    try {
      console.log('[DEBUG] API 호출 전...');
      const response = await api.post('auth/login', {
        site_id: adminId,
        password: password
      });
      
      console.log('[DEBUG] API 응답 원본:', response);
      console.log('[DEBUG] response 타입:', typeof response);
      console.log('[DEBUG] response가 null인가?', response === null);
      console.log('[DEBUG] response가 undefined인가?', response === undefined);
      console.log('[DEBUG] response.access_token:', response?.access_token);
      
      if (response && response.access_token) {
        console.log('[DEBUG] 로그인 성공, 토큰 저장 중...');
        // Use unified token storage instead of separate admin tokens
        setTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token || response.access_token
        });
        
        console.log('[DEBUG] 관리자 대시보드로 리다이렉션...');
        // Redirect to admin dashboard
        router.push('/admin');
        return true;
      } else {
        console.log('[DEBUG] 로그인 실패 - access_token이 없음');
        console.log('[DEBUG] response 내용:', JSON.stringify(response, null, 2));
        return false;
      }
    } catch (error) {
      console.error('[DEBUG] Admin login 예외 발생:', error);
      console.error('[DEBUG] Error details:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        stack: (error as any)?.stack
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <AdminLoginScreen 
        onAdminLogin={handleAdminLogin}
        onBackToLogin={handleBackToLogin}
        isLoading={isLoading}
      />
    </div>
  );
}