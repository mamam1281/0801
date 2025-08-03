import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import BottomNavigationBar, { navItems } from './BottomNavigationBar';
import React, { useState } from 'react';

const meta: Meta<typeof BottomNavigationBar> = {
  title: 'Layout/BottomNavigationBar',
  component: BottomNavigationBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },
    docs: {
      description: {
        component: `
BottomNavigationBar는 모바일 앱의 주요 네비게이션을 담당하는 컴포넌트입니다.

**주요 특징:**
- 모바일 기기에서만 표시 (768px 미만)
- 하단 고정 위치 (fixed positioning)
- Framer Motion을 활용한 탭 애니메이션
- Backdrop blur와 그림자 효과 적용
- 활성 탭에 pulse 인디케이터 표시
- Safe Area Inset 지원

**적용된 CSS 효과:**
- \`backdrop-filter: blur(8px)\` - 블러 배경
- \`box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.4)\` - 상단 그림자
- \`background: rgba(34, 34, 34, 0.8)\` - 반투명 배경
- 활성 탭 pulse 애니메이션 (\`animate-pulse\`)
        `,
      },
    },
  },
  argTypes: {
    activeTab: {
      control: { type: 'select' },
      options: navItems.map(item => item.id),
      description: '현재 활성화된 탭의 ID',
    },
    onTabClick: {
      action: 'tab-clicked',
      description: '탭 클릭 시 호출되는 콜백 함수',
    },
  },
};
export default meta;

type Story = StoryObj<typeof BottomNavigationBar>;

export const Default: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState('home');
    return (
      <div className="relative min-h-[500px] bg-background overflow-hidden">
        <div className="p-4 pb-20">
          <h3 className="text-foreground mb-4 text-h3">바텀 네비게이션 바</h3>
          <p className="text-muted-foreground text-body mb-6">모바일 전용 하단 고정 네비게이션</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">현재 상태</h4>
              <p className="text-muted-foreground text-sm">활성 탭: <span className="text-purple-primary font-medium">{activeTab}</span></p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">적용된 시각 효과</h4>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>• Backdrop blur (8px) - 배경 블러 효과</li>
                <li>• 상단 그림자 (0 -4px 15px)</li>
                <li>• 반투명 배경 (rgba(34, 34, 34, 0.8))</li>                <li>• 활성 탭 그라데이션 인디케이터 바</li>
                <li>• Framer Motion layoutId 전환 애니메이션</li>
                <li>• Safe Area Inset 지원</li>
              </ul>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">반응형 동작</h4>
              <p className="text-muted-foreground text-sm">
                768px 이상에서는 자동으로 숨겨집니다 (데스크톱에서는 사이드바 네비게이션 사용)
              </p>
            </div>
          </div>
        </div>
        <BottomNavigationBar
          activeTab={activeTab}
          onTabClick={(tabId, path) => setActiveTab(tabId)}
        />
      </div>
    );
  },
  args: {
    activeTab: 'home',
    onTabClick: () => {},
  },
};

// 다양한 탭 활성화 상태를 보여주는 추가 스토리들
export const GameTab: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState('game');
    return (
      <div className="relative min-h-[500px] bg-gray-900 overflow-hidden">
        <div className="p-4 pb-20">
          <h3 className="text-foreground mb-4 text-h3">게임 탭 활성화</h3>          <p className="text-muted-foreground text-body mb-4">게임 탭이 활성화된 상태</p>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-muted-foreground text-sm">
              게임 탭의 Gamepad 아이콘 위에 보라색 그라데이션 인디케이터 바가 표시됩니다.
            </p>
          </div>
        </div>
        <BottomNavigationBar
          activeTab={activeTab}
          onTabClick={(tabId, path) => setActiveTab(tabId)}
        />
      </div>
    );
  },
  args: {
    activeTab: 'game',
    onTabClick: () => {},
  },
};

