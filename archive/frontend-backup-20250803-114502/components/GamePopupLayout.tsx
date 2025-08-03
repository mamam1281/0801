'use client';

import React, { useEffect } from 'react';
import { closePopup, isPopupWindow } from '../utils/gamePopup';

interface GamePopupLayoutProps {
  children: React.ReactNode;
}

/**
 * 게임 팝업 창 전용 레이아웃
 * 독립적인 팝업 창에서 게임을 실행할 때 사용
 */
export default function GamePopupLayout({ 
  children
}: GamePopupLayoutProps) {
  useEffect(() => {
    // 팝업 창이 아닌 경우 경고
    if (!isPopupWindow()) {
      console.warn('GamePopupLayout should only be used in popup windows');
    }

    // 팝업 창 크기 최적화 (게임별 맞춤)
    const optimizePopupSize = () => {
      const path = window.location.pathname;
      const extraHeight = 80; // 브라우저 헤더 높이 고려
      
      try {
        if (path.includes('/games/gacha/popup')) {
          // 랜덤뽑기 팝업: 420x850
          window.resizeTo(420, 850 + extraHeight);
          console.log('랜덤뽑기 팝업 크기 설정: 420x930');
        } else if (path.includes('/games/rps/popup')) {
          // RPS 팝업: 420x650 (컴팩트)
          window.resizeTo(420, 650 + extraHeight);
          console.log('RPS 팝업 크기 설정: 420x730');
        } else if (path.includes('/games/slots/popup')) {
          // 슬롯 팝업: 420x850
          window.resizeTo(420, 850 + extraHeight);
          console.log('슬롯 팝업 크기 설정: 420x930');
        } else if (path.includes('/games/roulette/popup')) {
          // 룰렛 팝업: 420x850
          window.resizeTo(420, 850 + extraHeight);
          console.log('룰렛 팝업 크기 설정: 420x930');
        } else if (path.includes('/profile') && path.includes('popup')) {
          // 프로필 팝업: 420x850
          window.resizeTo(420, 850 + extraHeight);
          console.log('프로필 팝업 크기 설정: 420x930');
        }
      } catch (e) {
        console.warn('팝업 창 크기 변경 권한이 없습니다:', e);
      }
    };

    // 팝업 창 크기 보고
    const reportPopupSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      console.log(`� 게임 팝업 크기: 가로 ${width}px × 세로 ${height}px`);
    };

    // 초기 크기 최적화 및 보고
    optimizePopupSize();
    reportPopupSize();

    // 리사이즈 시 크기 보고
    window.addEventListener('resize', reportPopupSize);

    // ESC 키로 창 닫기
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopup();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', reportPopupSize);
    };
  }, []);

  return (
    <div className="game-popup-layout">
      {/* 팝업 창 전용 스타일 */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          background: var(--color-primary-dark-navy);
          font-family: var(--font-primary);
        }
        
        .game-popup-layout {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-primary-dark-navy);
          color: var(--color-text-primary);
          overflow: auto; /* 필요시 스크롤 허용 */
          padding: 0;
          margin: 0;
          min-height: 850px; /* 최소 높이를 850px로 설정 */
        }
        
        .game-popup-content {
          flex: 1; /* 전체 공간 사용 */
          overflow: visible; /* 컨텐츠 넘침 허용 */
          display: flex;
          flex-direction: column;
          padding: 0;
          margin: 0;
          min-height: 100%;
        }
      `}</style>

      {/* 게임 콘텐츠 - 전체 화면 사용 */}
      <div className="game-popup-content">
        {children}
      </div>
    </div>
  );
}
