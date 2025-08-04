import { ReactNode } from 'react';
import { cn } from '../ui/utils';

interface BaseCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'error' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function BaseCard({ 
  children, 
  className, 
  variant = 'default',
  size = 'md'
}: BaseCardProps) {
  const variants = {
    default: 'bg-black/30 border-white/20 hover:bg-black/40 text-white backdrop-blur-md',
    accent: 'bg-purple-900/30 border-purple-400/30 hover:bg-purple-900/40 text-white backdrop-blur-md',
    error: 'bg-red-900/30 border-red-400/30 hover:bg-red-900/40 text-white backdrop-blur-md',
    success: 'bg-green-900/30 border-green-400/30 hover:bg-green-900/40 text-white backdrop-blur-md',
    info: 'bg-blue-900/30 border-blue-400/30 hover:bg-blue-900/40 text-white backdrop-blur-md'
  };

  const sizes = {
    sm: 'p-3 rounded-sm',
    md: 'p-4 rounded-md', 
    lg: 'p-6 rounded-lg'
  };

  return (
    <div className={cn(
      'backdrop-blur-md border transition-all duration-300',
      'shadow-2xl hover:shadow-3xl transform hover:-translate-y-1',
      'relative overflow-hidden',
      variants[variant],
      sizes[size],
      className
    )}>
      {/* Enhanced dark glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-white/2 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}