export const ShopTab: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState('shop');
    return (
      <div className="relative min-h-[500px] bg-gray-900 overflow-hidden">
        <div className="p-4 pb-20">
          <h3 className="text-foreground mb-4 text-h3">상점 탭 활성화</h3>          <p className="text-muted-foreground text-body mb-4">상점 탭이 활성화된 상태</p>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-muted-foreground text-sm">
              상점 탭의 Store 아이콘 위에 보라색 그라데이션 인디케이터 바가 표시됩니다.
            </p>
          </div>
        </div>
        <BottomNavigationBar
          activeTab={activeTab}
          onTabClick={(tabId, path) => setActiveTab(tabId)}
        />
      </div>
    );
  },
  args: {
    activeTab: 'shop',
    onTabClick: () => {},
  },
};

export const CommunityTab: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState('community');
    return (
      <div className="relative min-h-[500px] bg-gray-900 overflow-hidden">
        <div className="p-4 pb-20">
          <h3 className="text-foreground mb-4 text-h3">커뮤니티 탭 활성화</h3>          <p className="text-muted-foreground text-body mb-4">커뮤니티 탭이 활성화된 상태</p>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-muted-foreground text-sm">
              커뮤니티 탭의 Users 아이콘 위에 보라색 그라데이션 인디케이터 바가 표시됩니다.
            </p>
          </div>
        </div>
        <BottomNavigationBar
          activeTab={activeTab}
          onTabClick={(tabId, path) => setActiveTab(tabId)}
        />
      </div>
    );
  },
  args: {
    activeTab: 'community',
    onTabClick: () => {},
  },
};

export const ProfileTab: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState('profile');
    return (
      <div className="relative min-h-[500px] bg-gray-900 overflow-hidden">
        <div className="p-4 pb-20">
          <h3 className="text-foreground mb-4 text-h3">프로필 탭 활성화</h3>          <p className="text-muted-foreground text-body mb-4">프로필 탭이 활성화된 상태</p>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-muted-foreground text-sm">
              프로필 탭의 User 아이콘 위에 보라색 그라데이션 인디케이터 바가 표시됩니다.
            </p>
          </div>
        </div>
        <BottomNavigationBar
          activeTab={activeTab}
          onTabClick={(tabId, path) => setActiveTab(tabId)}
        />
      </div>
    );
  },
  args: {
    activeTab: 'profile',
    onTabClick: () => {},
  },
};

// 인터랙티브 스토리 - 모든 탭을 클릭해볼 수 있음
export const Interactive: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState('home');
    const [clickCount, setClickCount] = useState(0);
    
    const handleTabClick = (tabId: string, path: string) => {
      console.log('Tab clicked:', tabId, path); // 디버깅용 로그
      setActiveTab(tabId);
      setClickCount(prev => prev + 1);
      // Storybook Actions 패널에도 기록
      action('tab-clicked')(tabId, path);
    };
      return (
      <div className="relative min-h-[500px] bg-gray-900 overflow-hidden">
        <div className="p-4 pb-20">
          <h3 className="text-foreground mb-4 text-h3">인터랙티브 테스트</h3>
          <p className="text-muted-foreground text-body mb-4">모든 탭을 클릭해보세요</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">실시간 상태</h4>
              <p className="text-muted-foreground text-sm">현재 탭: <span className="text-purple-primary font-medium">{activeTab}</span></p>
              <p className="text-muted-foreground text-sm">클릭 횟수: <span className="text-purple-primary font-medium">{clickCount}</span></p>
              <p className="text-muted-foreground text-sm">마지막 업데이트: <span className="text-purple-primary font-medium">{new Date().toLocaleTimeString()}</span></p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">디버깅 정보</h4>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>• 브라우저 콘솔에서 'Tab clicked:' 로그 확인</li>
                <li>• Storybook Actions 패널에서 이벤트 기록 확인</li>
                <li>• CSS 변수: <code>--transition-normal</code> 적용됨</li>
                <li>• Framer Motion: <code>whileTap scale(0.95)</code></li>
              </ul>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">CSS 효과 테스트</h4>              <ul className="text-muted-foreground text-sm space-y-1">
                <li>• 활성 탭에 보라색 그라데이션 인디케이터 바</li>
                <li>• 비활성 탭에 hover 효과</li>
                <li>• 하단 고정 + backdrop blur</li>
                <li>• 그림자: <code>box-shadow: 0 -4px 15px rgba(0,0,0,0.4)</code></li>
              </ul>
            </div>
          </div>
        </div>
        <BottomNavigationBar
          activeTab={activeTab}
          onTabClick={handleTabClick}
        />
      </div>
    );
  },
  args: {
    activeTab: 'home',
    onTabClick: action('tab-clicked'),
  },
};

