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
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
