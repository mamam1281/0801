// src/pages/_app.js
import { useEffect } from 'react';
import { getTokens, clearTokens } from '../../utils/tokenStorage';
import '../../styles/globals.css';

// (초기화 로직은 아래 MyApp의 useEffect에 통합됩니다.)

// 앱 부팅 시 서버에 토큰 유효성 검증 수행 (재사용 가능한 함수로 추출)
export async function validateAuthOnBoot({ doReload = true } = {}) {
  if (typeof window === 'undefined') return;

  try {
    const tokens = getTokens();
    const access = tokens?.access_token;
    if (!access) return;

    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`,
      },
    });

    if (res.status === 401 || res.status === 403 || res.status === 404) {
      try {
        clearTokens();
        if (doReload) {
          // eslint-disable-next-line no-restricted-globals
          location.reload();
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[Auth] 토큰 정리 실패', err);
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Auth] 서버 검증 실패:', e && e.message ? e.message : e);
  }
}

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // --- 기존 개발 편의 초기화 로직 (MSW, Dev API Logger, UI Recorder) ---
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      if (typeof window !== 'undefined') {
        // MSW 활성화 (개발 모드에서만)
        if (process.env.NODE_ENV === 'development') {
          const initMocks = async () => {
            try {
              const { worker } = await import('../mocks/browser');
              if (worker && typeof worker.start === 'function') {
                await worker.start({ onUnhandledRequest: 'bypass' });
                console.log('[MSW] 모의 API 서버가 활성화되었습니다.');
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('[MSW] 모의 API 로더 실패 (무시):', err && err.message ? err.message : err);
            }
          };

          initMocks();
        }
      }
    }

    try {
      if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' && typeof window !== 'undefined') {
        const shouldLoad = localStorage.getItem('dev_api_logger') === 'on';
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (shouldLoad && isLocalHost) {
          const script = document.createElement('script');
          script.src = '/devtools/dev_api_logger.js';
          script.async = true;
          script.onload = () => console.log('[Dev API Logger] 자동 로드 완료');
          script.onerror = () => console.warn('[Dev API Logger] 로드 실패');
          document.head.appendChild(script);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[Dev API Logger] 자동 로드 오류:', e && e.message ? e.message : e);
    }

    try {
      if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' && typeof window !== 'undefined') {
        const shouldRecordUi = localStorage.getItem('dev_ui_recorder') === 'on';
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (shouldRecordUi && isLocalHost) {
          import('../../utils/apiClient').then(mod => {
            try {
              if (mod && typeof mod.initUiRecorder === 'function') {
                mod.initUiRecorder();
                // eslint-disable-next-line no-console
                console.log('[Dev] UIRecorder initialized');
              }
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn('[Dev] initUiRecorder failed', e);
            }
          }).catch(e => {
            // eslint-disable-next-line no-console
            console.warn('[Dev] UIRecorder import failed', e);
          });
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[Dev] UIRecorder activation check failed', e);
    }

    // --- 서버 검증 호출 ---
    validateAuthOnBoot();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