// 애니메이션 인디케이터 바 데모
export const AnimatedIndicatorDemo: Story = {
  render: (args) => {
    const [activeTab, setActiveTab] = useState('home');
    const [autoSwitch, setAutoSwitch] = useState(false);
    
    // 자동 탭 전환 데모
    React.useEffect(() => {
      if (!autoSwitch) return;
      
      const interval = setInterval(() => {
        setActiveTab(current => {
          const currentIndex = navItems.findIndex(item => item.id === current);
          const nextIndex = (currentIndex + 1) % navItems.length;
          return navItems[nextIndex].id;
        });
      }, 2000);
      
      return () => clearInterval(interval);
    }, [autoSwitch]);
    
    const handleTabClick = (tabId: string, path: string) => {
      setActiveTab(tabId);
      action('tab-clicked')(tabId, path);
    };
    
    return (
      <div className="relative min-h-[500px] bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 overflow-hidden">
        <div className="p-4 pb-20">
          <h3 className="text-foreground mb-4 text-h3">애니메이션 인디케이터 바 데모</h3>
          <p className="text-muted-foreground text-body mb-6">새로운 그라데이션 인디케이터 바와 부드러운 전환 효과</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">새로운 기능</h4>
              <ul className="text-muted-foreground text-sm space-y-2">
                <li>✨ <strong>그라데이션 인디케이터:</strong> 보라색 그라데이션 바 (purple-primary → purple-secondary)</li>
                <li>🎯 <strong>Framer Motion layoutId:</strong> 탭 간 부드러운 전환 애니메이션</li>
                <li>⚡ <strong>Spring 애니메이션:</strong> stiffness: 500, damping: 25로 탄성 효과</li>
                <li>💫 <strong>그림자 효과:</strong> 인디케이터 바 주변 보라색 글로우</li>
              </ul>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-3">자동 데모 제어</h4>
              <button
                onClick={() => setAutoSwitch(!autoSwitch)}
                className={`px-4 py-2 rounded-md transition-all duration-300 ${
                  autoSwitch 
                    ? 'bg-purple-primary text-white hover:bg-purple-secondary' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {autoSwitch ? '자동 전환 중지' : '자동 전환 시작'}
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                {autoSwitch ? '2초마다 자동으로 탭이 전환됩니다' : '수동으로 탭을 클릭해보세요'}
              </p>
            </div>
            
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="text-foreground text-lg font-medium mb-2">현재 상태</h4>
              <p className="text-muted-foreground text-sm">활성 탭: <span className="text-purple-primary font-medium">{activeTab}</span></p>
              <p className="text-muted-foreground text-sm">자동 전환: <span className={autoSwitch ? 'text-green-400' : 'text-gray-400'}>{autoSwitch ? '활성' : '비활성'}</span></p>
            </div>
          </div>
        </div>
        <BottomNavigationBar
          activeTab={activeTab}
          onTabClick={handleTabClick}
        />
      </div>
    );
  },
  args: {
    activeTab: 'home',
    onTabClick: action('tab-clicked'),
  },
};
