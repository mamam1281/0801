// src/pages/_app.js
import { useEffect } from 'react';
import '../../styles/globals.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
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
              // If mocks are not present in this runtime (production/container), don't fail.
              // Keep quiet but log for diagnostics.
              // eslint-disable-next-line no-console
              console.warn('[MSW] 모의 API 로더 실패 (무시):', err && err.message ? err.message : err);
            }
          };

          initMocks();
        }
      }
    }
    // 개발 편의: Dev API Logger 자동 로드 (로컬에서만, 토글 가능)
    try {
      if (process.env.NEXT_PUBLIC_DEV_MODE === 'true' && typeof window !== 'undefined') {
        const shouldLoad = localStorage.getItem('dev_api_logger') === 'on';
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (shouldLoad && isLocalHost) {
          // script를 동적으로 주입하여 cc-webapp/devtools/dev_api_logger.js를 로드
          const script = document.createElement('script');
          script.src = '/devtools/dev_api_logger.js';
          script.async = true;
          script.onload = () => console.log('[Dev API Logger] 자동 로드 완료');
          script.onerror = () => console.warn('[Dev API Logger] 로드 실패');
          document.head.appendChild(script);
        }
      }
    } catch (e) {
      // 안전하게 무시
      // eslint-disable-next-line no-console
      console.warn('[Dev API Logger] 자동 로드 오류:', e && e.message ? e.message : e);
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
