'use client';

import { cn } from '@/lib/utils';

interface StatusDotProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

export default function StatusDot({
  status,
  size = 'md',
  showPulse = false,
  className
}: StatusDotProps) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  return (
    <div className={cn(
      'rounded-full border-2 border-background',
      sizes[size],
      colors[status],
      showPulse && status === 'online' && 'animate-pulse',
      className
    )} />
  );
}
