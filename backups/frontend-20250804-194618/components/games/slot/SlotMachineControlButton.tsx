'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import Button from '../../Button';
import { Zap } from 'lucide-react';

export type GameState = 'idle' | 'spinning' | 'result';

interface SlotMachineControlButtonProps {
  onSpin: () => void;
  canSpin: boolean;
  isSpinning: boolean;
  gameState: GameState;
  winResult: { isWin: boolean } | null;
  balance: number;
  betAmount: number;
}

export const SlotMachineControlButton: React.FC<SlotMachineControlButtonProps> = ({
  onSpin,
  canSpin,
  isSpinning,
  gameState,
  winResult,
  balance,
  betAmount,
}) => {
  return (
    <div className="bg-gradient-to-br from-[var(--color-surface-primary)] to-[var(--color-surface-secondary)] rounded-2xl border border-[var(--color-border-primary)] shadow-2xl p-14 sm:p-20 mb-8 sm:mb-12">
      {/* Spin Button */}
      <div className="text-center mb-16 sm:mb-20">
        <Button
          onClick={onSpin}
          disabled={!canSpin}
          size="lg"
          className={cn(
            "w-full h-24 sm:h-28 text-2xl sm:text-4xl font-bold rounded-xl transition-all duration-300",
            !canSpin 
              ? "opacity-50 cursor-not-allowed" 
              : "bg-gradient-to-r from-[var(--color-accent-amber)] to-[var(--color-accent-yellow)] hover:from-[var(--color-accent-yellow)] hover:to-[var(--color-accent-amber)] text-[var(--color-surface-primary)] shadow-xl hover:shadow-2xl transform hover:scale-105"
          )}
        >
          <motion.div
            className="flex items-center justify-center gap-8"
            animate={isSpinning ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isSpinning ? Infinity : 0, ease: "linear" }}
          >
            <Zap className="w-10 h-10 sm:w-12 sm:h-12" />
            {isSpinning ? 'SPINNING...' : 'SPIN'}
          </motion.div>
        </Button>
        
        {!canSpin && balance < betAmount && (
          <div className="text-[var(--color-status-error)] text-base sm:text-lg mt-12">
            Insufficient balance
          </div>
        )}
      </div>

      {/* Game State Indicator */}
      <div className="text-center">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
          gameState === 'idle' && "bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)]",
          gameState === 'spinning' && "bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]",
          gameState === 'result' && winResult?.isWin && "bg-[var(--color-status-success)]/20 text-[var(--color-status-success)]",
          gameState === 'result' && !winResult?.isWin && "bg-[var(--color-text-muted)]/20 text-[var(--color-text-muted)]"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            gameState === 'spinning' && "animate-pulse bg-[var(--color-accent-blue)]",
            gameState === 'result' && winResult?.isWin && "bg-[var(--color-status-success)]",
            gameState === 'result' && !winResult?.isWin && "bg-[var(--color-text-muted)]",
            gameState === 'idle' && "bg-[var(--color-text-secondary)]"
          )} />
          {gameState === 'spinning' && 'Spinning...'}
          {gameState === 'result' && (winResult?.isWin ? 'You Win!' : 'Try Again')}
        </div>
      </div>
    </div>
  );
};

export default SlotMachineControlButton;
