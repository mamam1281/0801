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
  className?: string;
}

export const SlotMachineMain: React.FC<SlotMachineMainProps> = ({
  reels,
  isSpinning,
  winResult,
  className = '',
}) => {
  return (
    <div className={`w-full bg-gradient-to-br from-[var(--color-surface-primary)] via-[var(--color-surface-secondary)] to-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-lg shadow-black/20 p-4 mx-auto ${className}`}>
      {/* Slot Reels */}
      <div className="w-full flex justify-center mb-5">
        <div className="grid grid-cols-3 gap-5 sm:gap-6 h-40 justify-items-center">
          {reels.map((symbol, index) => (
            <SlotReel
              key={index}
              symbol={symbol}
              isSpinning={isSpinning}
              delayFactor={index * 0.3}
              isWinning={winResult?.isWin && winResult?.winningPositions?.includes(index)}
              className="bg-gradient-to-b from-[var(--color-surface-secondary)] via-[var(--color-surface-tertiary)] to-[var(--color-surface-secondary)] shadow-xl shadow-black/50 border-2 border-[var(--color-border-primary)] w-[90px] sm:w-[110px] h-40 rounded-lg"
            />
          ))}
        </div>
      </div>
      
      {/* Result Display - Shows both wins and losses with better proportions */}
      <AnimatePresence>
        {winResult && (
          winResult.isWin ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="w-full text-center p-4 bg-gradient-to-r from-[var(--color-accent-amber)]/40 via-[var(--color-accent-yellow)]/30 to-[var(--color-accent-amber)]/40 border-2 border-[var(--color-accent-amber)]/60 rounded-xl mx-auto shadow-md shadow-[var(--color-accent-amber)]/20"
            >
              <div className="flex items-center justify-center gap-3 text-[var(--color-accent-amber)] text-base font-bold">
                <Star className="w-4 h-4" />
                승리! +{winResult.payout} ({winResult.multiplier}배)
                <Star className="w-4 h-4" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="w-full text-center p-4 bg-gradient-to-r from-[var(--color-surface-tertiary)]/40 via-[var(--color-surface-secondary)]/30 to-[var(--color-surface-tertiary)]/40 border-2 border-[var(--color-border-secondary)]/60 rounded-xl mx-auto shadow-md"
            >
              <div className="text-[var(--color-text-secondary)] text-base font-bold">
                아쉽네요! 다음 기회에
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default SlotMachineMain;
