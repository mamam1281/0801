/**
 * 토큰 스토리지 유틸리티
 * JWT 토큰 관리를 위한 함수들
 */

// 로컬 스토리지에 저장된 토큰 키
const TOKEN_KEY = 'cc_auth_tokens';

/**
 * 토큰 인터페이스 정의
 * @typedef {Object} AuthTokens
 * @property {string} access_token - 액세스 토큰
 * @property {string} refresh_token - 리프레시 토큰
 */

/**
 * 로컬 스토리지에서 토큰 가져오기
 * @returns {AuthTokens|null} 토큰 객체 또는 null
 */
export const getTokens = () => {
  if (typeof window === 'undefined') return null;

  try {
    // 1) 신규 형식: 단일 키에 JSON 객체 저장
    const tokens = localStorage.getItem(TOKEN_KEY);
    const parsedTokens = tokens ? JSON.parse(tokens) : null;
    if (parsedTokens?.access_token) {
      console.log('토큰 가져오기 결과: 신규 형식 토큰 사용');
      return parsedTokens;
    }

    // 2) 레거시 형식: 개별 키 저장 ('access_token', 'refresh_token')
    const legacyAccess = localStorage.getItem('access_token');
    const legacyRefresh = localStorage.getItem('refresh_token');
    if (legacyAccess || legacyRefresh) {
      const migrated = {
        access_token: legacyAccess || null,
        refresh_token: legacyRefresh || null,
      };
      // 마이그레이션: 신규 형식으로 저장해 두기 (향후 일관성 유지)
      localStorage.setItem(TOKEN_KEY, JSON.stringify(migrated));
      console.log('토큰 가져오기 결과: 레거시 형식 발견 → 신규 형식으로 마이그레이션');
      return migrated;
    }

    console.log('토큰 가져오기 결과: 토큰 없음');
    return null;
  } catch (error) {
    console.error('토큰 가져오기 오류:', error);
    return null;
  }
};

/**
 * 액세스 토큰 가져오기
 * @returns {string|null} 액세스 토큰 또는 null
 */
export const getAccessToken = () => {
  const tokens = getTokens();
  const accessToken = tokens?.access_token || null;
  console.log('액세스 토큰:', accessToken ? accessToken.substring(0, 10) + '...' : '없음');
  return accessToken;
};

/**
 * 로컬 스토리지에 토큰 저장하기
 * @param {Object} tokens - 저장할 토큰 객체 {access_token, refresh_token}
 */
export const setTokens = (tokens) => {
  if (typeof window === 'undefined') return;

  try {
    // 신규 형식 저장
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    // 레거시 키도 동기화 저장 (호환성)
    if (tokens?.access_token) localStorage.setItem('access_token', tokens.access_token);
    if (tokens?.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
  } catch (error) {
    console.error('토큰 저장 오류:', error);
  }
};

/**
 * 로컬 스토리지에서 토큰 삭제하기
 */
export const clearTokens = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    // 레거시 키도 함께 제거
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } catch (error) {
    console.error('토큰 삭제 오류:', error);
  }
};

/**
 * 토큰이 유효한지 확인하기
 * @returns {boolean} 토큰 유효 여부
 */
export const isAuthenticated = () => {
  const tokens = getTokens();
  if (!tokens?.access_token) return false;

  try {
    // JWT 토큰의 만료 시간 확인
    const payload = JSON.parse(atob(tokens.access_token.split('.')[1]));
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return false;
  }
};
