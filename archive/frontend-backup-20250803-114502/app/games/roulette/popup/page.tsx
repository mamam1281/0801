'use client';

import { Suspense } from 'react';
import RouletteGame from '../../../../components/games/roulette/RouletteGame';
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

function RouletteGamePopupContent() {
  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] to-[var(--color-primary-dark-navy)] p-1">
      <div className="w-full max-w-full mx-auto h-full flex flex-col justify-center">
        <RouletteGame isPopup={true} />
      </div>
    </div>
  );
}

export default function RoulettePopupPage() {
  return (
    <GamePopupLayout>
      <Suspense fallback={<PopupLoadingSkeleton />}>
        <RouletteGamePopupContent />
      </Suspense>
    </GamePopupLayout>
  );
}
