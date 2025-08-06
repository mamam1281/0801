import { apiLogTry, apiLogSuccess, apiLogFail } from './apiLogger';
import { getTokens, setTokens, clearTokens } from './tokenStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * API 클라이언트
 * 백엔드와의 통신을 처리하는 함수들
 */

// 기본 API 요청 함수
const apiRequest = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const requestData = options.body ? JSON.parse(options.body) : undefined;

  // API 요청 로그
  apiLogTry(`${method} ${endpoint}`);

  const startTime = Date.now();

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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

    // 401 처리는 동일...

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
    const { refreshToken } = getTokens();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('토큰 리프레시 실패:', error);
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
  }
};

export default apiRequest;
