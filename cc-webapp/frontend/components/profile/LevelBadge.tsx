'use client';

import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LevelBadge({
  level,
  size = 'md',
  className
}: LevelBadgeProps) {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={cn(
      'bg-blue-500/20 border border-blue-500/30 rounded-lg font-semibold text-blue-400',
      sizes[size],
      className
    )}>
      Lv.{level}
    </div>
  );
}
