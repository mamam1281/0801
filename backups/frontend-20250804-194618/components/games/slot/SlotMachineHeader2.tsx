'use client';

import React from 'react';
import Button from '../../Button';
import { Volume2, VolumeX } from 'lucide-react';

interface SlotMachineHeader2Props {
  balance: number;
  className?: string;
}

export const SlotMachineHeader2: React.FC<SlotMachineHeader2Props> = ({
  balance,
  className = '',
}) => {
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  return (
    <div className={`w-full bg-gradient-to-br from-[var(--color-surface-primary)] 
    to-[var(--color-surface-secondary)] rounded-2xl border border-[var(--color-border-primary)] 
    p-4 mx-auto ${className}`}>
      <div className="w-full flex items-center justify-center">
        <div className="w-full text-center">
          <div className="text-[var(--color-text-primary)] text-sm md:text-base font-medium opacity-90">
            Balance: <span className="text-[var(--color-accent-amber)] font-bold">{formatNumber(balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotMachineHeader2;
