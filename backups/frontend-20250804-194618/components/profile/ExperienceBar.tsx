'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExperienceBarProps {
  current: number;
  required: number;
  showValues?: boolean;
  showIcon?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ExperienceBar({ 
  current, 
  required,
  showValues = true,
  showIcon = true,
  height = 'md',
  className
}: ExperienceBarProps) {
  const percentage = Math.min((current / required) * 100, 100);
  
  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showValues && (
        <div className="flex items-center justify-between text-sm">
          {showIcon && <TrendingUp className="w-4 h-4 text-blue-400" />}
          <span className="text-muted-foreground">
            {current.toLocaleString()} / {required.toLocaleString()} XP
          </span>
          <span className="text-blue-400 font-semibold">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-muted/20 rounded-full overflow-hidden relative border border-white/10 shadow-inner',
        heights[height]
      )}>
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 relative overflow-hidden shadow-lg"
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/60 to-purple-400/60 blur-sm shadow-lg shadow-blue-500/30" />
        </div>
        
        {/* Progress indicator dot */}
        {percentage > 5 && (
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-300 animate-pulse"
            style={{ left: `${Math.max(5, percentage - 2)}%` }}
          />
        )}
      </div>
    </div>
  );
}
