import React, { useState } from 'react';
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
    // 항상 사람 아이콘 표시
    return <User size={iconSizeMapping[size]} className="text-gray-400" />;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <div
      className={`
        relative flex-shrink-0 rounded-full overflow-hidden
        flex items-center justify-center bg-gray-800 text-gray-300
        border-2 border-gray-600 ${sizeClass} ${className}
        ${isActive ? 'border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4),_0_0_20px_rgba(34,197,94,0.2)]' : ''}
        ${(isLoading || imageLoading) ? 'animate-pulse' : ''}
      `}
      role="img"
      aria-label={alt}
    >
      {/* 항상 사람 아이콘 표시 */}
      <div className="avatar-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <User size={iconSizeMapping[size]} className="text-white" />
      </div>
    </div>
  );
};

export default Avatar;