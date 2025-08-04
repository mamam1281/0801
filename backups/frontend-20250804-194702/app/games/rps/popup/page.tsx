'use client';

import React from 'react';
import GamePopupLayout from '../../../../components/GamePopupLayout';
import RPSGame from '../../../../components/games/rps/RPSGame';

export default function RPSPopupPage() {
  return (
    <GamePopupLayout>
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-dark-navy)] to-black">
        <div className="w-full max-w-[400px] h-auto flex items-center justify-center">
          <RPSGame isPopup={true} />
        </div>
      </div>
    </GamePopupLayout>
  );
}