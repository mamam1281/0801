import React from 'react';

export type ProgressBarSize = 'sm' | 'md' | 'lg';

export interface SimpleProgressBarProps {
  /** 진행률 (0-100) */
  progress?: number;
  /** 크기 */
  size?: ProgressBarSize;
  /** 무한 로딩 모드 */
  indeterminate?: boolean;
  /** 레이블 텍스트 */
  label?: string;
  /** 퍼센트 표시 여부 */
  showPercentage?: boolean;
  /** 커스텀 클래스 */
  className?: string;
}

/**
 * 간단하고 깔끔한 한줄 프로그레스 바
 * 현대적인 디자인과 부드러운 애니메이션
 */
export const SimpleProgressBar: React.FC<SimpleProgressBarProps> = ({
  progress = 0,
  size = 'md',
  indeterminate = false,
  label,
  showPercentage = false,
  className = '',
}) => {
  // 크기별 높이 설정
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const currentHeight = sizeClasses[size];
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {/* 레이블과 퍼센트 */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span 
              className="text-sm font-medium"
              style={{ 
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-primary)',
              }}
            >
              {label}
            </span>
          )}
          {showPercentage && !indeterminate && (
            <span 
              className="text-sm font-medium"
              style={{ 
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-primary)',
              }}
            >
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      {/* 프로그레스 바 */}
      <div 
        className={`w-full ${currentHeight} rounded overflow-hidden`}
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        {indeterminate ? (
          // 무한 로딩 - 왼쪽에서 오른쪽으로 흐르는 애니메이션
          <div 
            className={`${currentHeight} rounded`}
            style={{
              width: '30%',
              background: 'var(--gradient-neon)',
              animation: 'progressSlide 2s ease-in-out infinite',
            }}
          />
        ) : (
          // 일반 프로그레스 - 부드럽게 채워짐
          <div 
            className={`${currentHeight} rounded transition-all duration-500 ease-out`}
            style={{
              width: `${clampedProgress}%`,
              background: clampedProgress > 80 
                ? 'var(--gradient-neon)' 
                : 'var(--color-purple-primary)',
              boxShadow: clampedProgress > 0 ? '0 0 4px var(--color-purple-primary)' : 'none',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SimpleProgressBar;
