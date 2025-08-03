'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DailyCheckInContextType {
  showDailyCheckIn: boolean;
  setShowDailyCheckIn: (show: boolean) => void;
  lastCheckIn: string | null;
  setLastCheckIn: (date: string | null) => void;
  handleDailyCheckInClaim: (day: number) => void;
}

const DailyCheckInContext = createContext<DailyCheckInContextType | undefined>(undefined);

export function DailyCheckInProvider({ children }: { children: ReactNode }) {
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  
  // 초기화: localStorage에서 마지막 체크인 날짜를 가져옵니다
  useEffect(() => {
    const storedLastCheckIn = localStorage.getItem('lastDailyCheckIn');
    setLastCheckIn(storedLastCheckIn);
    
    // 오늘 날짜 (YYYY-MM-DD 형식)
    const today = new Date().toISOString().split('T')[0];
    
    // 마지막 체크인이 오늘이 아니면 모달 표시 (하루에 한 번만)
    if (storedLastCheckIn !== today) {
      // 2초 후에 모달 표시 (사용자 경험 개선)
      const timer = setTimeout(() => {
        setShowDailyCheckIn(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDailyCheckInClaim = (day: number) => {
    // 오늘 날짜를 마지막 체크인으로 저장
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastDailyCheckIn', today);
    setLastCheckIn(today);
    
    // 모달 닫기
    setShowDailyCheckIn(false);
    
    // 보상 획득 로그
    console.log(`Day ${day} claimed! Reward: ${50 * day} 💎`);
  };

  return (
    <DailyCheckInContext.Provider 
      value={{ 
        showDailyCheckIn, 
        setShowDailyCheckIn, 
        lastCheckIn, 
        setLastCheckIn,
        handleDailyCheckInClaim 
      }}
    >
      {children}
    </DailyCheckInContext.Provider>
  );
}

export function useDailyCheckIn() {
  const context = useContext(DailyCheckInContext);
  
  if (context === undefined) {
    throw new Error('useDailyCheckIn must be used within a DailyCheckInProvider');
  }
  
  return context;
}
