'use client';

import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakIndicatorProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export default function StreakIndicator({
  streak,
  size = 'md',
  showLabel = false,
  animated = false,
  className
}: StreakIndicatorProps) {
  const sizes = {
    sm: {
      container: 'gap-1.5',
      icon: 'w-4 h-4',
      text: 'text-sm font-bold',
      label: 'text-xs font-medium',
      emoji: 'text-sm'
    },
    md: {
      container: 'gap-2',
      icon: 'w-5 h-5',
      text: 'text-lg font-bold',
      label: 'text-sm font-medium',
      emoji: 'text-lg'
    },
    lg: {
      container: 'gap-2.5',
      icon: 'w-6 h-6',
      text: 'text-xl font-bold',
      label: 'text-base font-medium',
      emoji: 'text-xl'
    }
  };

  const sizeStyles = sizes[size];

  return (
    <div className={cn('flex items-center', sizeStyles.container, className)}>
      {/* 일관된 이모티콘 크기 */}
      <span className={cn(sizeStyles.emoji)}>🔥</span>
      
      <div className="flex flex-col items-start">
        {/* 계층화된 텍스트 */}
        <span className={cn(sizeStyles.text, 'text-orange-400 leading-tight')}>
          {streak}일
        </span>
        {showLabel && (
          <span className={cn(sizeStyles.label, 'text-gray-400 leading-tight')}>
            연속 접속
          </span>
        )}
      </div>
    </div>
  );
}
