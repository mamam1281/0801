'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RPSGame from '../../../components/games/rps/RPSGame';

// 로딩 스켈레톤
function LoadingSkeleton() {
  return (
    <div className={`w-full min-h-screen flex items-center justify-center bg-slate-900`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-3"></div>
        <p className="text-gray-300 text-sm">RPS 게임 로딩 중...</p>
      </div>
    </div>
  );
}

// URL 파라미터를 확인하고 게임을 렌더링하는 메인 컴포넌트
function RPSPageContent() {
  const searchParams = useSearchParams();
  const isPopup = searchParams?.get('popup') === 'true';

  const containerClasses = isPopup
    ? "w-full h-screen flex items-center justify-center bg-transparent"
    : "min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900";

  return (
    <div className={containerClasses}>
      <RPSGame isPopup={isPopup} />
    </div>
  );
}

// 메인 익스포트 - RPS 페이지 (일반 모드와 팝업 모드 모두 지원)
export default function RPSPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RPSPageContent />
    </Suspense>
  );
}
