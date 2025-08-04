import React from "react";

interface TokenDisplayProps {
  amount: number;
  unit?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'neon' | 'premium' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// 완전히 새로운 현대적 토큰 디스플레이 - 글래스모피즘 & 네온 효과
export const TokenDisplay: React.FC<TokenDisplayProps> = ({ 
  amount, 
  unit = "CC", 
  icon, 
  variant = 'default',
  size = 'md',
  className 
}) => {
  // 사이즈별 스타일
  const sizeStyles = {
    sm: {
      container: 'px-3 py-2 rounded-xl gap-2',
      amount: 'text-sm sm:text-base',
      unit: 'text-xs',
      icon: 'w-4 h-4'
    },
    md: {
      container: 'px-4 py-3 rounded-2xl gap-3',
      amount: 'text-lg sm:text-xl md:text-2xl',
      unit: 'text-sm',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'px-6 py-4 rounded-3xl gap-4',
      amount: 'text-xl sm:text-2xl md:text-3xl',
      unit: 'text-base',
      icon: 'w-6 h-6'
    }
  };

  // 변형별 스타일
  const variantStyles = {
    default: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'var(--color-primary-purple)',
      glow: 'var(--color-primary-purple)',
      textColor: 'var(--color-text-primary)'
    },
    neon: {
      background: 'rgba(139, 92, 246, 0.08)',
      border: 'var(--color-purple-primary)',
      glow: 'var(--color-purple-primary)',
      textColor: 'var(--color-purple-primary)'
    },
    premium: {
      background: 'rgba(245, 158, 11, 0.08)',
      border: 'var(--color-accent-amber)',
      glow: 'var(--color-accent-amber)',
      textColor: 'var(--color-accent-amber)'
    },
    critical: {
      background: 'rgba(239, 68, 68, 0.08)',
      border: 'var(--color-error)',
      glow: 'var(--color-error)',
      textColor: 'var(--color-error)'
    }
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        ${currentSize.container}
        transition-all duration-300 ease-out
        hover:scale-105 hover:brightness-110
        ${className || ''}
      `.trim()}
      style={{
        fontFamily: "var(--font-primary)",
        background: `linear-gradient(135deg, ${currentVariant.background}, rgba(255, 255, 255, 0.02))`,
        border: `1px solid ${currentVariant.border}`,
        backdropFilter: "blur(16px)",
        boxShadow: `
          0 4px 16px rgba(0, 0, 0, 0.2),
          0 0 0 1px rgba(255, 255, 255, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `
      }}
    >
      {/* 아이콘 */}
      {icon && (
        <div 
          className={`relative ${currentSize.icon} flex-shrink-0`}
          style={{ color: currentVariant.textColor }}
        >
          {icon}
        </div>
      )}
      
      {/* 메인 금액 */}
      <div className="relative flex items-baseline gap-1">
        <span 
          className={`font-black tabular-nums ${currentSize.amount} tracking-tight`}
          style={{ 
            color: currentVariant.textColor
          }}
        >
          {amount.toLocaleString()}
        </span>
        
        {/* 단위 */}
        <span 
          className={`font-semibold ${currentSize.unit} opacity-80 uppercase tracking-wider`}
          style={{ color: currentVariant.textColor }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
};

export default TokenDisplay;
