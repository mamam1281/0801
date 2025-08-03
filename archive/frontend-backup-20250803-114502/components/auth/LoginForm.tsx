'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Phone, Loader2, LogIn, Lock } from 'lucide-react';

interface LoginFormProps {
  onLogin?: (siteId: string, password: string) => void;
  onSwitchToSignup?: () => void;
  onSwitchToResetPassword?: () => void;
  isLoading?: boolean;
  error?: string;
  autoFillTestAccount?: boolean;
}

export default function LoginForm({ 
  onLogin, 
  onSwitchToSignup,
  onSwitchToResetPassword,
  isLoading: propIsLoading = false, 
  error: propError = '',
  autoFillTestAccount = false 
}: LoginFormProps) {
  const [siteId, setSiteId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [error, setError] = useState(propError);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 테스트 계정 자동 입력
  useEffect(() => {
    const useTestAccount = autoFillTestAccount || searchParams?.get('test') === 'true';
    if (useTestAccount) {
      setSiteId('testuser');
      setPassword('testpass123');
    }
  }, [autoFillTestAccount, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onLogin) {
      onLogin(siteId, password);
    } else {
      setIsLoading(true);
      try {
        // 백엔드 API 호출
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8002';
        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            site_id: siteId,
            password: password
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '로그인에 실패했습니다');
        }
        
        const data = await response.json();
        console.log('로그인 성공', data);
        
        // JWT 토큰 저장 (localStorage 또는 쿠키)
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('user_info', JSON.stringify(data.user));
        }
        
        // 로그인 후 메인 페이지로 이동
        alert(`환영합니다, ${data.user?.nickname || '사용자'}님!`);
        router.push('/games');
      } catch (error: any) {
        setError(error.message || '로그인에 실패했습니다. 사이트ID와 비밀번호를 확인해주세요.');
        console.error('로그인 실패', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="auth-content">
      <div className="auth-header-simple">
        <div className="auth-tab active">로그인</div>
        <div 
          className="auth-tab inactive" 
          onClick={onSwitchToSignup}
          style={{ cursor: 'pointer' }}
        >
          회원가입
        </div>
      </div>
      
      <div style={{ flex: 1 }}></div>
      
      <div className="game-platform-title">Game Platform</div>
      <div className="game-platform-subtitle">차세대 게임 경험의 시작</div>
      
      <div className="login-message">다시 오신 것을 환영합니다</div>
      <div className="login-help">게임에 로그인하여 시작하세요</div>
      
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="siteId" className="form-label">
            사이트ID
          </label>
          <div className="email-input-container">
            <User className="email-icon" size={16} />
            <input
              type="text"
              id="siteId"
              className="form-input email-input"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="사이트ID를 입력하세요"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            비밀번호
          </label>
          <div className="email-input-container">
            <Lock className="email-icon" size={16} />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="form-input email-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="auth-button"
          disabled={isLoading || !siteId || !password}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              로그인 중...
            </>
          ) : (
            <>
              <LogIn size={18} />
              로그인
            </>
          )}
        </button>
      </form>
      
      <div style={{ flex: 1 }}></div>
      
      <div className="bottom-info">
        안전하고 신뢰할 수 있는 게임 플랫폼
      </div>
    </div>
  );
}
