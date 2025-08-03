/**
 * 프론트엔드 초대코드 인증 시스템 테스트
 * useUser 훅 및 InviteCodeRegister 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider, useUser, hasRankAccess } from '../hooks/useUser';
import { InviteCodeRegister } from '../components/auth/InviteCodeRegister';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

describe('hasRankAccess 유틸리티', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('VIP는 모든 랭크에 접근 가능', () => {
    expect(hasRankAccess('VIP', 'STANDARD')).toBe(true);
    expect(hasRankAccess('VIP', 'PREMIUM')).toBe(true);
    expect(hasRankAccess('VIP', 'VIP')).toBe(true);
  });

  test('PREMIUM은 STANDARD와 PREMIUM에 접근 가능', () => {
    expect(hasRankAccess('PREMIUM', 'STANDARD')).toBe(true);
    expect(hasRankAccess('PREMIUM', 'PREMIUM')).toBe(true);
    expect(hasRankAccess('PREMIUM', 'VIP')).toBe(false);
  });

  test('STANDARD는 STANDARD에만 접근 가능', () => {
    expect(hasRankAccess('STANDARD', 'STANDARD')).toBe(true);
    expect(hasRankAccess('STANDARD', 'PREMIUM')).toBe(false);
    expect(hasRankAccess('STANDARD', 'VIP')).toBe(false);
  });

  test('잘못된 랭크는 기본값으로 처리', () => {
    expect(hasRankAccess('INVALID', 'VIP')).toBe(false);
    expect(hasRankAccess('VIP', 'INVALID')).toBe(true); // VIP는 모든 것에 접근
  });
});

describe('useUser 훅', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('초기 상태에서 사용자가 null', () => {
    const TestComponent = () => {
      const { user } = useUser();
      return <div>{user ? user.nickname : 'No user'}</div>;
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByText('No user')).toBeInTheDocument();
  });

  test('localStorage에서 사용자 정보 복원', () => {
    const mockUser = {
      id: 1,
      nickname: '테스트유저',
      rank: 'VIP',
      cyber_token_balance: 1000,
      created_at: '2025-06-20T12:00:00Z'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

    const TestComponent = () => {
      const { user, isVIP, isPremium } = useUser();
      return (
        <div>
          <span data-testid="nickname">{user?.nickname}</span>
          <span data-testid="rank">{user?.rank}</span>
          <span data-testid="isVIP">{isVIP ? 'true' : 'false'}</span>
          <span data-testid="isPremium">{isPremium ? 'true' : 'false'}</span>
        </div>
      );
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    expect(screen.getByTestId('nickname')).toHaveTextContent('테스트유저');
    expect(screen.getByTestId('rank')).toHaveTextContent('VIP');
    expect(screen.getByTestId('isVIP')).toHaveTextContent('true');
    expect(screen.getByTestId('isPremium')).toHaveTextContent('true');
  });

  test('사용자 설정 시 localStorage에 저장', () => {
    const TestComponent = () => {
      const { setUser } = useUser();
      
      const handleSetUser = () => {
        setUser({
          id: 2,
          nickname: '새유저',
          rank: 'PREMIUM',
          cyber_token_balance: 500,
          created_at: '2025-06-20T12:00:00Z'
        });
      };

      return <button onClick={handleSetUser}>Set User</button>;
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    fireEvent.click(screen.getByText('Set User'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({
        id: 2,
        nickname: '새유저',
        rank: 'PREMIUM',
        cyber_token_balance: 500,
        created_at: '2025-06-20T12:00:00Z'
      })
    );
  });

  test('로그아웃 시 localStorage에서 제거', () => {
    const TestComponent = () => {
      const { logout } = useUser();
      return <button onClick={logout}>Logout</button>;
    };

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    fireEvent.click(screen.getByText('Logout'));

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });
});

describe('InviteCodeRegister 컴포넌트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('초대코드와 닉네임 입력 필드가 렌더링됨', () => {
    render(<InviteCodeRegister />);

    expect(screen.getByLabelText('초대코드')).toBeInTheDocument();
    expect(screen.getByLabelText('닉네임')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '코드 확인' })).toBeInTheDocument();
  });

  test('초대코드 입력 시 자동으로 대문자 변환', () => {
    render(<InviteCodeRegister />);

    const inviteCodeInput = screen.getByLabelText('초대코드');
    fireEvent.change(inviteCodeInput, { target: { value: 'vip2024' } });

    expect(inviteCodeInput.value).toBe('VIP2024');
  });

  test('필수 필드 미입력 시 버튼 비활성화', () => {
    render(<InviteCodeRegister />);

    const submitButton = screen.getByRole('button', { name: '코드 확인' });
    expect(submitButton).toBeDisabled();

    // 초대코드만 입력
    fireEvent.change(screen.getByLabelText('초대코드'), { target: { value: 'VIP2024' } });
    expect(submitButton).toBeDisabled();

    // 닉네임도 입력
    fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: '테스트유저' } });
    expect(submitButton).not.toBeDisabled();
  });

  test('성공적인 가입 플로우', async () => {
    const mockUser = {
      id: 1,
      nickname: '테스트유저',
      rank: 'VIP',
      cyber_token_balance: 200,
      created_at: '2025-06-20T12:00:00Z'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const onSuccess = jest.fn();
    render(<InviteCodeRegister onSuccess={onSuccess} />);

    // 폼 입력
    fireEvent.change(screen.getByLabelText('초대코드'), { target: { value: 'VIP2024' } });
    fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: '테스트유저' } });

    // 제출
    fireEvent.click(screen.getByRole('button', { name: '코드 확인' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invite_code: 'VIP2024',
          nickname: '테스트유저'
        }),
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });

  test('가입 실패 시 에러 메시지 표시', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: '잘못된 초대코드입니다' }),
    });

    render(<InviteCodeRegister />);

    // 폼 입력
    fireEvent.change(screen.getByLabelText('초대코드'), { target: { value: 'WRONG1' } });
    fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: '테스트유저' } });

    // 제출
    fireEvent.click(screen.getByRole('button', { name: '코드 확인' }));

    await waitFor(() => {
      expect(screen.getByText('잘못된 초대코드입니다')).toBeInTheDocument();
    });
  });

  test('데모용 초대코드 표시', () => {
    render(<InviteCodeRegister />);

    expect(screen.getByText('VIP2024')).toBeInTheDocument();
    expect(screen.getByText('DEMO99')).toBeInTheDocument();
    expect(screen.getByText('TEST01')).toBeInTheDocument();
  });

  test('VIP 멤버십 혜택 안내 표시', () => {
    render(<InviteCodeRegister />);

    expect(screen.getByText('💎 VIP 멤버십 혜택')).toBeInTheDocument();
    expect(screen.getByText('• 독점 게임 및 콘텐츠 접근')).toBeInTheDocument();
    expect(screen.getByText('• 프리미엄 보상 및 혜택')).toBeInTheDocument();
    expect(screen.getByText('• VIP 전용 고객 지원')).toBeInTheDocument();
  });
});

describe('랭크별 컴포넌트 접근 제어', () => {
  test('VIP 전용 컴포넌트 접근 테스트', () => {
    const VIPComponent = () => {
      const { user, isVIP } = useUser();
      
      if (!isVIP) {
        return <div>VIP 전용 콘텐츠입니다</div>;
      }
      
      return <div>VIP 대시보드</div>;
    };

    // VIP 사용자 Mock
    const mockVIPUser = {
      id: 1,
      nickname: 'VIP유저',
      rank: 'VIP',
      cyber_token_balance: 1000,
      created_at: '2025-06-20T12:00:00Z'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockVIPUser));

    render(
      <UserProvider>
        <VIPComponent />
      </UserProvider>
    );

    expect(screen.getByText('VIP 대시보드')).toBeInTheDocument();
  });

  test('일반 사용자의 VIP 콘텐츠 접근 차단', () => {
    const VIPComponent = () => {
      const { user, isVIP } = useUser();
      
      if (!isVIP) {
        return <div>VIP 전용 콘텐츠입니다</div>;
      }
      
      return <div>VIP 대시보드</div>;
    };

    // STANDARD 사용자 Mock
    const mockStandardUser = {
      id: 1,
      nickname: '일반유저',
      rank: 'STANDARD',
      cyber_token_balance: 200,
      created_at: '2025-06-20T12:00:00Z'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStandardUser));

    render(
      <UserProvider>
        <VIPComponent />
      </UserProvider>
    );

    expect(screen.getByText('VIP 전용 콘텐츠입니다')).toBeInTheDocument();
  });
});
