'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'gradient' | 'animated';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  // 심리적 효과 props
  psychDistortion?: boolean;
  inflatedDisplay?: boolean;
  inflationFactor?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  variant = 'default',
  size = 'md',
  showLabel = false,
  psychDistortion = false,
  inflatedDisplay = false,
  inflationFactor = 1.2,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  // 심리적 효과: 잠시 부풀려서 보여주기
  useEffect(() => {
    if (inflatedDisplay && value > 0) {
      setDisplayValue(value * inflationFactor);
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, inflatedDisplay, inflationFactor]);

  const actualPercentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayPercentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-slate-700',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500',
    animated: 'bg-gradient-to-r from-green-400 to-blue-500 animate-pulse',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-slate-300 mb-1">
          <span>{Math.round(displayValue)}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={cn(
        'w-full bg-slate-800 rounded-full overflow-hidden border border-slate-600',
        sizeClasses[size]
      )}>
        {psychDistortion ? (
          <motion.div
            className={cn(
              'h-full rounded-full',
              variantClasses[variant]
            )}
            initial={{ width: 0 }}
            animate={{ width: `${displayPercentage}%` }}
            transition={{ 
              duration: 0.8,
              ease: "easeOut",
              type: "spring",
              stiffness: 100
            }}
          />
        ) : (
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out rounded-full',
              variantClasses[variant]
            )}
            style={{ width: `${displayPercentage}%` }}
          />
        )}
      </div>
      {showLabel && (
        <div className="text-xs text-slate-400 mt-1 text-right">
          {Math.round(displayPercentage)}%
          {inflatedDisplay && displayValue !== value && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-2 text-yellow-400"
            >
              (계산 중...)
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
