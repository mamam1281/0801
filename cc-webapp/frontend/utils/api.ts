/**
 * API 클라이언트 
 * 백엔드와의 통신을 처리하는 함수들
 */

const API_BASE_URL = 'http://localhost:8000'; // 백엔드 API 주소 (필요에 따라 수정)

// 토큰 관리
export const getTokens = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  return { accessToken, refreshToken };
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// 기본 API 요청 함수
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const { accessToken } = getTokens();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // 401 에러 시 토큰 리프레시 시도
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiRequest(endpoint, options); // 토큰 갱신 후 원래 요청 재시도
      } else {
        clearTokens(); // 리프레시 실패 시 토큰 제거
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || '요청 처리 중 오류가 발생했습니다.');
    }
    
    return data;
  } catch (error) {
    console.error('API 요청 오류:', error);
    throw error;
  }
};

// 토큰 갱신 함수
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const { refreshToken } = getTokens();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.access_token, refreshToken); // 리프레시 토큰은 유지
    return true;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return false;
  }
};

// 인증 관련 API 함수들
export const authApi = {
  // 로그인
  login: async (siteId: string, password: string, deviceInfo?: string) => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ site_id: siteId, password, device_info: deviceInfo })
    });
  },
  
  // 회원가입
  register: async (inviteCode: string, nickname: string, siteId: string, phoneNumber: string, password: string) => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        invite_code: inviteCode,
        nickname, 
        site_id: siteId, 
        phone_number: phoneNumber, 
        password 
      })
    });
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // 로그아웃
  logout: async () => {
    return await apiRequest('/auth/logout', { method: 'POST' });
  },

  // 모든 세션 로그아웃
  logoutAll: async () => {
    return await apiRequest('/auth/logout-all', { method: 'POST' });
  },

  // 초대코드 확인
  checkInviteCode: async (code: string) => {
    return await apiRequest(`/auth/check-invite/${code}`);
  },

  // 초대코드 생성 (관리자 전용)
  createInviteCodes: async (count: number = 1) => {
    return await apiRequest('/auth/admin/create-invite', {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  },

  // 인증 시스템 헬스 체크
  healthCheck: async () => {
    return await apiRequest('/auth/health');
  }
};

export default apiRequest;
