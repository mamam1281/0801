'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { openGamePopup } from '../../utils/gamePopup';

interface AuthNavProps {
  isPopup?: boolean;
}

export default function AuthNav({ isPopup = false }: AuthNavProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoggedIn(false);
          return;
        }

        // 토큰이 존재하면 사용자 정보 가져오기 시도
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setIsLoggedIn(true);
          setNickname(userData.nickname);
        } else {
          // 토큰이 유효하지 않으면 로그아웃 처리
          localStorage.removeItem('accessToken');
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    router.push('/');
  };

  const openAuthPopup = (type: 'login' | 'register' | 'profile') => {
    if (isPopup) {
      // 이미 팝업 내부에서는 현재 창에서 이동
      router.push(`/auth/${type === 'profile' ? '../profile' : type}`);
    } else {
      // 메인 창에서는 새 팝업으로 열기
      openGamePopup(type);
    }
  };

  // 인라인 스타일 정의 (청크 로드 오류 해결을 위해)
  const styles = {
    authNav: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    authButtons: {
      display: 'flex',
      gap: '8px',
    },
    loggedIn: {
      gap: '12px',
    },
    authNavButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      backgroundColor: 'rgba(91, 48, 246, 0.1)',
      color: 'white',
      border: '1px solid rgba(91, 48, 246, 0.3)',
    },
    loginButton: {
      backgroundColor: '#5b30f6', // var(--neon-purple-3)
      color: 'white',
      border: 'none',
    },
    registerButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    },
    userAvatar: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: 'linear-gradient(45deg, #870dd1, #5b30f6)', // var(--neon-gradient-2)
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 600,
    },
    userName: {
      maxWidth: '80px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    logoutButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: 'rgba(239, 68, 68, 0.9)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    }
  };

  return (
    <div style={styles.authNav}>
      {isLoggedIn ? (
        <div style={{...styles.authButtons, ...styles.loggedIn}}>
          <button 
            style={{...styles.authNavButton}}
            onClick={() => openAuthPopup('profile')}
          >
            <span style={styles.userAvatar}>{nickname[0]?.toUpperCase()}</span>
            <span style={styles.userName}>{nickname}</span>
          </button>
          <button 
            style={{...styles.authNavButton, ...styles.logoutButton}}
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div style={styles.authButtons}>
          <button 
            style={{...styles.authNavButton, ...styles.loginButton}}
            onClick={() => openAuthPopup('login')}
          >
            로그인
          </button>
          <button 
            style={{...styles.authNavButton, ...styles.registerButton}}
            onClick={() => openAuthPopup('register')}
          >
            회원가입
          </button>
        </div>
      )}
    </div>
  );
}
