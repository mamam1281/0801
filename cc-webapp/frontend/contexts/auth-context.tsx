'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// 사용자 정보 타입
export interface UserProfile {
  id: number;
  site_id: string;
  nickname: string;
  phone_number: string;
  cyber_token_balance: number;
  is_active: boolean;
  is_admin: boolean;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  last_login?: string;
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (siteId: string, password: string) => Promise<void>;
  register: (data: {
    invite_code: string;
    nickname: string;
    site_id: string;
    phone_number: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkInviteCode: (code: string) => Promise<boolean>;
  error: string | null;
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 인증 제공자 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 로컬 스토리지에서 토큰 가져오기
  const getStoredTokens = () => {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
    };
  };

  // 사용자 정보 불러오기
  const loadUser = async () => {
    try {
      const { accessToken } = getStoredTokens();
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      const response = await authApi.getMe();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser(null);
      setIsAuthenticated(false);
      // 토큰 만료 처리는 api-client 인터셉터에서 처리
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    loadUser();
  }, []);

  // 로그인 함수
  const login = async (site_id: string, password: string) => {
    setError(null);
    try {
      setIsLoading(true);
      const response = await authApi.login({ site_id, password });
      const { access_token, refresh_token } = response.data;
      
      // 토큰 저장
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // 사용자 정보 로드
      await loadUser();
      
      // 홈으로 이동
      router.push('/');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 함수
  const register = async (data: {
    invite_code: string;
    nickname: string;
    site_id: string;
    phone_number: string;
    password: string;
  }) => {
    setError(null);
    try {
      setIsLoading(true);
      const response = await authApi.register(data);
      const { access_token, refresh_token } = response.data;
      
      // 토큰 저장
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // 사용자 정보 로드
      await loadUser();
      
      // 홈으로 이동
      router.push('/');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    setError(null);
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // 로컬 토큰 삭제
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // 상태 초기화
      setUser(null);
      setIsAuthenticated(false);
      
      // 로그인 페이지로 이동
      router.push('/auth/login');
    }
  };

  // 모든 세션 로그아웃
  const logoutAll = async () => {
    setError(null);
    try {
      await authApi.logoutAll();
    } catch (err) {
      console.error('Logout all failed:', err);
    } finally {
      // 로컬 토큰 삭제
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // 상태 초기화
      setUser(null);
      setIsAuthenticated(false);
      
      // 로그인 페이지로 이동
      router.push('/auth/login');
    }
  };

  // 초대코드 확인
  const checkInviteCode = async (code: string): Promise<boolean> => {
    try {
      const response = await authApi.checkInviteCode(code);
      return response.data.is_valid;
    } catch (err) {
      console.error('Invite code check failed:', err);
      return false;
    }
  };

  // 컨텍스트 값
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    logoutAll,
    checkInviteCode,
    error,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// 인증 컨텍스트 사용 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
