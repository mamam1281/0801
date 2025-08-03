import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: AvatarSize;
  className?: string;
  isActive?: boolean;
  isLoading?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User Avatar',
  fallback,
  size = 'md',
  className = '',
  isActive = false,
  isLoading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!src);
  // 크기 클래스 결정
  const sizeClass = (() => {
    switch (size) {
      case 'sm': return 'w-10 h-10'; // 40px
      case 'md': return 'w-12 h-12'; // 48px
      case 'lg': return 'w-16 h-16'; // 64px
      case 'xl': return 'w-20 h-20'; // 80px
      default: return 'w-12 h-12';
    }
  })();

  // LucideIcon 크기 매핑
  const iconSizeMapping = {
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  };

  // 이모지 크기 매핑 (이모지를 더 크게 표시)
  const emojiSizeMapping = {
    sm: 'text-sm', // 14px
    md: 'text-base', // 16px
    lg: 'text-lg', // 18px
    xl: 'text-xl', // 20px
  };

  // 대체 콘텐츠 결정
  const renderFallback = () => {
    if (fallback) {
      // 이모지인지 확인 (유니코드 이모지 패턴)
      const isEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(fallback.toString());
      
      if (isEmoji) {
        return <span className={`${emojiSizeMapping[size]} leading-none`}>{fallback}</span>;
      }
      return <span className={`avatar-fallback ${size} uppercase font-semibold`}>{fallback}</span>;
    }
    if (alt && alt !== 'User Avatar') {
      // 이니셜 표시
      const initials = alt.split(' ').map(word => word.charAt(0)).join('').slice(0, 2);
      return <span className={`avatar-fallback ${size} uppercase font-semibold`}>{initials}</span>;
    }
    return <User size={iconSizeMapping[size]} className="text-[var(--color-text-secondary)]" />;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <motion.div
      className={`
        relative flex-shrink-0 rounded-full overflow-hidden
        flex items-center justify-center        bg-[var(--color-primary-charcoal)] text-[var(--color-text-secondary)]
        border-2 border-[var(--border)]        ${sizeClass} ${className}
        ${isActive ? 'border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4),_0_0_20px_rgba(34,197,94,0.2)]' : ''}
        ${(isLoading || imageLoading) ? 'avatar-shimmer-loading' : ''}
      `}      whileHover={{ 
        scale: 1.1, 
        boxShadow: isActive 
          ? '0 0 15px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.2)'
          : '0 0 8px rgba(91, 48, 246, 0.3)' 
      }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      role="img"
      aria-label={alt}
    >
      {src && !imageError ? (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary-charcoal)]">
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full w-1/3 h-1/3 border-2 border-[var(--color-purple-primary)] border-t-transparent" />
              </div>
            </div>
          )}
        </>
      ) : (        <div className="avatar-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-purple-primary)] to-[var(--color-purple-secondary)]">
          {(isLoading && !src) ? (
            <div className="animate-spin rounded-full w-1/3 h-1/3 border-2 border-white border-t-transparent" />
          ) : (
            renderFallback()
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Avatar;
