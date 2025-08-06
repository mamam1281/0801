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
            const { worker } = await import('../mocks/browser');
            worker.start({
              onUnhandledRequest: 'bypass',
            });
            console.log('[MSW] 모의 API 서버가 활성화되었습니다.');
          };

          initMocks();
        }
      }
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
