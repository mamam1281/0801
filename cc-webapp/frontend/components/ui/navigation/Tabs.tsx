'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    default: {
      container: 'bg-slate-800/50 rounded-xl p-1 border border-slate-600/30',
      active: 'bg-white/10 text-white border border-white/20',
      inactive: 'text-slate-400 hover:text-white',
    },
    pills: {
      container: 'space-x-2',
      active: 'bg-blue-600 text-white shadow-lg',
      inactive: 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white',
    },
    underline: {
      container: 'border-b border-slate-600 space-x-6',
      active: 'border-b-2 border-blue-500 text-blue-400 pb-2',
      inactive: 'text-slate-400 hover:text-white pb-2',
    },
  };

  const currentVariant = variantClasses[variant];

  return (
    <div className={cn('flex', currentVariant.container, className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onTabChange(item.key)}
          className={cn(
            'font-medium rounded-lg transition-all duration-300 flex items-center gap-2',
            sizeClasses[size],
            activeTab === item.key ? currentVariant.active : currentVariant.inactive,
            variant === 'default' && 'flex-1',
            variant === 'pills' && 'rounded-full',
            variant === 'underline' && 'rounded-none border-b-2 border-transparent'
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
