import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import AppHeader, { AppHeaderProps } from './AppHeader';

const meta: Meta<typeof AppHeader> = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '앱 상단 헤더 컴포넌트입니다. 로고, 포인트, 알림/설정 아이콘을 포함하며 반응형 레이아웃과 Safe Area를 지원합니다.',
      },
    },
  },
  tags: ['autodocs'],  argTypes: {
    appName: {
      control: 'text',
      description: '앱 이름 (로고 텍스트)',
    },
    hasNotifications: {
      control: 'boolean',
      description: '알림 여부 (벨 아이콘 색상 변경)',
    },
    showTokenBalanceOnMobile: {
      control: 'boolean',
      description: '모바일에서 토큰 잔고 표시 여부',
    },
    compact: {
      control: 'boolean',
      description: '컴팩트 모드 (높이와 아이콘 크기 축소)',
    },
    showAppName: {
      control: 'boolean',
      description: '앱 이름 표시 여부',
    },
    tokenDisplayVariant: {
      control: { type: 'radio' },
      options: ['full', 'compact', 'icon-only'],
      description: '토큰 표시 방식',
    },
    onNotificationsClick: {
      control: false,
      description: '알림 버튼 클릭 핸들러',
    },
    onSettingsClick: {
      control: false,
      description: '설정 버튼 클릭 핸들러',
    },
    onProfileClick: {
      control: false,
      description: '프로필 버튼 클릭 핸들러',
    },
  },
};
export default meta;

type Story = StoryObj<typeof AppHeader>;

export const Default: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: false,
    showTokenBalanceOnMobile: true,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
};

export const Compact: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: false,
    showTokenBalanceOnMobile: true,
    compact: true,
    showAppName: true,
    tokenDisplayVariant: 'compact',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
};

export const CompactIconOnly: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: true,
    showTokenBalanceOnMobile: true,
    compact: true,
    showAppName: true,
    tokenDisplayVariant: 'icon-only',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
};

export const MinimalLayout: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: false,
    showTokenBalanceOnMobile: false,
    compact: true,
    showAppName: false,
    tokenDisplayVariant: 'icon-only',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
};

export const WithNotifications: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: true,
    showTokenBalanceOnMobile: true,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
};

export const MobileNoTokenBalance: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: false,
    showTokenBalanceOnMobile: false,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
};

export const WithAllFeatures: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: true,
    showTokenBalanceOnMobile: true,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
};

// 모바일 반응형 테스트
export const ResponsiveTest: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: true,
    showTokenBalanceOnMobile: true,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 화면에서의 반응형 동작을 테스트합니다. 토큰 잔고 표시와 아이콘 배치를 확인하세요.',
      },
    },
  },
};

// 아이콘 크기 및 배치 테스트
export const IconSizeTest: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: true,
    showTokenBalanceOnMobile: true,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: '모든 아이콘이 일관되게 표시되는지 확인합니다. Diamond, Bell, Settings, UserCircle 아이콘 모두 체크하세요.',
      },
    },
  },
};

// Safe Area 테스트 (시뮬레이션)
export const SafeAreaTest: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: false,
    showTokenBalanceOnMobile: true,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
  decorators: [
    (Story) => (
      <div
        className="pt-[44px] pl-[20px] pr-[20px] bg-[linear-gradient(to_bottom,rgba(var(--black-rgb))_44px,transparent_44px)]"
        // Spacing theme:
        // '5': 'var(--spacing-5)' (40px)
        // '2-5': 'var(--spacing-2-5)' (20px) - if it existed.
        // '11': 'var(--spacing-11)' (88px)
        // Using arbitrary values for exact px match as theme values might not align.
        // --black-rgb is 0,0,0 from globals.css
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Safe Area 지원을 테스트합니다. 노치나 Dynamic Island가 있는 기기에서의 레이아웃을 시뮬레이션합니다.',
      },
    },
  },
};

export const GlassmorphismEffect: Story = {
  args: {
    appName: 'GamePlatform',
    hasNotifications: true,
    showTokenBalanceOnMobile: true,
    compact: false,
    showAppName: true,
    tokenDisplayVariant: 'full',
    onNotificationsClick: action('notifications clicked'),
    onSettingsClick: action('settings clicked'),
    onProfileClick: action('profile clicked'),
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gradient-to-br from-purple-primary via-purple-secondary to-purple-tertiary">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+Cjwvc3ZnPg==')] opacity-20"></div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '깊이감 있는 다크 글래스모피즘 효과를 시연합니다. 배경 블러, 그림자, 내부 하이라이트가 적용된 AppHeader를 확인하세요.',
      },
    },
  },
};

// decorators 제거 - 전역 Redux Provider 데코레이터를 사용해야 함
