'use client';

import { Suspense } from 'react';
import SlotMachine from '../../../../components/games/slot/SlotMachine';
import GamePopupLayout from '../../../../components/GamePopupLayout';
import '../../../../styles/slot-popup.css'; // 슬롯 팝업 전용 CSS 추가

// 팝업 창용 로딩 스켈레톤
function PopupLoadingSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-dark-navy)] to-[var(--color-primary-charcoal)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-amber)] mx-auto mb-3"></div>
        <p className="text-[var(--color-text-secondary)] text-sm">슬롯 머신 로딩 중...</p>
      </div>
    </div>
  );
}

// 팝업 창용 슬롯 게임 페이지
function SlotGamePopupContent() {
  return (
    <div className="slot-popup-compact w-full h-full overflow-y-auto bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] to-[var(--color-primary-dark-navy)] p-1">
      <div className="w-full max-w-full mx-auto h-full flex flex-col justify-center">
        <SlotMachine className="w-full" />
      </div>
    </div>
  );
}

// 메인 익스포트 - 팝업 창용 슬롯 페이지
export default function SlotsPopupPage() {
  return (
    <GamePopupLayout>
      <Suspense fallback={<PopupLoadingSkeleton />}>
        <SlotGamePopupContent />
      </Suspense>
    </GamePopupLayout>
  );
}
