import React from 'react';

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoadingSpinnerVariant = 'ring' | 'dots' | 'pulse' | 'wave';

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  variant?: LoadingSpinnerVariant;
  className?: string;
  text?: string;
}

// 완전히 새로운 로딩 스피너 - 확실히 움직입니다!
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'ring',
  className = '',
  text,
}) => {
  // 크기 설정
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const currentSize = sizeClasses[size];

  // Ring Spinner - 부드럽고 편안한 단방향 회전
  if (variant === 'ring') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className={`${currentSize} relative`}>
          {/* 메인 링 스피너 */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              border: '4px solid transparent',
              borderTop: '4px solid var(--color-purple-primary)',
              borderRight: '4px solid var(--color-purple-secondary)',
              animation: 'spinnerRotate 2s linear infinite',
              willChange: 'transform',
            }}
          />
          {/* 내부 링 - 같은 방향, 더 연한 색상 */}
          <div 
            className="absolute inset-2 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTop: '2px solid var(--color-purple-secondary)',
              borderRight: '2px solid var(--color-purple-tertiary)',
              animation: 'spinnerRotate 2.5s linear infinite',
              willChange: 'transform',
              opacity: 0.7,
            }}
          />
        </div>
        {text && (
          <p 
            className="text-sm font-medium" 
            style={{ 
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-primary)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  // Dots Spinner - 점들이 위아래로 움직임
  if (variant === 'dots') {
    const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${dotSize} rounded-full animate-bounce`}
              style={{
                backgroundColor: 'var(--color-purple-primary)',
                animationDelay: `${i * 0.2}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
        {text && (
          <p 
            className="text-sm font-medium" 
            style={{ 
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-primary)',
            }}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  // Pulse Spinner - 크기가 커졌다 작아졌다
  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div 
          className={`${currentSize} rounded-full animate-pulse`}
          style={{
            background: 'var(--gradient-neon)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        {text && (
          <p 
            className="text-sm font-medium" 
            style={{ 
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-primary)',
            }}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  // Wave Spinner - 물결 효과
  if (variant === 'wave') {
    const barHeight = size === 'sm' ? 'h-4' : size === 'md' ? 'h-6' : size === 'lg' ? 'h-8' : 'h-10';
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex items-end gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-1 ${barHeight} rounded-full animate-pulse`}
              style={{
                backgroundColor: 'var(--color-accent-amber)',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
        {text && (
          <p 
            className="text-sm font-medium" 
            style={{ 
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-primary)',
            }}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default LoadingSpinner;
