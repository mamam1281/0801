/**
 * API 클라이언트
 * 백엔드와의 통신을 처리하는 함수들
 */

// 환경에 따른 백엔드 API 주소 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 개발 모드 여부 확인
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * API 로깅 유틸리티
 * 개발 단계에서만 동작하며, 프로덕션 빌드에서는 자동으로 제거됨
 */
export const apiLogger = {
  /**
   * API 요청 시작 로깅
   * @param method HTTP 메소드
   * @param endpoint API 엔드포인트
   * @param data 요청 데이터
   */
  request: (method, endpoint, data) => {
    if (IS_DEV) {
      const timestamp = new Date().toLocaleTimeString('ko-KR');
      console.group(`%c🚀 API 요청 [${timestamp}]`, 'color: #e6005e; font-weight: bold;');
      console.log(`%c📍 ${method} ${endpoint}`, 'color: #ff69b4;');
      if (data) console.log('%c📦 요청 데이터:', 'color: #666;', data);
      console.groupEnd();
    }
  },

  /**
   * API 응답 로깅
   * @param method HTTP 메소드
   * @param endpoint API 엔드포인트
   * @param status HTTP 상태 코드
   * @param data 응답 데이터
   * @param duration 요청-응답 소요 시간(ms)
   */
  response: (method, endpoint, status, data, duration) => {
    if (IS_DEV) {
      const timestamp = new Date().toLocaleTimeString('ko-KR');
      const isSuccess = status >= 200 && status < 400;

      console.group(
        `%c${isSuccess ? '✅' : '❌'} API 응답 [${timestamp}]`,
        `color: ${isSuccess ? '#4CAF50' : '#F44336'}; font-weight: bold;`
      );
      console.log(`%c📍 ${method} ${endpoint}`, 'color: #ff69b4;');
      console.log(`%c📊 상태: ${status}`, `color: ${isSuccess ? '#4CAF50' : '#F44336'};`);
      console.log(`%c⏱️ 소요 시간: ${duration}ms`, 'color: #666;');
      console.log('%c📦 응답 데이터:', 'color: #666;', data);
      console.groupEnd();
    }
  },

  /**
   * API 에러 로깅
   * @param method HTTP 메소드
   * @param endpoint API 엔드포인트
   * @param error 에러 객체
   */
  error: (method, endpoint, error) => {
    if (IS_DEV) {
      const timestamp = new Date().toLocaleTimeString('ko-KR');

      console.group('%c❌ API 에러 [' + timestamp + ']', 'color: #F44336; font-weight: bold;');
      console.log(`%c📍 ${method} ${endpoint}`, 'color: #ff69b4;');
      console.error('%c💥 에러 내용:', 'color: #F44336;', error);
      console.groupEnd();
    }
  }
};

// 토큰 관리
export const getTokens = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  return { accessToken, refreshToken };
};

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// 인증 상태 확인
export const isAuthenticated = () => {
  const { accessToken } = getTokens();
  return !!accessToken;
};

// 기본 API 요청 함수
const apiRequest = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const requestData = options.body ? JSON.parse(options.body) : undefined;
  const startTime = Date.now();

  try {
    // 요청 로깅
    apiLogger.request(method, endpoint, requestData);

    const { accessToken } = getTokens();

    const authHeader = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
      credentials: 'include',
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        // apiLogger를 사용하여 로깅 (중복 제거)
        apiLogger.response(method, endpoint, response.status, data, duration);
        
        // 직접 데이터 반환 (data.data가 아닌 data)
        return data;
      }
      return null;
    }
    
    // 401 에러 시 토큰 리프레시 시도
    if (response.status === 401) {
      apiLogger.error(method, endpoint, '인증 토큰이 만료되었습니다. 토큰 갱신 시도 중...');

      const refreshed = await refreshAccessToken();
      if (refreshed) {
        apiLogger.request(method, endpoint, requestData);
        return apiRequest(endpoint, options); // 토큰 갱신 후 원래 요청 재시도
      } else {
        clearTokens(); // 리프레시 실패 시 토큰 제거
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    // 응답이 JSON이 아닐 경우 대비
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const duration = Date.now() - startTime;
      apiLogger.response(method, endpoint, response.status, { error: 'JSON 파싱 오류' }, duration);
      throw new Error('서버 응답을 처리할 수 없습니다. 형식이 올바르지 않습니다.');
    }

    const duration = Date.now() - startTime;

    // 응답 로깅
    apiLogger.response(method, endpoint, response.status, data, duration);

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || '요청 처리 중 오류가 발생했습니다.';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // 에러 로깅
    apiLogger.error(method, endpoint, error);
    throw error;
  }
};

