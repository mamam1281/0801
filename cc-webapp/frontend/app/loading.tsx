'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductionLoadingScreen from '../components/loading/ProductionLoadingScreen';

export default function LoadingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // 간단한 로컬 개발 환경에서의 타임아웃 로딩 처리
  // 이 코드는 useLoadingController와 ProductionLoadingScreen으로 대체될 예정
  useEffect(() => {
    // 로컬 스토리지에서 인증 토큰 확인
    const token = localStorage.getItem('auth_token');
    
    // 타임아웃 설정 (환경 변수에서 가져오거나 기본값 3000ms 사용)
    const timeout = process.env.NEXT_PUBLIC_LOADING_TIMEOUT ? 
      parseInt(process.env.NEXT_PUBLIC_LOADING_TIMEOUT) : 3000;
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      // 인증 토큰이 있으면 대시보드로, 없으면 로그인 페이지로
      router.push(token ? '/dashboard' : '/login');
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  // 프로덕션 수준의 로딩 화면 사용
  return <ProductionLoadingScreen />;
}
