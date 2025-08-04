'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import AppHeader from '../components/AppHeader';
import BottomNavigationBar from '../components/BottomNavigationBar';

export interface LayoutWrapperProps {
  children: React.ReactNode;
}

// 사이드바 없는 깔끔한 레이아웃 (AppHeader + BottomNav만 유지)
export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 현재 경로에 따라 activeTab 설정
  const getActiveTab = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/games') return 'game';
    if (pathname === '/shop') return 'shop';
    if (pathname === '/wallet') return 'wallet';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/dashboard-new') return 'home';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = React.useState(getActiveTab());
  
  // pathname이 변경될 때마다 activeTab 업데이트
  React.useEffect(() => {
    setActiveTab(getActiveTab());
  }, [pathname]);
  
  const handleTabClick = (tabId: string, path: string) => {
    console.log(`🚀 바텀네비 클릭: ${tabId} -> ${path}`);
    setActiveTab(tabId);
    router.push(path);
  };

  const handleNotificationsClick = () => {
    console.log('Notifications clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  return (
    <Provider store={store}>
      <div className="miniapp-container">
        {/* AppHeader - 고정 상단 (CSS fixed 적용) */}
        <AppHeader
          appName="MODEL CASINO"
          onNotificationsClick={handleNotificationsClick}
          onSettingsClick={handleSettingsClick}
          hasNotifications={false}
        />
        
        {/* 메인 콘텐츠 영역 - 단일 스크롤 */}
        <div className="miniapp-content">
          {children}
        </div>
      </div>
      
      {/* BottomNavigationBar - miniapp-container 밖으로 빼서 완전 독립 */}
      <BottomNavigationBar
        activeTab={activeTab}
        onTabClick={handleTabClick}
      />
    </Provider>
  );
}
