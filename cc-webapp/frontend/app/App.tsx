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
// NOTE: Deprecated useAuthHandlers (local simulation) removed – now using real backend auth via useAuth
import { useAuth } from '../hooks/useAuth';
import { 
  APP_CONFIG, 
  SCREENS_WITH_BOTTOM_NAV, 
  NOTIFICATION_MESSAGES 
} from '../constants/appConstants';
import { NOTIFICATION_STYLES } from '../constants/notificationConstants';

type NotificationItem = { id: string | number; message: React.ReactNode };

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

  // 🔐 실제 백엔드 인증 훅 (JWT 토큰 저장 & 프로필 fetch)
  const auth = useAuth();

  // ---------------------------------------------------------------------------
  // Backend 연동 어댑터 함수들
  // 기존 컴포넌트들은 nickname 기반 User (game-user) 객체를 기대하므로
  // 서버 인증 성공 후 기존 createUserData 로 UI용 사용자 상태를 구성 (임시)
  // 향후: 서버 프로필 스키마와 UI User 타입 통합 예정.
  // ---------------------------------------------------------------------------

  const handleLogin = React.useCallback(async (nickname: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // backend login 은 site_id 를 요구 – 현재 UI 입력 nickname 을 site_id 로 간주
      await auth.login(nickname, password); // 실패 시 throw
      const userData = createUserData(nickname, password, false);
      updateUser(userData);
      navigationHandlers.toHome();
      addNotification(NOTIFICATION_MESSAGES.LOGIN_SUCCESS(nickname, isAdminAccount(nickname, password)));
      return true;
    } catch (e) {
      console.error('[App] 로그인 실패:', e);
      return false;
    } finally { setIsLoading(false); }
  }, [auth, setIsLoading, createUserData, updateUser, navigationHandlers, addNotification, isAdminAccount]);

  const handleSignup = React.useCallback(async (formData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      // formData: { userId, nickname, phoneNumber, password, confirmPassword, inviteCode }
      await auth.signup({
        site_id: formData.userId,
        nickname: formData.nickname,
        phone_number: formData.phoneNumber,
        password: formData.password,
        invite_code: formData.inviteCode || ''
      });
      const userData = createUserData(formData.nickname, '', true, formData.inviteCode);
      updateUser(userData);
      navigationHandlers.toHome();
      addNotification(NOTIFICATION_MESSAGES.SIGNUP_SUCCESS(userData.goldBalance));
      return true;
    } catch (e) {
      console.error('[App] 회원가입 실패:', e);
      return false;
    } finally { setIsLoading(false); }
  }, [auth, setIsLoading, createUserData, updateUser, navigationHandlers, addNotification]);

  const handleAdminLogin = React.useCallback(async (adminId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await auth.login(adminId, password);
      if (!isAdminAccount(adminId, password)) {
        console.warn('[App] 관리자 계정이 아님 – 토큰 폐기');
        try { auth.logout(); } catch { /* ignore */ }
        logout();
        return false; // UI 에 실패 처리
      }
      const adminUser = createUserData(adminId, password, false);
      updateUser(adminUser);
      addNotification(NOTIFICATION_MESSAGES.ADMIN_LOGIN_SUCCESS);
      navigationHandlers.toAdminPanel();
      return true;
    } catch (e) {
      console.error('[App] 관리자 로그인 실패:', e);
      return false;
    } finally { setIsLoading(false); }
  }, [auth, setIsLoading, createUserData, updateUser, navigationHandlers, addNotification, isAdminAccount]);

  const handleLogout = React.useCallback(() => {
    try { auth.logout(); } catch { /* ignore */ }
    logout(); // UI user state
    closeSideMenu();
    navigationHandlers.toLogin();
    addNotification(NOTIFICATION_MESSAGES.LOGOUT_SUCCESS);
  }, [auth, logout, closeSideMenu, navigationHandlers, addNotification]);

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
          {notifications.map((notification: NotificationItem) => (
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
          <React.Fragment key="loading">
          <LoadingScreen
            onComplete={navigationHandlers.toLogin}
            gameTitle={APP_CONFIG.GAME_TITLE}
          />
          </React.Fragment>
        )}

        {currentScreen === 'login' && (
          <React.Fragment key="login">
          <LoginScreen
            onLogin={handleLogin}
            onSwitchToSignup={navigationHandlers.toSignup}
            onAdminAccess={navigationHandlers.toAdminLogin}
            isLoading={isLoading}
          />
          </React.Fragment>
        )}

        {currentScreen === 'signup' && (
          <React.Fragment key="signup">
          <SignupScreen
            onSignup={handleSignup}
            onBackToLogin={navigationHandlers.toLogin}
            isLoading={isLoading}
          />
          </React.Fragment>
        )}

        {currentScreen === 'admin-login' && (
          <React.Fragment key="admin-login">
          <AdminLoginScreen
            onAdminLogin={handleAdminLogin}
            onBackToLogin={navigationHandlers.toLogin}
            isLoading={isLoading}
          />
          </React.Fragment>
        )}

        {currentScreen === 'home-dashboard' && user && (
          <React.Fragment key="home-dashboard">
          <HomeDashboard
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
          </React.Fragment>
        )}

        {currentScreen === 'game-dashboard' && user && (
          <React.Fragment key="game-dashboard">
          <GameDashboard
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
          </React.Fragment>
        )}

        {currentScreen === 'shop' && user && (
          <React.Fragment key="shop">
          <ShopScreen
            user={user}
            onBack={navigationHandlers.backToHome}
            onNavigateToInventory={navigationHandlers.toInventory}
            onNavigateToProfile={navigationHandlers.toProfile}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'inventory' && user && (
          <React.Fragment key="inventory">
          <InventoryScreen
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'profile' && user && (
          <React.Fragment key="profile">
          <ProfileScreen
            onBack={navigationHandlers.backToHome}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'settings' && user && (
          <React.Fragment key="settings">
          <SettingsScreen
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'admin-panel' && user && (
          <React.Fragment key="admin-panel">
          <AdminPanel
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'event-mission-panel' && user && (
          <React.Fragment key="event-mission-panel">
          <EventMissionPanel
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {/* 🎮 게임들 */}
        {currentScreen === 'neon-slot' && user && (
          <React.Fragment key="neon-slot">
          <NeonSlotGame
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'rock-paper-scissors' && user && (
          <React.Fragment key="rock-paper-scissors">
          <RockPaperScissorsGame
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'gacha-system' && user && (
          <React.Fragment key="gacha-system">
          <GachaSystem
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'neon-crash' && user && (
          <React.Fragment key="neon-crash">
          <NeonCrashGame
            user={user}
            onBack={navigationHandlers.backToGames}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
        )}

        {currentScreen === 'streaming' && user && (
          <React.Fragment key="streaming">
          <StreamingScreen
            user={user}
            onBack={navigationHandlers.backToHome}
            onUpdateUser={updateUser}
            onAddNotification={addNotification}
          />
          </React.Fragment>
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
