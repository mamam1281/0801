"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function SessionExpiredBanner() {
  const [visible, setVisible] = useState(false);
  const [ts, setTs] = useState(null as any);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onExpired(e: Event) {
      // @ts-ignore
      const detailTs = e?.detail?.at || Date.now();
      setTs(detailTs);
      setVisible(true);
    }
    window.addEventListener('app:session-expired', onExpired as any);
    return () => window.removeEventListener('app:session-expired', onExpired as any);
  }, []);

  if (!visible) return null;

  return (
    <div data-testid="session-expired-banner" className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-5xl p-3 md:p-4">
        <div className="rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-900/70 to-red-900/60 backdrop-blur text-amber-200 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3">
          <div className="text-sm md:text-base font-medium flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>세션이 만료되었습니다. 다시 로그인 해주세요.</span>
            {ts && <span className="text-xs opacity-70">({new Date(ts).toLocaleTimeString('ko-KR')})</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="session-expired-login-btn"
              onClick={() => router.push(`/login?from=${encodeURIComponent(pathname || '/')}`)}
              className="px-4 py-2 text-sm rounded-md bg-amber-600 hover:bg-amber-500 text-black font-semibold transition-colors"
            >재로그인</button>
            <button
              data-testid="session-expired-dismiss-btn"
              onClick={() => setVisible(false)}
              className="px-3 py-2 text-xs rounded-md border border-amber-400/40 hover:bg-amber-800/30 transition-colors"
            >닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