// 토큰 갱신 함수
export const refreshAccessToken = async () => {
  const startTime = Date.now();
  const endpoint = '/api/auth/refresh';
  const method = 'POST';

  try {
    apiLogger.request(method, endpoint, { message: '토큰 갱신 시도 중...' });

    const { refreshToken } = getTokens();
    if (!refreshToken) {
      apiLogger.error(method, endpoint, '리프레시 토큰이 없습니다.');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      apiLogger.error(method, endpoint, '토큰 갱신 실패: 서버 응답 에러');
      return false;
    }

    apiLogger.response(method, endpoint, response.status, { message: '토큰 갱신 성공' }, duration);

    setTokens(data.access_token, refreshToken); // 리프레시 토큰은 유지
    return true;
  } catch (error) {
    apiLogger.error(method, endpoint, error);
    return false;
  }
};

// 인증 관련 API 함수들
export const authApi = {
  // 로그인
  login: async (siteId, password, deviceInfo) => {
    return await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ site_id: siteId, password, device_info: deviceInfo })
    });
  },

  // 회원가입
  register: async (inviteCode, nickname, siteId, phoneNumber, password) => {
    return await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        invite_code: inviteCode,
        nickname,
        site_id: SiteId,
        phone_number: phoneNumber,
        password
      })
    });
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    return await apiRequest('/api/auth/me');
  },

  // 로그아웃
  logout: async () => {
    return await apiRequest('/api/auth/logout', { method: 'POST' });
  },

  // 모든 세션 로그아웃
  logoutAll: async () => {
    return await apiRequest('/api/auth/logout-all', { method: 'POST' });
  },

  // 초대코드 확인
  checkInviteCode: async (code) => {
    return await apiRequest(`/api/auth/check-invite/${code}`);
  },

  // 초대코드 생성 (관리자 전용)
  createInviteCodes: async (count = 1) => {
    return await apiRequest('/api/auth/admin/create-invite', {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  },

  // 인증 시스템 헬스 체크
  healthCheck: async () => {
    return await apiRequest('/api/auth/health');
  }
};

// 사용자 관련 API 함수들
export const userApi = {
  // 사용자 프로필 조회
  getProfile: async () => {
    return await apiRequest('/api/users/profile');
  },

  // 사용자 통계 조회
  getStats: async () => {
    return await apiRequest('/api/users/stats');
  },

  // 사용자 잔액 조회
  getBalance: async () => {
    return await apiRequest('/api/users/balance');
  }
};

// 게임 관련 API 함수들
export const gameApi = {
  // 게임 목록 조회
  getGames: async () => {
    const response = await apiRequest('/api/games');
    // 응답이 이미 데이터 배열인 경우 그대로 반환
    return response;
  },

  // 게임 액션 수행
  playAction: async (gameId, action) => {
    return await apiRequest(`/api/actions/${gameId}`, {
      method: 'POST',
      body: JSON.stringify(action)
    });
  },

  // 보상 수령
  claimReward: async (rewardId) => {
    return await apiRequest(`/api/rewards/${rewardId}/claim`, {
      method: 'POST'
    });
  }
};

export default apiRequest;
