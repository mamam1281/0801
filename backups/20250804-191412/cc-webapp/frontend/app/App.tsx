'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '../components/LoadingScreen';
import { LoginScreen } from '../components/LoginScreen';
import { SignupScreen } from '../components/SignupScreen';
import { AdminLoginScreen } from '../components/AdminLoginScreen';
import { HomeDashboard } from '../components/HomeDashboard';
import { GameDashboard } from '../components/GameDashboard';
import { SettingsScreen } from '../components/SettingsScreen';
import { ShopScreen } from '../components/ShopScreen';
import { InventoryScreen } from '../components/InventoryScreen';
import { ProfileScreen } from '../components/ProfileScreen';
import { SideMenu } from '../components/SideMenu';
import { AdminPanel } from '../components/AdminPanel';
import { EventMissionPanel } from '../components/EventMissionPanel';
import { BottomNavigation } from '../components/BottomNavigation';
import { NeonSlotGame } from '../components/games/NeonSlotGame';
import { RockPaperScissorsGame } from '../components/games/RockPaperScissorsGame';
import { GachaSystem } from '../components/games/GachaSystem';
import { NeonCrashGame } from '../components/games/NeonCrashGame';
import { StreamingScreen } from '../components/StreamingScreen';
import { useNotificationSystem } from '../components/NotificationSystem';
import { useUserManager } from '../hooks/useUserManager';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useAuthHandlers } from '../hooks/useAuthHandlers';
import { 
  APP_CONFIG, 
  SCREENS_WITH_BOTTOM_NAV, 
  SCREENS_WITH_THEME_MUSIC,
  APP_VERSION,
  MAX_LOGIN_ATTEMPTS,
  DEBUG_MODE
} from '../constants/appConfig';
import { AppScreen } from '../types/screens';
import { User } from '../types/user';
import { cn } from '../components/ui/utils';

