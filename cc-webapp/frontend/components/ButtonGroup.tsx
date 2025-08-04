import React from 'react';
import { cn } from './utils';

export interface ButtonGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical' | 'grid';
  gap?: 'sm' | 'md' | 'lg';
  columns?: number; // grid일 때 컬럼 수
  className?: string;
  fullWidth?: boolean; // 전체 너비 사용 여부
  wrap?: boolean; // 가로 배치시 줄바꿈 허용
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  direction = 'horizontal',
  gap = 'md',
  columns = 2,
  className = '',
  fullWidth = false,
  wrap = false,
}) => {
  // 간격 설정 (7-10픽셀)
  const gapClasses = {
    sm: 'gap-2', // 8px
    md: 'gap-2.5', // 10px
    lg: 'gap-3', // 12px
  };

  // 방향별 기본 클래스
  const getDirectionClasses = () => {
    switch (direction) {
      case 'vertical':
        return 'flex flex-col';
      case 'grid':
        return `grid grid-cols-${columns}`;
      case 'horizontal':
      default:
        return wrap ? 'flex flex-wrap' : 'flex';
    }
  };

  // 전체 너비 클래스
  const widthClass = fullWidth ? 'w-full' : '';

  const classes = cn(
    getDirectionClasses(),
    gapClasses[gap],
    widthClass,
    className
  );

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default ButtonGroup;
