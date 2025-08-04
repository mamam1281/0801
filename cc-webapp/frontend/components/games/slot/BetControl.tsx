'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Gem } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface BetControlProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  minBet?: number;
  maxBet: number;
  step?: number;
  quickBetOptions?: number[];
  disabled?: boolean;
  className?: string;
}

export const BetControl: React.FC<BetControlProps> = ({
  betAmount,
  setBetAmount,
  minBet = 5,
  maxBet,
  step = 5,
  quickBetOptions = [5, 25, 50, 100],
  disabled = false,
  className = '',
}) => {
  const increaseBet = () => {
    setBetAmount(Math.min(betAmount + step, maxBet));
  };

  const decreaseBet = () => {
    setBetAmount(Math.max(betAmount - step, minBet));
  };

  const handleQuickBetSelect = (amount: number) => {
    if (amount <= maxBet && amount >= minBet) {
      setBetAmount(amount);
    } else if (amount > maxBet) {
      setBetAmount(maxBet);
    } else {
      setBetAmount(minBet);
    }
  };

  return (
    <div className={cn("w-full bg-gradient-to-br from-[var(--color-surface-primary)] via-[var(--color-surface-secondary)] to-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-lg shadow-black/20 p-4 mx-auto", className)}>
      {/* Bet Amount Adjust Buttons & Display */}
      <div style={{ marginBottom: "16px" }}>
      
        <div className="w-full flex items-center justify-center gap-3 mb-5">
          <motion.button
            onClick={decreaseBet}
            disabled={disabled || betAmount <= minBet}
            className={cn(
              "h-11 w-11 text-[var(--color-accent-amber)] rounded-xl shadow-xl transform transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-amber)]/50 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center",
              disabled || betAmount <= minBet 
                ? "bg-[var(--color-surface-tertiary)] border-2 border-[var(--color-border-secondary)]" 
                : "bg-gradient-to-b from-[var(--color-accent-amber)]/20 to-[var(--color-accent-amber)]/10 border-2 border-[var(--color-accent-amber)]/60 hover:from-[var(--color-accent-amber)]/30 hover:to-[var(--color-accent-amber)]/20 hover:border-[var(--color-accent-amber)]/80 active:scale-95"
            )}
            whileTap={!(disabled || betAmount <= minBet) ? { scale: 0.90 } : {}}
          >
            <Minus className="h-5 w-5" />
          </motion.button>

          <div className="text-center p-[16px] bg-gradient-to-r from-[var(--color-accent-amber)]/30 via-[var(--color-accent-yellow)]/30 to-[var(--color-accent-amber)]/30 border-2 border-[var(--color-accent-amber)]/50 rounded-xl backdrop-blur-sm shadow-lg min-w-[120px]">
            <div className="text-2xl font-bold text-[var(--color-text-primary)] whitespace-nowrap overflow-hidden flex items-center justify-center">
              <Gem size={18} className="mr-2 opacity-80 text-[var(--color-accent-amber)]" />
              {betAmount || 0}
            </div>
          </div>

          <motion.button
            onClick={increaseBet}
            disabled={disabled || betAmount >= maxBet}
            className={cn(
              "h-11 w-11 text-[var(--color-accent-amber)] rounded-xl shadow-xl transform transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-amber)]/50 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center",
              disabled || betAmount >= maxBet 
                ? "bg-[var(--color-surface-tertiary)] border-2 border-[var(--color-border-secondary)]" 
                : "bg-gradient-to-b from-[var(--color-accent-amber)]/20 to-[var(--color-accent-amber)]/10 border-2 border-[var(--color-accent-amber)]/60 hover:from-[var(--color-accent-amber)]/30 hover:to-[var(--color-accent-amber)]/20 hover:border-[var(--color-accent-amber)]/80 active:scale-95"
            )}
            whileTap={!(disabled || betAmount >= maxBet) ? { scale: 0.90 } : {}}
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Quick Bet Options */}
      <div className="w-full">
        <div className="w-full flex justify-center gap-2 sm:gap-3">
          {quickBetOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickBetSelect(amount)}
              disabled={disabled}
              className={cn(
                "text-base px-3 py-2 min-w-[50px] min-h-[40px] rounded-lg border-2 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center",
                betAmount === amount ? 
                  "bg-gradient-to-r from-[var(--color-accent-red)] to-[var(--color-accent-amber)] border-[var(--color-accent-red)] text-white shadow-md shadow-[var(--color-accent-red)]/20" : 
                  "bg-transparent border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-accent-red)] hover:text-[var(--color-accent-red)]"
              )}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BetControl;
