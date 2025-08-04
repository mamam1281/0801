import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'info' | 'outline' | 'text' | 'neon' | 'glass' | 'animated';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  rounded?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  ripple?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  rounded = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  children,
  onClick,
  type = 'button',
  ripple = false,
}) => {
  const [coords, setCoords] = React.useState({ x: -1, y: -1 });
  const [isRippling, setIsRippling] = React.useState(false);
  
  React.useEffect(() => {
    if (coords.x !== -1 && coords.y !== -1) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    } else {
      setIsRippling(false);
    }
  }, [coords]);

  React.useEffect(() => {
    if (!isRippling) setCoords({ x: -1, y: -1 });
  }, [isRippling]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && !disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    if (onClick) onClick(e);
  };

  // 크기별 스타일 매핑
  const sizeStyles = {
    xs: { height: '32px', padding: '8px 12px', fontSize: '12px' },
    sm: { height: '36px', padding: '10px 16px', fontSize: '13px' },
    md: { height: '44px', padding: '12px 20px', fontSize: '14px' },
    lg: { height: '56px', padding: '16px 32px', fontSize: '16px' },
  };

  // 변형별 스타일 매핑
  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.12) 50%, rgba(192, 132, 252, 0.1) 100%)',
      color: '#f8fafc',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
      hoverBackground: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.17) 50%, rgba(192, 132, 252, 0.15) 100%)',
    },
    secondary: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 100%)',
      color: '#e2e8f0',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.03)',
      hoverBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.03) 100%)',
    },
    accent: {
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(249, 115, 22, 0.1) 50%, rgba(239, 68, 68, 0.08) 100%)',
      color: '#fef2f2',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
      hoverBackground: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(249, 115, 22, 0.15) 50%, rgba(239, 68, 68, 0.12) 100%)',
    },
  };

  const iconSizeMap = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
  };

  const currentIconSize = iconSizeMap[size] || iconSizeMap.md;
  const currentSizeStyle = sizeStyles[size];
  const currentVariantStyle = variantStyles[variant] || variantStyles.primary;

  const renderContent = () => {
    if (iconOnly) {
      return Icon ? <Icon size={currentIconSize} /> : null;
    }
    if (Icon) {
      return (
        <>
          {iconPosition === 'left' && <Icon size={currentIconSize} className={children ? "mr-2" : ""} />}
          {children}
          {iconPosition === 'right' && <Icon size={currentIconSize} className={children ? "ml-2" : ""} />}
        </>
      );
    }
    return children;
  };

  return (
    <motion.button
      type={type}
      className={`relative overflow-hidden font-medium transition-all duration-300 ${
        rounded ? 'rounded-full' : 'rounded-2xl'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{
        ...currentSizeStyle,
        ...currentVariantStyle,
        textShadow: 'none',
      }}
      onClick={handleClick}
      disabled={disabled}
      whileHover={
        !disabled
          ? {
              scale: 1.02,
              y: -1,
              background: currentVariantStyle.hoverBackground,
              boxShadow: `0 12px 40px ${
                variant === 'primary'
                  ? 'rgba(139, 92, 246, 0.3)'
                  : variant === 'accent'
                  ? 'rgba(245, 158, 11, 0.25)'
                  : 'rgba(0, 0, 0, 0.25)'
              }, inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08)`,
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.98, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* 컨텐츠 */}
      <span className="relative z-10 flex items-center justify-center">
        {renderContent()}
      </span>

      {/* 리플 효과 */}
      {ripple && isRippling && (
        <motion.span
          className="absolute rounded-full bg-white/30"
          style={{
            left: coords.x - 10,
            top: coords.y - 10,
            width: 20,
            height: 20,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  );
};

export default Button;
