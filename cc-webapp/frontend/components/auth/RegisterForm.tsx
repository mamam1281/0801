'use client';

import { useState } from 'react';
import { User, Phone, ArrowRight, ArrowLeft, Loader2, Lock, Key, IdCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RegisterFormProps {
  onRegister?: (siteId: string, nickname: string, phoneNumber: string, password: string, inviteCode: string) => void;
  onSwitchToLogin?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function RegisterForm({ 
  onRegister, 
  onSwitchToLogin,
  isLoading: propIsLoading = false, 
  error: propError = '' 
}: RegisterFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [siteId, setSiteId] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [error, setError] = useState(propError);
  const router = useRouter();

  const validateSiteId = (id: string) => {
    // 사이트ID: 영문+숫자, 4-20자
    const siteIdRegex = /^[a-zA-Z0-9]{4,20}$/;
    return siteIdRegex.test(id);
  };

  const validatePhoneNumber = (phone: string) => {
    // 한국 전화번호 형식 검증 (010-0000-0000 또는 01000000000)
    const phoneRegex = /^010-?\d{4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/[^0-9-]/g, ''));
  };

  const validatePassword = (pwd: string) => {
    // 비밀번호: 6자 이상으로 완화
    return pwd.length >= 6;
  };

  const validateInviteCode = (code: string) => {
    // 초대코드: 6자 대문자+숫자
    return code.length === 6;
  };

  // ...existing code...

  const handleStep1Next = () => {
    if (!siteId) {
      setError('사이트ID를 입력해주세요');
      return;
    }
    if (!validateSiteId(siteId)) {
      setError('사이트ID는 영문과 숫자만 사용하여 4-20자로 입력해주세요');
      return;
    }
    if (!nickname) {
      setError('닉네임을 입력해주세요');
      return;
    }
    if (nickname.length < 2 || nickname.length > 50) {
      setError('닉네임은 2-50자로 입력해주세요');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!phoneNumber) {
      setError('전화번호를 입력해주세요');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setError('유효한 전화번호를 입력해주세요 (예: 010-1234-5678)');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요');
      return;
    }
    if (password.length < 4) {
      setError('비밀번호는 4자 이상 입력해주세요');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    setError('');
    setStep(3);
  };

  const handlePrevStep = () => {
    setError('');
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInviteCode(inviteCode)) {
      setError('초대코드 4자를 정확히 입력해주세요');
      return;
    }
    
    if (onRegister) {
      onRegister(siteId, nickname, phoneNumber, password, inviteCode);
    } else {
      setIsLoading(true);
      try {
        // 백엔드 API 호출
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
        
        // 회원가입 후 로그인 페이지로 이동
        alert('회원가입이 완료되었습니다! 로그인하세요.');
        if (onSwitchToLogin) {
          onSwitchToLogin();
        } else {
          router.push('/auth/login');
        }
      } catch (error: any) {
        setError(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
        console.error('회원가입 실패', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="auth-content register-content">
      <div className="auth-header-simple">
        <div 
          className="auth-tab inactive" 
          onClick={onSwitchToLogin}
          style={{ cursor: 'pointer' }}
        >
          로그인
        </div>
        <div className="auth-tab active">회원가입</div>
      </div>
      
      <div style={{ flex: 0.5 }}></div>
      
      <div className="game-platform-title">Game Platform</div>
      <div className="game-platform-subtitle">차세대 게임 경험의 시작</div>
      
      {/* 진행 상태 표시 */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          ></div>
        </div>
        <div className="progress-step">
          <span className="progress-step-text">
            {step}/3 단계
          </span>
        </div>
      </div>
      
      {/* 1단계: 사이트ID + 닉네임 */}
      {step === 1 ? (
        <>
          <div className="signup-title">계정 정보 입력</div>
          <div className="signup-subtitle">사이트ID와 닉네임을 입력하세요</div>
          
          <div className="simplified-form">
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="siteId" className="form-label">사이트ID (로그인용)</label>
              <div className="email-input-container">
                <IdCard className="email-icon" size={16} />
                <input
                  type="text"
                  id="siteId"
                  className="form-input email-input"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="영문+숫자 4-20자 (예: user123)"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="nickname" className="form-label">닉네임</label>
              <div className="email-input-container">
                <User className="email-icon" size={16} />
                <input
                  type="text"
                  id="nickname"
                  className="form-input email-input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  required
                  disabled={isLoading}
                  maxLength={50}
                  autoComplete="name"
                />
              </div>
            </div>
            
            <button
              type="button"
              className="auth-button"
              onClick={handleStep1Next}
              disabled={isLoading || !siteId || !nickname}
            >
              <span>다음</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      
      /* 2단계: 전화번호 + 비밀번호 */
      ) : step === 2 ? (
        <>
          <div className="signup-title">보안 정보 입력</div>
          <div className="signup-subtitle">전화번호와 비밀번호를 입력하세요</div>
          
          <div className="simplified-form">
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">전화번호</label>
              <div className="email-input-container">
                <Phone className="email-icon" size={16} />
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-input email-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-1234-5678"
                  required
                  disabled={isLoading}
                  autoComplete="tel"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">비밀번호</label>
              <div className="email-input-container">
                <Lock className="email-icon" size={16} />
                <input
                  type="password"
                  id="password"
                  className="form-input email-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="4자 이상 입력하세요"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="passwordConfirm" className="form-label">비밀번호 확인</label>
              <div className="email-input-container">
                <Lock className="email-icon" size={16} />
                <input
                  type="password"
                  id="passwordConfirm"
                  className="form-input email-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </div>
            
            <div className="auth-page-buttons">
              <button
                type="button"
                className="auth-button auth-back-button"
                onClick={handlePrevStep}
                disabled={isLoading}
              >
                <ArrowLeft size={16} />
                <span>이전</span>
              </button>
              
              <button
                type="button"
                className="auth-button auth-next-button"
                onClick={handleStep2Next}
                disabled={isLoading || !phoneNumber || !password || !passwordConfirm}
              >
                <span>다음</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      
      /* 3단계: 초대코드 */
      ) : (
        <>
          <div className="signup-title">초대코드 입력</div>
          <div className="signup-subtitle">초대코드를 입력하여 가입을 완료하세요</div>
          
          <form className="auth-form simplified-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="inviteCode" className="form-label">초대코드</label>
              <div className="email-input-container">
                <Key className="email-icon" size={16} />
                <input
                  type="text"
                  id="inviteCode"
                  className="form-input email-input"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="초대코드 4자 입력"
                  required
                  disabled={isLoading}
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
            
            <div className="auth-page-buttons">
              <button
                type="button"
                className="auth-button auth-back-button"
                onClick={handlePrevStep}
                disabled={isLoading}
              >
                <ArrowLeft size={16} />
                <span>이전</span>
              </button>
              
              <button
                type="submit"
                className="auth-button auth-next-button"
                disabled={isLoading || !inviteCode || inviteCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    가입 중...
                  </>
                ) : (
                  <>
                    <span>완료</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
      
      <div style={{ flex: 0.5 }}></div>
      
      <div className="bottom-info">
        안전하고 신뢰할 수 있는 게임 플랫폼
      </div>
    </div>
  );
}
