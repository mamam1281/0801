import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Settings, Home, Menu } from 'lucide-react';
import Button from './Button';
import { useRouter, usePathname } from 'next/navigation';
import MenuModal from './ui/navigation/MenuModal';

export interface AppHeaderProps {
  appName: string;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onMenuClick?: () => void;
  hasNotifications?: boolean;
  // New responsive props
  compact?: boolean; // For minimal header layout
  showAppName?: boolean; // Control app name visibility
}

const AppHeader: React.FC<AppHeaderProps> = ({
  appName,
  onNotificationsClick,
  onSettingsClick,
  onMenuClick,
  hasNotifications = false,
  compact = false,
  showAppName = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if we're on the home page
  const isHomePage = pathname === '/';

  // Handle back navigation
  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleNotificationsClick = () => {
    console.log('Notifications clicked');
    router.push('/notifications');
    onNotificationsClick?.();
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    router.push('/settings');
    onSettingsClick?.();
  };
  
  const handleMenuClick = () => {
    console.log('Menu clicked');
    setIsMenuOpen(true);
    onMenuClick?.();
  };

  // Back Button Component
  const BackButton = () => {
    if (isHomePage) {
      return (
        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-white/20 active:scale-95 transition-all duration-normal rounded-full text-white"
          aria-label="홈"
        >
          <Home size={compact ? 18 : 20} />
        </button>
      );
    }
    
    return (
      <button
        onClick={handleBackClick}
        className="p-2 hover:bg-white/20 active:scale-95 transition-all duration-normal rounded-full text-white"
        aria-label="뒤로가기"
      >
        <ArrowLeft size={compact ? 18 : 20} />
      </button>
    );
  };

  // Responsive app name component
  const AppName = () => {
    if (!showAppName) return null;
    
    return (
      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 min-w-0">
        <span 
          className={`${compact ? 'text-lg' : 'text-xl'} font-bold truncate text-center max-w-full`} 
          style={{ 
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: '700',
            letterSpacing: '0.03em',
            textShadow: '0 0 15px rgba(255, 255, 255, 0.2)'
          }}
        >
          {appName}
        </span>
      </div>
    );
  };

  // Responsive action buttons
  const ActionButtons = () => {
    const buttonSize = compact ? "sm" : "md";
    const iconSize = compact ? 18 : 20;
    const baseButtonClasses = "p-1 hover:bg-white/20 active:scale-95 transition-all duration-normal rounded-full";
    
    // 로그인/회원가입/프로필 페이지 여부 확인
    const isAuthPage = pathname?.includes('/auth') || pathname?.includes('/profile');
    
    if (isAuthPage) {
      return <div className="px-3" />; // 인증 페이지에서는 빈 공간만 제공
    }
    
    return (
      <div className="flex items-center gap-2 flex-shrink-0 px-3">
        <button
          onClick={handleNotificationsClick}
          className={`${baseButtonClasses} ${hasNotifications ? 'text-amber-400' : 'text-white'}`}
          aria-label="알림"
        >
          <Bell size={iconSize} />
        </button>
        
        <button
          onClick={handleSettingsClick}
          className={`${baseButtonClasses} text-white`}
          aria-label="설정"
        >
          <Settings size={iconSize} />
        </button>
        
        <button
          onClick={handleMenuClick}
          className={`${baseButtonClasses} text-white`}
          aria-label="메뉴"
        >
          <Menu size={iconSize} />
        </button>
      </div>
    );
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 w-full h-16 border-b border-gray-700 flex justify-center z-50"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(26, 26, 26, 0.98)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #2d3748',
          width: '100%',
          height: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 50,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div className="w-full max-w-[420px] flex items-center h-full relative px-3">
          {/* Left: Back/Home Button */}
          <BackButton />

          {/* Center: App Name */}
          <AppName />

          {/* Right: Action Icons */}
          <ActionButtons />
        </div>
      </header>

      {/* 메뉴 모달 */}
      <MenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </>
  );
};

export default AppHeader;
