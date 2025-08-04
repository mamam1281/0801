'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { openGamePopup } from '../../utils/gamePopup';
import '../../styles/splash.css';

interface SplashScreenProps {
  onComplete?: () => void;
  skipAuth?: boolean;
}

export default function SplashScreen({ onComplete, skipAuth = false }: SplashScreenProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'splash' | 'auth' | 'done'>('splash');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('accessToken');
      setIsLoggedIn(!!token);
    };

    // 스플래시 화면 후 로그인 상태 확인
    const splashTimer = setTimeout(() => {
      checkLoginStatus();
      setFadeOut(true);
      
      setTimeout(() => {
        // skipAuth가 true이거나 이미 로그인된 경우 바로 완료
        if (skipAuth || isLoggedIn) {
          setPhase('done');
          onComplete?.();
        } else {
          setPhase('auth');
          setFadeOut(false);
        }
      }, 600); // 페이드 아웃 애니메이션 시간
    }, 2200); // 스플래시 표시 시간

    return () => clearTimeout(splashTimer);
  }, [skipAuth, isLoggedIn, onComplete]);

  // 로그인 페이지로 이동
  const handleLogin = () => {
    if (typeof window !== 'undefined') {
      openGamePopup('login');
    }
  };

  // 회원가입 페이지로 이동
  const handleRegister = () => {
    if (typeof window !== 'undefined') {
      openGamePopup('register');
    }
  };

  // 게스트로 계속하기
  const handleContinueAsGuest = () => {
    setPhase('done');
    onComplete?.();
  };

  // 스플래시 화면 렌더링
  if (phase === 'splash') {
    return (
      <motion.div 
        className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: fadeOut ? 0 : 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="splash-logo"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="logo-icon">🎮</div>
          <h1 className="logo-text">GamePlatform</h1>
        </motion.div>
        <div className="splash-loading">로딩 중...</div>
      </motion.div>
    );
  }

  // 로그인/회원가입 유도 화면 렌더링
  if (phase === 'auth') {
    return (
      <motion.div 
        className="auth-splash"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-splash-content">
          <h1 className="auth-splash-title">환영합니다!</h1>
          <p className="auth-splash-text">
            로그인하여 모든 기능을 이용하고 게임 진행 상황을 저장하세요.
          </p>

          {/* 테스트 계정 정보 */}
          <div className="test-account-info">
            <p className="test-account-title">테스트 계정 사용 가능:</p>
            <p className="test-account-creds">
              <span>아이디: test001</span>
              <span>비밀번호: 1234</span>
            </p>
          </div>
          
          <div className="auth-splash-buttons">
            <button 
              className="auth-splash-button login-button"
              onClick={handleLogin}
            >
              로그인
            </button>
            <button 
              className="auth-splash-button register-button"
              onClick={handleRegister}
            >
              회원가입
            </button>
          </div>
          
          <button 
            className="guest-button"
            onClick={handleContinueAsGuest}
          >
            게스트로 계속하기
          </button>
        </div>
      </motion.div>
    );
  }

  // 완료 시 빈 화면 반환
  return null;
}
