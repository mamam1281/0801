'use client';

import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function TokenDisplay({ 
  amount, 
  size = 'md',
  showIcon = true,
  showLabel = false,
  onClick,
  className
}: TokenDisplayProps) {
  const sizes = {
    sm: {
      container: 'gap-1',
      icon: 'w-4 h-4',
      text: 'text-sm',
      label: 'text-xs'
    },
    md: {
      container: 'gap-2',
      icon: 'w-5 h-5',
      text: 'text-base',
      label: 'text-sm'
    },
    lg: {
      container: 'gap-2',
      icon: 'w-6 h-6',
      text: 'text-lg font-bold',
      label: 'text-base'
    }
  };

  const sizeStyles = sizes[size];

  return (
    <div 
      className={cn(
        'flex items-center',
        sizeStyles.container,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {showIcon && (
        <Coins className={cn(sizeStyles.icon, 'text-yellow-400')} />
      )}
      <div className="flex flex-col items-center">
        <span className={cn(sizeStyles.text, 'text-yellow-400 font-semibold')}>
          {amount.toLocaleString()}💎
        </span>
        {showLabel && (
          <span className={cn(sizeStyles.label, 'text-muted-foreground')}>
            토큰
          </span>
        )}
      </div>
    </div>
  );
}
