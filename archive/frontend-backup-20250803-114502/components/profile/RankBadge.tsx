'use client';

import { cn } from '@/lib/utils';
import { RANK_COLORS, RANK_LABELS } from './types';

interface RankBadgeProps {
  rank: keyof typeof RANK_COLORS;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RankBadge({
  rank,
  size = 'md',
  className
}: RankBadgeProps) {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const colors = RANK_COLORS[rank];
  const label = RANK_LABELS[rank];

  return (
    <div className={cn(
      colors.bg,
      colors.border,
      colors.text,
      'border rounded-lg font-semibold',
      sizes[size],
      className
    )}>
      {label}
    </div>
  );
}
