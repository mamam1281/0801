'use client';

import { Suspense } from 'react';
import { GachaContainer } from '../../../../components/games/gacha/GachaContainer';
import GamePopupLayout from '../../../../components/GamePopupLayout';

function PopupLoadingSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-dark-navy)] to-[var(--color-primary-charcoal)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-amber)] mx-auto mb-3"></div>
        <p className="text-[var(--color-text-secondary)] text-sm">로딩 중...</p>
      </div>
    </div>
  );
}

function GachaGamePopupContent() {
  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] to-[var(--color-primary-dark-navy)] p-0">
      <div className="w-full max-w-[420px] mx-auto h-full flex flex-col justify-start items-center">
        <GachaContainer />
      </div>
    </div>
  );
}

export default function GachaPopupPage() {
  return (
    <GamePopupLayout>
      <Suspense fallback={<PopupLoadingSkeleton />}>
        <GachaGamePopupContent />
      </Suspense>
    </GamePopupLayout>
  );
}
