'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// 프로젝트 표준 컴포넌트들만 사용
import Button from '../components/Button';
import QuickStartItem from '../components/QuickStartItem';
import LoadingSpinner from '../components/LoadingSpinner';
import SplashScreen from '../components/splash/SplashScreen';

// 게임 팝업 유틸리티
import { openGamePopup } from '../utils/gamePopup';

export default function CasinoDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  // 스플래시 화면을 표시한 적 있는지 체크
  useEffect(() => {
    const splashSeen = localStorage.getItem('splashSeen');
    if (splashSeen) {
      setHasSeenSplash(true);
    } else {
      // 첫 방문 시에만 스플래시 화면 표시
      localStorage.setItem('splashSeen', 'true');
    }

    // 프리미엄 그라디언트 애니메이션 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes premium-gradient-shift {
        0%, 100% { 
          background-position: 0% 50%; 
          filter: hue-rotate(0deg) saturate(1.2);
        }
        25% { 
          background-position: 25% 25%; 
          filter: hue-rotate(15deg) saturate(1.3);
        }
        50% { 
          background-position: 100% 50%; 
          filter: hue-rotate(30deg) saturate(1.4);
        }
        75% { 
          background-position: 75% 75%; 
          filter: hue-rotate(15deg) saturate(1.3);
        }
      }

      .cosmic-premium-bg {
        background-size: 400% 400% !important;
        animation: premium-gradient-shift 10s ease-in-out infinite !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // 스플래시 완료 후 콜백
  const handleSplashComplete = () => {
    setShowSplash(false);
    setIsLoading(false);
  };

  // 빠른 시작 액션들 - 일부 팝업으로 열기
  const quickActions = [
    {
      id: 'daily-reward',
      label: '오늘보상받기',
      iconPlaceholder: '🎁',
      iconBgColor: '#f1279dff',
      onClick: () => router.push('/wallet') // 월렛 페이지로 안내 (바텀네비 "내역"과 동일)
    },
    {
      id: 'model-site',
      label: '모델사이트',
      iconPlaceholder: '💎',
      iconBgColor: '#ffd30eff',
      onClick: () => window.open('https://md-2424.com', '_blank')
    },
    {
      id: 'popular-games',
      label: '방송보러가기',
      iconPlaceholder: '🔥',
      iconBgColor: '#eb2768ff',
      onClick: () => window.open('https://youtube.com', '_blank')// 게임 대시보드 페이지로 연결
    },
    {
      id: 'popular-games2',
      label: '이벤트안내',
      iconPlaceholder: '🎯',
      iconBgColor: '#02ccf0ff',
      onClick: () => window.open('/promotions') // 프로필 페이지로 연결
    }
  ];

  // 스플래시 화면 표시
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} skipAuth={hasSeenSplash} />;
  }

  // 일반 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#1a1a1a' }}>
        <LoadingSpinner size="xl" variant="ring" text="카지노 로딩 중..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full cosmic-premium-bg"
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 25%, #16213e 50%, #1a1a3a 75%, #0f0f23 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
        position: 'relative'
      }}>

      {/* 고급스러운 배경 오버레이 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      {/* Main Content - 스크롤 가능한 콘텐츠 */}
      <div className="w-full min-h-full relative z-10" style={{
        background: 'rgba(15, 15, 35, 0.3)',
        backdropFilter: 'blur(1px)'
      }}>

        <div className="py-2 sm:py-4">

          {/* 프리미엄 웰컴 섹션 */}
          <motion.div
            className="text-center"
            style={{ marginBottom: '24px', marginTop: '16px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '48px',
              fontWeight: 'bold',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, #c084fc 0%, #8b5cf6 20%, #7c3aed 40%, #6366f1 60%, #3b82f6 80%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              marginBottom: '12px',
              textShadow: '0 8px 32px rgba(192, 132, 252, 0.4)'
            }}>
              Welcome to MODELCASINO
            </h1>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '18px',
              color: '#ddd6fe',
              fontWeight: '500',
              letterSpacing: '0.025em',
              marginTop: '8px'
            }}>
              최고급 모델과 함께하는 특별한 시간
            </p>
          </motion.div>

          {/* 프리미엄 게임 섹션 */}
          <motion.section
            className="text-center py-8"
            style={{ marginBottom: '32px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h2 style={{
              fontSize: '24px',
              fontFamily: "'Inter', sans-serif",
              color: '#fde047',
              fontWeight: '700',
              letterSpacing: '0.02em',
              marginBottom: '24px',
              textShadow: '0 4px 16px rgba(253, 224, 71, 0.4)'
            }}>🎯 지금 바로 시작하세요</h2>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full max-w-full overflow-hidden">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/games')} // 게임 대시보드로 연결
              >
                🎮 게임시작하기
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => window.open('https://md-2424.com', '_blank')}
              >
                💎 모델사이트방문
              </Button>
              <Button
                variant="accent"
                size="lg"
                onClick={() => router.push('/wallet')} // 월렛 페이지로 연결
              >
                🎁 보너스 받기
              </Button>
            </div>
          </motion.section>

          {/* 빠른 시작 액션들 - 프로젝트 표준 컴포넌트 사용 */}
          <motion.section
            style={{ marginBottom: '120px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 style={{
              fontSize: '24px',
              fontFamily: "'Inter', sans-serif",
              color: '#60a5fa',
              fontWeight: '700',
              letterSpacing: '0.02em',
              marginBottom: '16px',
              textShadow: '0 4px 16px rgba(96, 165, 250, 0.4)'
            }}>⚡ 빠른 접속</h2>
            <div style={{ marginTop: '24px' }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-full overflow-hidden"
                style={{ gridAutoRows: '200px' }}>
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    className="w-full h-full"
                    style={{ height: '200px' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <QuickStartItem
                      id={action.id}
                      label={action.label}
                      iconPlaceholder={action.iconPlaceholder}
                      iconBgColor={action.iconBgColor}
                      onClick={action.onClick}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

        </div>
      </div>

    </div>
  );
}
