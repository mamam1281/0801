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
    const tokens = localStorage.getItem(TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : null;
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
  return tokens?.access_token || null;
};

/**
 * 로컬 스토리지에 토큰 저장하기
 * @param {Object} tokens - 저장할 토큰 객체 {access_token, refresh_token}
 */
export const setTokens = (tokens) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
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
