import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { Home, User, Settings, Bell, Star, Trophy, Gift } from 'lucide-react';
import Tabs, { TabItem } from './Tabs';
import { BaseCard } from './Basecard';
import Button from './Button';

// Card 컴포넌트를 BaseCard로 래핑
const Card = ({ title, children, className, ...props }: { 
  title?: string; 
  children: React.ReactNode; 
  className?: string; 
}) => (
  <BaseCard className={className} {...props}>
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      )}
      <div>{children}</div>
    </div>
  </BaseCard>
);

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '상용 서비스급 Tabs 컴포넌트 - 고정된 마스터 컨테이너에서 일관된 레이아웃 제공',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tabs: {
      control: false,
      description: '탭 아이템 배열',
    },
    activeTab: {
      control: 'text',
      description: '현재 활성 탭의 ID',
    },
    onTabChange: {
      control: false,
      description: '탭 변경 시 호출될 콜백',
    },
    className: {
      control: 'text',
      description: '전체 컨테이너에 적용될 추가 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 상용 서비스급 탭 데이터 - 모든 레이아웃이 동일한 마스터 컨테이너에서 렌더링
const commercialTabs: TabItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    contentType: 'multi-card-grid',
    content: (
      <>
        <Card title="오늘의 통계">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--color-purple-primary)]">1,234</div>
            <div className="text-sm text-[var(--color-text-secondary)]">총 포인트</div>
          </div>
        </Card>
        <Card title="진행률">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">78%</div>
            <div className="text-sm text-[var(--color-text-secondary)]">목표 달성</div>
          </div>
        </Card>
        <Card title="이번 주 활동">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">15</div>
            <div className="text-sm text-[var(--color-text-secondary)]">게임 플레이</div>
          </div>
        </Card>
        <Card title="순위">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">#23</div>
            <div className="text-sm text-[var(--color-text-secondary)]">전체 랭킹</div>
          </div>
        </Card>
      </>
    ),
  },
  {
    id: 'profile',
    label: '내 정보',
    contentType: 'single-card',
    content: (
      <Card title="사용자 프로필" className="max-w-md mx-auto">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-3"></div>
            <h4 className="font-semibold">김사용자</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">Level 15 게이머</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>가입일</span>
              <span>2024.01.15</span>
            </div>
            <div className="flex justify-between">
              <span>총 플레이타임</span>
              <span>127시간</span>
            </div>
            <div className="flex justify-between">
              <span>즐겨하는 게임</span>
              <span>가위바위보</span>
            </div>
          </div>
        </div>
      </Card>
    ),
  },
  {
    id: 'leaderboard',
    label: '리더보드',
    contentType: 'vertical-stack',
    content: (
      <>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">전체 랭킹</h3>
          <Button variant="outline">새로고침</Button>
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-[var(--muted)]'
              }`}>
                {i + 1}
              </div>
              <div>
                <div className="font-medium">플레이어 {i + 1}</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Level {20 - i}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-[var(--color-purple-primary)]">{(5000 - i * 200).toLocaleString()}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">포인트</div>
            </div>
          </Card>
        ))}
      </>
    ),
  },
  {
    id: 'settings',
    label: '설정',
    contentType: 'full-width-section',
    content: (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">게임 설정</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="게임 설정">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>사운드 효과</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span>배경 음악</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span>진동 피드백</span>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <span>푸시 알림</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </Card>
          
          <Card title="디스플레이 설정">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">테마</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="theme" defaultChecked />
                    <span>다크 모드</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="theme" />
                    <span>라이트 모드</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="theme" />
                    <span>시스템 설정</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <Card title="계정 설정">
          <div className="space-y-4">
            <Button variant="outline" className="w-full">프로필 편집</Button>
            <Button variant="outline" className="w-full">비밀번호 변경</Button>
            <Button variant="error" className="w-full">계정 삭제</Button>
          </div>
        </Card>
      </div>
    ),
  },
];

// 인터랙티브 컴포넌트 (상태 관리)
const InteractiveTabs = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <Tabs
        tabs={commercialTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          action('tab-changed')(tabId);
        }}
      />
    </div>
  );
};

// 1. 기본 상용 서비스급 Tabs
export const CommercialGradeTabs: Story = {
  render: () => <InteractiveTabs />,
  parameters: {
    docs: {
      description: {
        story: '상용 서비스급 Tabs 컴포넌트입니다. 모든 탭 콘텐츠가 고정된 마스터 컨테이너 내에서 렌더링되어 안정적인 UX를 제공합니다.',
      },
    },
  },
};

// 2. 단일 카드 레이아웃 테스트
const singleCardTabs: TabItem[] = [
  {
    id: 'single1',
    label: '작은 카드',
    contentType: 'single-card',
    content: (
      <Card title="작은 카드" className="max-w-sm">
        <p>이것은 작은 카드입니다.</p>
      </Card>
    ),
  },
  {
    id: 'single2',
    label: '큰 카드',
    contentType: 'single-card',
    content: (
      <Card title="큰 카드" className="max-w-2xl">
        <div className="space-y-4">
          <p>이것은 더 큰 카드입니다.</p>
          <p>더 많은 콘텐츠가 있어도 마스터 컨테이너 크기는 동일합니다.</p>
          <Button>액션 버튼</Button>
        </div>
      </Card>
    ),
  },
];

export const SingleCardLayoutTest: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('single1');
    return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <Tabs
          tabs={singleCardTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '단일 카드 레이아웃에서 카드 크기가 달라도 마스터 컨테이너는 고정된 크기를 유지합니다.',
      },
    },
  },
};

// 3. 모바일 반응형 테스트
export const ResponsiveTest: Story = {
  render: () => <InteractiveTabs />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 환경에서의 반응형 테스트입니다. 마스터 컨테이너가 모바일에 최적화된 크기로 조정됩니다.',
      },
    },
  },
};
