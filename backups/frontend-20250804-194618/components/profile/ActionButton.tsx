'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/basic/button';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  icon: LucideIcon;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ActionButton({ 
  icon: Icon,
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  className
}: ActionButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white',
    secondary: 'bg-muted/20 hover:bg-muted/30 text-white border border-muted/40',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg'
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        'flex items-center gap-2 font-semibold transition-all duration-200',
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {children}
    </Button>
  );
}
