import { apiLogTry, apiLogSuccess, apiLogFail } from './apiLogger';
import { getTokens, getAccessToken, setTokens, clearTokens } from './tokenStorage';

// Raw base URL from env (can include /api). We normalize to avoid // or /api/api duplication.
const _RAW_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function normalizeBase(url) {
  if (!url) return '';
  // trim whitespace
  let u = url.trim();
  // remove trailing slashes
  u = u.replace(/\/+$/,'');
  // collapse accidental repeated /api segments (e.g., http://host/api/api -> http://host/api)
  u = u.replace(/(\/api)+(\/)?$/i, '/api');
  return u;
}

let API_BASE_URL = normalizeBase(_RAW_API_BASE);

// Developer guard: if code later concatenates endpoint starting with /api and base already ends with /api, that's fine.
// But if an endpoint ALSO includes /api at its start and base does NOT end with /api, it's still fine.
// The problematic case was base containing /api AND endpoints also containing /api leading to double segment after earlier naive concatenation.
// We detect at runtime and warn once if duplicate would occur.
let _warnedDuplicate = false;
function joinUrl(base, endpoint){
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint; // absolute override
  // Ensure endpoint starts with /
  const ep = endpoint.startsWith('/') ? endpoint : ('/' + endpoint);
  // If base already ends with /api and endpoint starts with /api/, avoid duplicating.
  if (/\/api$/i.test(base) && /^\/api\//i.test(ep)) {
    if (!_warnedDuplicate) {
      // eslint-disable-next-line no-console
      console.warn('[apiClient] Detected base URL ending with /api and endpoint beginning with /api – preventing duplication. Endpoint:', ep);
      _warnedDuplicate = true;
    }
    return base + ep.replace(/^\/api/, '');
  }
  return base + ep;
}

/**
 * API 클라이언트
 * 백엔드와의 통신을 처리하는 함수들
 */

// 인증 헤더 생성
const getAuthHeaders = () => {
  const accessToken = getAccessToken();
  console.log('액세스 토큰 확인:', accessToken ? '토큰 있음' : '토큰 없음');
  return accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
};

