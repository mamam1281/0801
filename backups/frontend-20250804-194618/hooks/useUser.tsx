'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: number;
  nickname: string;
  rank: 'VIP' | 'PREMIUM' | 'STANDARD';
  cyber_token_balance: number;
  created_at: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isVIP: boolean;
  isPremium: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 로컬스토리지에서 사용자 정보 복원
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('사용자 정보 복원 실패:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const isVIP = user?.rank === 'VIP';
  const isPremium = user?.rank === 'PREMIUM' || isVIP;

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: handleSetUser,
        logout,
        isVIP,
        isPremium,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser는 UserProvider 내에서 사용해야 합니다');
  }
  return context;
}

// 랭크별 접근 권한 체크 유틸리티
export function hasRankAccess(userRank: string, requiredRank: string): boolean {
  const rankHierarchy = {
    'VIP': 3,
    'PREMIUM': 2,
    'STANDARD': 1
  };

  const userLevel = rankHierarchy[userRank as keyof typeof rankHierarchy] || 1;
  const requiredLevel = rankHierarchy[requiredRank as keyof typeof rankHierarchy] || 1;

  return userLevel >= requiredLevel;
}
