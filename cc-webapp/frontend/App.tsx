'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { HomeDashboard } from './components/HomeDashboard';
import { GameDashboard } from './components/GameDashboard';
import { SettingsScreen } from './components/SettingsScreen';
import { ShopScreen } from './components/ShopScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SideMenu } from './components/SideMenu';
import { AdminPanel } from './components/AdminPanel';
import { EventMissionPanel } from './components/EventMissionPanel';
import { BottomNavigation } from './components/BottomNavigation';
import { NeonSlotGame } from './components/games/NeonSlotGame';
import { RockPaperScissorsGame } from './components/games/RockPaperScissorsGame';
import { GachaSystem } from './components/games/GachaSystem';
import { NeonCrashGame } from './components/games/NeonCrashGame';
import { StreamingScreen } from './components/StreamingScreen';
import { useNotificationSystem } from './components/NotificationSystem';
import { useUserManager } from './hooks/useUserManager';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { 
  APP_CONFIG, 
  SCREENS_WITH_BOTTOM_NAV, 
  NOTIFICATION_MESSAGES 
} from './constants/appConstants';
import { NOTIFICATION_STYLES } from './constants/notificationConstants';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 🎯 커스텀 훅으로 상태 관리 분리
  const {
    user,
    updateUser,
    isAdminAccount,
    createUserData,
    restoreSavedUser,
    processDailyBonus,
    logout
  } = useUserManager();

  const {
    currentScreen,
    isSideMenuOpen,
    navigationHandlers,
    toggleSideMenu,
    closeSideMenu,
    handleBottomNavigation
  } = useAppNavigation();

  // 📱 알림 시스템
  const { notifications, addNotification } = useNotificationSystem();

  // 🔐 인증 핸들러들
  const { handleLogin, handleSignup, handleAdminLogin, handleLogout } = useAuthHandlers({
    setIsLoading,
    isAdminAccount,
    createUserData,
    updateUser,
    navigationHandlers,
    addNotification,
    logout,
    closeSideMenu
  });

  // 🔄 앱 초기화 - 한 번만 실행되도록 개선
  useEffect(() => {
    if (hasInitialized) return;

    const initializeApp = async () => {
      try {
        const savedUser = restoreSavedUser();
        if (savedUser) {
          updateUser(savedUser);
          navigationHandlers.toHome();
          
          // 🎁 일일 보너스 체크
          const lastLogin = new Date(savedUser.lastLogin);
          const today = new Date();
          const timeDiff = today.getTime() - lastLogin.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
          
          if (daysDiff >= 1) {
            const { updatedUser, bonusGold } = processDailyBonus(savedUser);
            updateUser(updatedUser);
            addNotification(NOTIFICATION_MESSAGES.DAILY_BONUS(bonusGold, updatedUser.dailyStreak));
          }
        }
        
        setHasInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setHasInitialized(true);
      }
    };

    initializeApp();
  }, [hasInitialized, restoreSavedUser, updateUser, navigationHandlers, processDailyBonus, addNotification]);

  // 🏠 하단 네비게이션 표시 여부 결정 (메모이제이션)
  const showBottomNavigation = useMemo(() => {
    return SCREENS_WITH_BOTTOM_NAV.includes(currentScreen as any) && user;
  }, [currentScreen, user]);

  return (
    <div className="dark">
      {/* 📱 🎯 VIP 알림 시스템 */}
      <div className={NOTIFICATION_STYLES.CONTAINER}>
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={NOTIFICATION_STYLES.ANIMATION.INITIAL}
              animate={NOTIFICATION_STYLES.ANIMATION.ANIMATE}
              exit={NOTIFICATION_STYLES.ANIMATION.EXIT}
              className={NOTIFICATION_STYLES.ITEM}
            >
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 🔧 사이드 메뉴 */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={closeSideMenu}
        user={user}
        onNavigateToAdminPanel={navigationHandlers.toAdminPanel}
        onNavigateToEventMissionPanel={navigationHandlers.toEventMissionPanel}
        onNavigateToSettings={navigationHandlers.toSettings}
        onLogout={handleLogout}
        onAddNotification={addNotification}
      />

      {/* 📱 메인 화면들 */}
      <AnimatePresence mode="wait">
        {currentScreen === 'loading' && (
          <LoadingScreen 
            key="loading" 
            onComplete={navigationHandlers.toLogin} 
            gameTitle={APP_CONFIG.GAME_TITLE} 
          />
        )}
        
        {currentScreen === 'login' && (
          <LoginScreen
            key="login"
            onLogin={handleLogin}
            onSwitchToSignup={navigationHandlers.toSignup}
            onAdminAccess={navigationHandlers.toAdminLogin}
            isLoading={isLoading}
          />
        )}
        
        {currentScreen === 'signup' && (
          <SignupScreen
            key="signup"
            onSignup={handleSignup}
            onBackToLogin={navigationHandlers.toLogin}
            isLoading={isLoading}
          />
        )}
        
        {currentScreen === 'admin-login' && (
          <AdminLoginScreen
            key="admin-login"
            onAdminLogin={handleAdminLogin}
            onBackToLogin={navigationHandlers.toLogin}
            isLoading={isLoading}
          />
        )}
        
        {currentScreen === 'home-dashboard' && user && (
          <HomeDashboard
            key="home-dashboard"
            user={user}
            onLogout={handleLogout}
            onNavigateToGames={navigationHandlers.toGames}
            onNavigateToShop={navigationHandlers.toShop}
            onNavigateToSettings={navigationHandlers.toSettings}
            onNavigateToStreaming={navigationHandlers.toStreaming}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
            onToggleSideMenu={toggleSideMenu}
          />
        )}
        
        {currentScreen === 'game-dashboard' && user && (
          <GameDashboard
            key="game-dashboard"
            user={user}
            onNavigateToHome={navigationHandlers.toHome}
            onNavigateToSlot={navigationHandlers.toSlot}
            onNavigateToRPS={navigationHandlers.toRPS}
            onNavigateToGacha={navigationHandlers.toGacha}
            onNavigateToCrash={() => navigationHandlers.navigate('neon-crash')}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
            onToggleSideMenu={toggleSideMenu}
          />
        )}

        {currentScreen === 'shop' && user && (
          <ShopScreen
            key="shop"
            user={user}
            onBack={navigationHandlers.backToHome}
            onNavigateToInventory={navigationHandlers.toInventory}
            onNavigateToProfile={navigationHandlers.toProfile}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'inventory' && user && (
          <InventoryScreen
            key="inventory"
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'profile' && user && (
          <ProfileScreen
            key="profile"
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'settings' && user && (
          <SettingsScreen
            key="settings"
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'admin-panel' && user && (
          <AdminPanel
            key="admin-panel"
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'event-mission-panel' && user && (
          <EventMissionPanel
            key="event-mission-panel"
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {/* 🎮 게임들 */}
        {currentScreen === 'neon-slot' && user && (
          <NeonSlotGame
            key="neon-slot"
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'rock-paper-scissors' && user && (
          <RockPaperScissorsGame
            key="rock-paper-scissors"
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'gacha-system' && user && (
          <GachaSystem
            key="gacha-system"
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'neon-crash' && user && (
          <NeonCrashGame
            key="neon-crash"
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}

        {currentScreen === 'streaming' && user && (
          <StreamingScreen
            key="streaming"
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
        )}
      </AnimatePresence>

      {/* 📱 하단 네비게이션 */}
      {showBottomNavigation && (
        <BottomNavigation 
          currentScreen={currentScreen}
          onNavigate={handleBottomNavigation}
          user={user}
        />
      )}
    </div>
  );
}