// 기본 API 요청 함수
const apiRequest = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const requestData = options.body ? JSON.parse(options.body) : undefined;

  // API 요청 로그
  apiLogTry(`${method} ${endpoint}`);

  const startTime = Date.now();

  // 인증 헤더 디버깅
  const authHeaders = getAuthHeaders();
  console.log(`API 요청 토큰 확인 - ${endpoint}:`, authHeaders);

  try {
  const url = joinUrl(API_BASE_URL, endpoint);
    console.log(`API 요청 URL: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // API 성공 로그
        apiLogSuccess(`${method} ${endpoint}`, { 
          status: response.status,
          duration: `${duration}ms`,
          data 
        });

        return data;
      }
      return null;
    }

    // 401 인증 오류 처리
    if (response.status === 401) {
      console.error('인증 오류 발생 (401):', endpoint);
      console.error('현재 토큰 정보:', getTokens() ? '토큰 존재' : '토큰 없음');

      // 리프레시 토큰을 사용해 액세스 토큰 갱신 시도
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // 토큰 갱신 성공, 원래 요청 재시도
        console.log('토큰 갱신 성공, 요청 재시도:', endpoint);
        return apiRequest(endpoint, options);
      } else {
        console.error('토큰 갱신 실패, 인증 필요');
        // 여기서 로그인 페이지로 리디렉션하거나 인증 관련 처리
        clearTokens(); // 잘못된 토큰 제거
        throw new Error('인증이 필요합니다. 로그인 후 다시 시도해주세요.');
      }
    }

    // 에러 응답 처리
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      apiLogFail(`${method} ${endpoint}`, 'JSON 파싱 오류');
      throw new Error('서버 응답을 처리할 수 없습니다.');
    }

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || '요청 처리 중 오류가 발생했습니다.';
      apiLogFail(`${method} ${endpoint}`, errorMessage);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    apiLogFail(`${method} ${endpoint}`, error.message);
    throw error;
  }
};

// 액세스 토큰 리프레시
const refreshAccessToken = async () => {
  try {
    console.log('토큰 리프레시 시도...');
    const tokens = getTokens();
    const refreshToken = tokens?.refresh_token;

    if (!refreshToken) {
      console.error('리프레시 토큰이 없습니다. 리프레시 불가능');
      return false;
    }

    console.log('리프레시 토큰:', refreshToken.substring(0, 10) + '...');

    const url = `${API_BASE_URL}/api/auth/refresh`;
    console.log('리프레시 요청 URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include',
    });

    console.log('리프레시 응답 상태:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('새 토큰 받음:', data.access_token ? '성공' : '실패');

      setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });
      return true;
    }

    console.error('리프레시 응답이 성공적이지 않음:', response.status);
    return false;
  } catch (error) {
    console.error('토큰 리프레시 오류:', error);
    return false;
  }
};

// 게임 관련 API - 실제 사용중인 것만 남김
export const gameApi = {
  // 슬롯 게임 API
  slot: {
    spin: async (betAmount) => {
      return await apiRequest('/api/games/slot/spin', {
        method: 'POST',
        body: JSON.stringify({ betAmount })
      });
    }
  },

  // 가위바위보 게임 API  
  rps: {
    play: async (choice, betAmount) => {
      return await apiRequest('/api/games/rps/play', {
        method: 'POST',
        body: JSON.stringify({ choice, betAmount })
      });
    }
  },

  // 가챠 게임 API
  gacha: {
    pull: async (pullCount = 1) => {
      return await apiRequest('/api/games/gacha/pull', {
        method: 'POST',
        body: JSON.stringify({ pullCount })
      });
    }
  },

  // 크래시 게임 API
  crash: {
    placeBet: async (betAmount, autoCashout) => {
      return await apiRequest('/api/games/crash/bet', {
        method: 'POST',
        body: JSON.stringify({ betAmount, autoCashout })
      });
    },
    cashout: async (gameId) => {
      return await apiRequest('/api/games/crash/cashout', {
        method: 'POST',
        body: JSON.stringify({ gameId })
      });
    }
  }
};

// 사용자 API
export const userApi = {
  getStats: async () => {
    try {
      return await apiRequest('/api/users/stats');
    } catch (error) {
      console.warn('⚠️ 사용자 통계 API 실패, 기본값 사용');
      return {
        totalGames: 0,
        winRate: 0,
        bestScore: 0,
        goldBalance: 1000,
        tokenBalance: 100
      };
    }
  },

  getProfile: async () => {
    try {
      return await apiRequest('/api/users/profile');
    } catch (error) {
      console.warn('⚠️ 사용자 프로필 API 실패, 기본값 사용');
      return {
        id: 0,
        username: 'Guest',
        nickname: 'Guest',
        avatar: '/avatars/default.png',
        level: 1,
        xp: 0,
        vipTier: 0
      };
    }
  },

  getBalance: async () => {
    try {
      return await apiRequest('/api/users/balance');
    } catch (error) {
      console.warn('⚠️ 사용자 잔액 API 실패, 기본값 사용');
      return {
        gold: 1000,
        gems: 50,
        tokens: 100
      };
    }
  }
};

// 스트릭/연속 보상 API
export const streakApi = {
  status: async (actionType = 'DAILY_LOGIN') => {
    return await apiRequest(`/api/streak/status?action_type=${encodeURIComponent(actionType)}`);
  },
  nextReward: async (actionType = 'DAILY_LOGIN') => {
    return await apiRequest(`/api/streak/next-reward?action_type=${encodeURIComponent(actionType)}`);
  },
  tick: async (actionType = 'DAILY_LOGIN') => {
    return await apiRequest('/api/streak/tick', {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType })
    });
  },
  reset: async (actionType = 'DAILY_LOGIN') => {
    return await apiRequest('/api/streak/reset', {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType })
    });
  },
  history: async (year, month, actionType = 'DAILY_LOGIN') => {
    return await apiRequest(`/api/streak/history?action_type=${encodeURIComponent(actionType)}&year=${year}&month=${month}`);
  },
  protectionGet: async (actionType = 'DAILY_LOGIN') => {
    return await apiRequest(`/api/streak/protection?action_type=${encodeURIComponent(actionType)}`);
  },
  protectionSet: async (enabled, actionType = 'DAILY_LOGIN') => {
    return await apiRequest('/api/streak/protection', {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType, enabled })
    });
  }
};

export default apiRequest;
