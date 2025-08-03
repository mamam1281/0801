'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType } from './types';

interface ProfileAvatarProps {
  user: UserType;
  size?: 'sm' | 'md' | 'lg';
  showOnlineStatus?: boolean;
  className?: string;
}

export default function ProfileAvatar({
  user,
  size = 'md',
  showOnlineStatus = false,
  className
}: ProfileAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center',
        sizes[size]
      )}>
        <User className="w-1/2 h-1/2 text-white" />
      </div>
      {showOnlineStatus && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
      )}
    </div>
  );
}
