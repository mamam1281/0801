import { useCallback } from 'react';
import { 
  APP_CONFIG, 
  ADMIN_SECURITY_CODE, 
  NOTIFICATION_MESSAGES 
} from '../constants/appConstants';
import { User } from '../types';
import { authApi, setTokens } from '../utils/api';

interface AuthHandlersProps {
  setIsLoading: (loading: boolean) => void;
  isAdminAccount: (nickname: string, password: string) => boolean;
  createUserData: (nickname: string, password: string, isSignup?: boolean, inviteCode?: string) => User;
  updateUser: (user: User) => void;
  navigationHandlers: any;
  addNotification: (message: string) => void;
  logout: () => void;
  closeSideMenu: () => void;
}

export function useAuthHandlers({
  setIsLoading,
  isAdminAccount,
  createUserData,
  updateUser,
  navigationHandlers,
  addNotification,
  logout,
  closeSideMenu
}: AuthHandlersProps) {

  // 🔐 로그인 처리
  const handleLogin = useCallback(async (siteId: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 실제 API 호출
      const response = await authApi.login(siteId, password);
      
      // 토큰 저장
      setTokens(response.access_token, response.refresh_token);
      
      // 사용자 정보 조회
      const userProfile = await authApi.getCurrentUser();
      
      // 사용자 정보 업데이트 - API 응답을 앱 내부 형식으로 변환
      const userData = createUserData(
        userProfile.nickname,
        '',  // 비밀번호는 저장하지 않음
        false,
        ''   // 초대코드는 필요 없음
      );
      
      // API 응답에서 가져온 추가 데이터로 업데이트
      userData.id = userProfile.id.toString();
      userData.goldBalance = userProfile.cyber_token_balance;
      userData.isAdmin = userProfile.is_admin;
      userData.lastLogin = new Date(userProfile.last_login || Date.now());
      
      updateUser(userData);
      navigationHandlers.toHome();
      addNotification(NOTIFICATION_MESSAGES.LOGIN_SUCCESS(userData.nickname, userData.isAdmin));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      setIsLoading(false);
      return false;
    }
  }, [updateUser, navigationHandlers, addNotification, setIsLoading]);

  // 📝 회원가입 처리
  const handleSignup = useCallback(async (formData: any): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 실제 API 호출로 회원가입
      const response = await authApi.register(
        formData.inviteCode,
        formData.nickname,
        formData.userId, // 사이트 ID로 사용
        formData.phoneNumber,
        formData.password
      );
      
      // 토큰 저장
      setTokens(response.access_token, response.refresh_token);
      
      // 사용자 정보 조회
      const userProfile = await authApi.getCurrentUser();
      
      // 사용자 정보 업데이트
      const userData = createUserData(
        userProfile.nickname,
        '',  // 비밀번호는 저장하지 않음
        true,
        formData.inviteCode
      );
      
      // API 응답에서 가져온 추가 데이터로 업데이트
      userData.id = userProfile.id.toString();
      userData.goldBalance = userProfile.cyber_token_balance;
      userData.isAdmin = userProfile.is_admin;
      userData.lastLogin = new Date(userProfile.last_login || Date.now());
      
      updateUser(userData);
      navigationHandlers.toHome();
      addNotification(NOTIFICATION_MESSAGES.SIGNUP_SUCCESS(userData.goldBalance));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('회원가입 실패:', error);
      setIsLoading(false);
      return false;
    }
  }, [createUserData, updateUser, navigationHandlers, addNotification, setIsLoading]);

  // 🔐 관리자 로그인 처리
  const handleAdminLogin = useCallback(async (
    adminId: string, 
    password: string, 
    securityCode?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 보안 코드 확인 (로컬에서만)
      const isValidSecurity = !securityCode || securityCode === ADMIN_SECURITY_CODE;
      if (!isValidSecurity) {
        setIsLoading(false);
        return false;
      }
      
      // 관리자 로그인 - 일반 로그인 API 사용
      const response = await authApi.login(adminId, password);
      
      // 토큰 저장
      setTokens(response.access_token, response.refresh_token);
      
      // 사용자 정보 조회
      const userProfile = await authApi.getCurrentUser();
      
      // 실제로 관리자인지 확인
      if (!userProfile.is_admin) {
        setIsLoading(false);
        throw new Error('관리자 권한이 없습니다.');
      }
      
      // 사용자 정보 업데이트
      const userData = createUserData(
        userProfile.nickname,
        '',  // 비밀번호는 저장하지 않음
        false,
        ''   // 초대코드는 필요 없음
      );
      
      // API 응답에서 가져온 추가 데이터로 업데이트
      userData.id = userProfile.id.toString();
      userData.goldBalance = userProfile.cyber_token_balance;
      userData.isAdmin = userProfile.is_admin;
      userData.lastLogin = new Date(userProfile.last_login || Date.now());
      
      updateUser(userData);
      addNotification(NOTIFICATION_MESSAGES.ADMIN_LOGIN_SUCCESS);
      navigationHandlers.toAdminPanel();
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('관리자 로그인 실패:', error);
      setIsLoading(false);
      return false;
    }
  }, [createUserData, updateUser, navigationHandlers, addNotification, setIsLoading]);

  // 🚪 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      // 실제 API 호출로 로그아웃
      await authApi.logout();
      
      // 로컬 로그아웃 처리
      logout();
      closeSideMenu();
      navigationHandlers.toLogin();
      addNotification(NOTIFICATION_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 오류가 있더라도 로컬 로그아웃은 진행
      logout();
      closeSideMenu();
      navigationHandlers.toLogin();
      addNotification('로그아웃 되었습니다. (오프라인 모드)');
    }
  }, [logout, closeSideMenu, navigationHandlers, addNotification]);

  return {
    handleLogin,
    handleSignup,
    handleAdminLogin,
    handleLogout
  };
}