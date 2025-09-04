
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import App from './App';

// metadata export는 use client 파일에서 금지됨

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  
  useEffect(() => {
    console.log('[HOME] 강력한 인증 체크 시작');
    
    // 즉시 차단: 쿠키에서 토큰 확인
    const token = document.cookie.match(/(^|;)\s*auth_token=([^;]*)/)?.[2];
    
    console.log(`[HOME] 토큰 상태: ${token ? '있음' : '없음'}`);
    
    if (!token) {
      console.log('[HOME] 비인증 감지 → 즉시 차단하고 /login 이동');
      // 즉시 페이지를 차단하고 로그인으로 이동
      window.location.href = '/login';
      return;
    }
    
    console.log('[HOME] 인증됨 → 메인 화면 표시');
    setChecked(true);
  }, [router]);
  
  // 토큰 체크 완료 전까지는 절대 메인 화면 표시 안함
  if (!checked) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        인증 확인 중... 비인증 시 로그인 페이지로 이동합니다.
      </div>
    );
  }
  
  return <App />;
}