function App() {
  // 사용자 관리 및 인증 상태
  const { user, isLoggedIn, isLoading: isUserLoading, setUser, clearUser } = useUserManager();
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockExpiry, setBlockExpiry] = useState<Date | null>(null);
  
  // 화면 네비게이션
  const { 
    activeScreen, 
    screenHistory, 
    navigateTo, 
    goBack,
    isTransitioning, 
    transitionDirection 
  } = useAppNavigation();
  
  // UI 상태
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 시스템 컴포넌트
  const { 
    notifications, 
    showNotification,
    dismissNotification 
  } = useNotificationSystem();
  
  // 인증 처리
  const { 
    handleLogin, 
    handleSignup, 
    handleLogout,
    loginError, 
    signupError,
    isAuthProcessing
  } = useAuthHandlers({
    setUser,
    clearUser,
    loginAttempts,
    setLoginAttempts,
    isBlocked,
    setIsBlocked,
    setBlockExpiry,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
    showNotification
  });
  
  // 야간 모드 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsNightMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsNightMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  // 오프라인 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showNotification({
        id: 'network-restored',
        type: 'success',
        title: '네트워크 연결 복구',
        message: '인터넷 연결이 복구되었습니다.',
        duration: 3000
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      showNotification({
        id: 'network-lost',
        type: 'error',
        title: '네트워크 연결 끊김',
        message: '인터넷 연결이 끊겼습니다. 일부 기능이 제한될 수 있습니다.',
        duration: 0
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showNotification]);
  
  // 업데이트 확인
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/api/version');
        const data = await response.json();
        
        if (data.version !== APP_VERSION) {
          setIsUpdateAvailable(true);
          showNotification({
            id: 'update-available',
            type: 'info',
            title: '업데이트 가능',
            message: '새 버전이 있습니다. 새로고침하여 업데이트하세요.',
            duration: 0,
            action: {
              label: '업데이트',
              onClick: () => window.location.reload()
            }
          });
        }
      } catch (error) {
        console.error('업데이트 확인 실패:', error);
      }
    };
    
    // 앱이 준비되면 업데이트 확인
    if (isAppReady) {
      checkForUpdates();
    }
  }, [isAppReady, showNotification]);
  
  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      // 사용자 세션 확인
      // 테마 설정 로드
      // 언어 설정 로드
      // 필요한 데이터 미리 로드
      
      // 초기화 완료
      setTimeout(() => {
        setIsAppReady(true);
      }, 2000); // 로딩 화면 표시를 위한 지연
    };
    
    initializeApp();
  }, []);
  
  // 로그인 차단 타이머
  useEffect(() => {
    if (!isBlocked || !blockExpiry) return;
    
    const timer = setInterval(() => {
      if (blockExpiry && new Date() >= blockExpiry) {
        setIsBlocked(false);
        setBlockExpiry(null);
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isBlocked, blockExpiry]);
  
  // 테마 음악 설정
  useEffect(() => {
    const shouldPlayMusic = SCREENS_WITH_THEME_MUSIC.includes(activeScreen);
    
    // 테마 음악 재생/중지 로직
    
    return () => {
      // 테마 음악 정리
    };
  }, [activeScreen, isMuted, volume]);
  
  // 메뉴 토글 핸들러
  const toggleSideMenu = useCallback(() => {
    setIsSideMenuOpen(prev => !prev);
  }, []);
  
  // 볼륨 조절 핸들러
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
    setIsMuted(newVolume === 0);
  }, []);
  
  // 음소거 토글 핸들러
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  // 하단 네비게이션 표시 여부
  const showBottomNav = useMemo(() => (
    isLoggedIn && 
    SCREENS_WITH_BOTTOM_NAV.includes(activeScreen) &&
    !isTransitioning
  ), [isLoggedIn, activeScreen, isTransitioning]);
  
  // 현재 화면 렌더링
  const renderScreen = () => {
    if (!isAppReady || isUserLoading) {
      return <LoadingScreen />;
    }
    
    if (isLoggedIn) {
      switch (activeScreen) {
        case AppScreen.Home:
          return <HomeDashboard user={user!} onNavigate={navigateTo} />;
        case AppScreen.Games:
          return <GameDashboard user={user!} onNavigate={navigateTo} />;
        case AppScreen.Shop:
          return <ShopScreen user={user!} onNavigate={navigateTo} />;
        case AppScreen.Inventory:
          return <InventoryScreen user={user!} onNavigate={navigateTo} />;
        case AppScreen.Profile:
          return <ProfileScreen user={user!} onNavigate={navigateTo} />;
        case AppScreen.Settings:
          return (
            <SettingsScreen 
              user={user!} 
              onNavigate={navigateTo}
              isNightMode={isNightMode} 
              setIsNightMode={setIsNightMode}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          );
        case AppScreen.SlotGame:
          return <NeonSlotGame user={user!} onNavigate={navigateTo} />;
        case AppScreen.RPSGame:
          return <RockPaperScissorsGame user={user!} onNavigate={navigateTo} />;
        case AppScreen.GachaGame:
          return <GachaSystem user={user!} onNavigate={navigateTo} />;
        case AppScreen.CrashGame:
          return <NeonCrashGame user={user!} onNavigate={navigateTo} />;
        case AppScreen.EventMission:
          return <EventMissionPanel user={user!} onNavigate={navigateTo} />;
        case AppScreen.Streaming:
          return <StreamingScreen user={user!} onNavigate={navigateTo} />;
        case AppScreen.Admin:
          return (
            user?.role === 'admin' ? (
              <AdminPanel user={user} onNavigate={navigateTo} />
            ) : (
              <AdminLoginScreen onNavigate={navigateTo} />
            )
          );
        default:
          return <HomeDashboard user={user!} onNavigate={navigateTo} />;
      }
    }
    
    // 비로그인 상태 화면
    switch (activeScreen) {
      case AppScreen.Login:
        return (
          <LoginScreen 
            onLogin={handleLogin}
            onNavigateToSignup={() => navigateTo(AppScreen.Signup)}
            isProcessing={isAuthProcessing}
            error={loginError}
            isBlocked={isBlocked}
            blockExpiry={blockExpiry}
            attemptCount={loginAttempts}
            maxAttempts={MAX_LOGIN_ATTEMPTS}
          />
        );
      case AppScreen.Signup:
        return (
          <SignupScreen 
            onSignup={handleSignup}
            onNavigateToLogin={() => navigateTo(AppScreen.Login)}
            isProcessing={isAuthProcessing}
            error={signupError}
          />
        );
      case AppScreen.Admin:
        return <AdminLoginScreen onNavigate={navigateTo} />;
      default:
        return (
          <LoginScreen 
            onLogin={handleLogin}
            onNavigateToSignup={() => navigateTo(AppScreen.Signup)}
            isProcessing={isAuthProcessing}
            error={loginError}
            isBlocked={isBlocked}
            blockExpiry={blockExpiry}
            attemptCount={loginAttempts}
            maxAttempts={MAX_LOGIN_ATTEMPTS}
          />
        );
    }
  };

  // 화면 전환 애니메이션 설정
  const getTransitionVariants = () => {
    switch (transitionDirection) {
      case 'forward':
        return {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -20 },
          transition: { duration: 0.3, ease: "easeInOut" }
        };
      case 'backward':
        return {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
          transition: { duration: 0.3, ease: "easeInOut" }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 }
        };
    }
  };

  return (
    <div className={cn("min-h-screen bg-background", isNightMode ? "dark" : "")}>
      {/* 오프라인 알림 */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center text-sm">
          오프라인 모드 - 인터넷 연결을 확인해주세요
        </div>
      )}
      
      {/* 업데이트 알림 */}
      {isUpdateAvailable && (
        <div 
          className="fixed top-12 left-0 right-0 z-50 bg-amber-500 text-white p-2 text-center text-sm cursor-pointer"
          onClick={() => window.location.reload()}
        >
          새 버전이 있습니다. 클릭하여 업데이트하세요.
        </div>
      )}
      
      {/* 디버그 모드 표시 */}
      {DEBUG_MODE && (
        <div className="fixed top-0 right-0 z-50 bg-purple-500 text-white px-2 py-1 text-xs opacity-50">
          디버그 모드 v{APP_VERSION}
        </div>
      )}
      
      {/* 사이드 메뉴 */}
      {isLoggedIn && (
        <SideMenu 
          user={user!}
          isOpen={isSideMenuOpen} 
          onClose={() => setIsSideMenuOpen(false)}
          onLogout={handleLogout}
          onNavigate={navigateTo}
        />
      )}
      
      {/* 메인 콘텐츠 영역 */}
      <main className="relative min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            className="flex-1 flex flex-col"
            {...getTransitionVariants()}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
        
        {/* 하단 네비게이션 */}
        {showBottomNav && (
          <BottomNavigation 
            activeScreen={activeScreen}
            onNavigate={navigateTo}
            onMenuToggle={toggleSideMenu}
          />
        )}
      </main>
    </div>
  );
}

export default App;
