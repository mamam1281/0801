'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function StatCard({ 
  icon: Icon, 
  label, 
  value,
  color = 'text-primary',
  size = 'md',
  clickable = false,
  onClick,
  className
}: StatCardProps) {
  const sizes = {
    sm: {
      container: 'p-3',
      icon: 'w-4 h-4',
      value: 'text-lg',
      label: 'text-xs'
    },
    md: {
      container: 'p-4',
      icon: 'w-5 h-5',
      value: 'text-xl',
      label: 'text-sm'
    },
    lg: {
      container: 'p-6',
      icon: 'w-6 h-6',
      value: 'text-2xl',
      label: 'text-base'
    }
  };

  const sizeStyles = sizes[size];

  return (
    <div
      className={cn(
        'profile-glass rounded-xl',
        sizeStyles.container,
        clickable && 'cursor-pointer hover:scale-105 transition-transform',
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn(sizeStyles.icon, color)} />
      </div>
      <div className={cn(sizeStyles.value, 'font-bold text-white mb-1')}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={cn(sizeStyles.label, 'text-muted-foreground')}>
        {label}
      </div>
    </div>
  );
}
