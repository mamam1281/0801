'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import SlotReel from './SlotReel';

interface WinResult {
  isWin: boolean;
  payout: number;
  multiplier: number;
  winningPositions: number[];
  type: string;
}

interface SlotMachineMainProps {
  reels: string[];
  isSpinning: boolean;
  winResult: WinResult | null;
}

export const SlotMachineMain: React.FC<SlotMachineMainProps> = ({
  reels,
  isSpinning,
  winResult,
}) => {
  return (
    <div className="bg-gradient-to-br from-[var(--color-surface-primary)] to-[var(--color-surface-secondary)] rounded-2xl border border-[var(--color-border-primary)] shadow-2xl p-14 sm:p-20 mb-8 sm:mb-12">
      {/* Slot Reels Section */}
      <div className="mb-20 sm:mb-24">
        <div className="grid grid-cols-3 gap-8 sm:gap-12 h-44 sm:h-56 mb-16 sm:mb-20">
          {reels.map((symbol, index) => (
            <SlotReel
              key={index}
              symbol={symbol}
              isSpinning={isSpinning}
              delayFactor={index * 0.3}
              isWinning={winResult?.isWin && winResult?.winningPositions?.includes(index)}
              className="bg-gradient-to-b from-[var(--color-surface-secondary)] to-[var(--color-surface-tertiary)] shadow-xl shadow-black/40 border-2 border-[var(--color-border-primary)]"
            />
          ))}
        </div>
        
        {/* Result Display - Shows both wins and losses */}
        <AnimatePresence>
          {winResult && (
            winResult.isWin ? (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="text-center mt-16 sm:mt-20 p-10 sm:p-14 bg-gradient-to-r from-[var(--color-accent-amber)]/30 to-[var(--color-accent-yellow)]/30 border-2 border-[var(--color-accent-amber)]/50 rounded-xl"
              >
                <div className="flex items-center justify-center gap-6 text-[var(--color-accent-amber)] text-2xl sm:text-3xl font-bold mb-14 sm:mb-16">
                  <Star className="w-8 h-8" />
                  WIN! +{winResult.payout}
                  <Star className="w-8 h-8" />
                </div>
                <div className="text-[var(--color-text-secondary)] text-lg sm:text-xl">
                  {winResult.multiplier}x multiplier
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="text-center mt-16 sm:mt-20 p-10 sm:p-14 bg-gradient-to-r from-[var(--color-surface-tertiary)]/30 to-[var(--color-surface-tertiary)]/30 border-2 border-[var(--color-border-secondary)]/50 rounded-xl"
              >
                <div className="flex items-center justify-center gap-6 text-[var(--color-text-secondary)] text-2xl sm:text-3xl font-bold mb-14 sm:mb-16">
                  NO MATCH
                </div>
                <div className="text-[var(--color-text-tertiary)] text-lg sm:text-xl">
                  Better luck next time
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlotMachineMain;
