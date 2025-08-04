'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import PasswordResetForm from './PasswordResetForm';

type AuthMode = 'login' | 'signup' | 'reset-password';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchMode = (mode: AuthMode) => {
    setError('');
    setAuthMode(mode);
  };

  const handleLogin = async (siteId: string, password: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8002';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ site_id: siteId, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '로그인에 실패했습니다');
      }
      
      const data = await response.json();
      console.log('로그인 성공', data);
      // 로그인 처리 - 실제로는 토큰 저장 등
    } catch (err: any) {
      console.error('로그인 실패', err);
      setError(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (siteId: string, nickname: string, phoneNumber: string, password: string, inviteCode: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8002';
      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site_id: siteId,
          nickname,
          phone_number: phoneNumber,
          password,
          invite_code: inviteCode
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '회원가입에 실패했습니다');
      }
      
      const data = await response.json();
      console.log('회원가입 성공', data);
      // 회원가입 처리 - 실제로는 토큰 저장 등
    } catch (err: any) {
      console.error('회원가입 실패', err);
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('비밀번호 재설정 요청 성공', { email });
      // 비밀번호 재설정 처리
    } catch (err) {
      console.error('비밀번호 재설정 요청 실패', err);
      setError('비밀번호 재설정 요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container popup-mode">
      {authMode === 'login' && (
        <LoginForm 
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error}
          onSwitchToSignup={() => handleSwitchMode('signup')}
          onSwitchToResetPassword={() => handleSwitchMode('reset-password')}
        />
      )}
      
      {authMode === 'signup' && (
        <RegisterForm
          onRegister={handleRegister}
          isLoading={isLoading}
          error={error}
          onSwitchToLogin={() => handleSwitchMode('login')}
        />
      )}
      
      {authMode === 'reset-password' && (
        <PasswordResetForm
          onResetPassword={handleResetPassword}
          isLoading={isLoading}
          error={error}
          onSwitchToLogin={() => handleSwitchMode('login')}
        />
      )}
    </div>
  );
}
