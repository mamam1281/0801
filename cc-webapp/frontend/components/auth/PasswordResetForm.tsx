'use client';

import { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

interface PasswordResetFormProps {
  onResetPassword?: (email: string) => void;
  onSwitchToLogin?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function PasswordResetForm({
  onResetPassword,
  onSwitchToLogin,
  isLoading: propIsLoading = false,
  error: propError = '',
}: PasswordResetFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [error, setError] = useState(propError);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onResetPassword) {
      onResetPassword(email);
    } else {
      setIsLoading(true);
      try {
        // 실제로는 API 호출
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('비밀번호 재설정 이메일 발송 성공', { email });
        setIsSent(true);
      } catch (err) {
        console.error('비밀번호 재설정 실패', err);
        setError('이메일 전송에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="auth-content">
      <div className="auth-header-simple">
        <div 
          className="auth-tab inactive" 
          onClick={onSwitchToLogin}
          style={{ cursor: 'pointer' }}
        >
          로그인
        </div>
        <div className="auth-tab active">비밀번호 찾기</div>
      </div>
      
      <div className="game-platform-title">Game Platform</div>
      <div className="game-platform-subtitle">차세대 게임 경험의 시작</div>
      
      {!isSent ? (
        <>
          <div className="signup-title">비밀번호 재설정</div>
          <div className="signup-subtitle">가입한 이메일 주소를 입력하세요</div>
          
          <div className="email-icon-container">
            <div className="email-icon">
              <Mail size={24} />
            </div>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">이메일 주소</label>
              <div className="email-input-container">
                <Mail className="email-icon" size={16} />
                <input
                  type="email"
                  id="email"
                  className="form-input email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="auth-page-buttons">
              <button
                type="button"
                className="auth-button auth-back-button"
                onClick={onSwitchToLogin}
                disabled={isLoading}
              >
                <ArrowLeft size={16} />
                <span>돌아가기</span>
              </button>
              
              <button
                type="submit"
                className="auth-button auth-next-button"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <span>전송하기</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="email-verification-container">
          <div className="email-icon-large">
            <CheckCircle size={32} color="#6246EA" />
          </div>
          <div className="email-verification-title">이메일이 발송되었습니다</div>
          <div className="email-verification-subtitle">
            {email}로 비밀번호 재설정 링크가 전송되었습니다.<br />
            이메일을 확인하여 절차를 완료하세요.
          </div>
          
          <div className="password-reset-help">
            이메일을 받지 못하셨나요? 스팸함을 확인하시거나, 
            다시 시도해 주세요.
          </div>
          
          <button
            type="button"
            className="auth-button"
            onClick={onSwitchToLogin}
            style={{ marginTop: '24px' }}
          >
            <span>로그인으로 돌아가기</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      
      <div className="bottom-info">
        안전하고 신뢰할 수 있는 게임 플랫폼
      </div>
    </div>
  );
}
