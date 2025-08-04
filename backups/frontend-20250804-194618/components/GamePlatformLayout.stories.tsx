import type { Meta, StoryObj } from '@storybook/react';
import GamePlatformLayout, { GameCardData, QuickStartItemData } from './GamePlatformLayout';

// Mock 데이터
const mockPopularGames: GameCardData[] = [
  {
    id: '1',
    title: 'Space Adventure',
    rating: 4.9,
    players: '1.2K명',
    imagePlaceholder: '🚀',
    onClick: () => console.log('Space Adventure clicked'),
  },
  {
    id: '2',
    title: 'Racing Thunder',
    rating: 4.7,
    players: '2.5K명',
    imagePlaceholder: '🏎️',
    onClick: () => console.log('Racing Thunder clicked'),
  },
  {
    id: '3',
    title: 'Mystery Quest',
    rating: 4.8,
    players: '890명',
    imagePlaceholder: '🔍',
    onClick: () => console.log('Mystery Quest clicked'),
  },
  {
    id: '4',
    title: 'Battle Arena',
    rating: 4.6,
    players: '3.1K명',
    imagePlaceholder: '⚔️',
    onClick: () => console.log('Battle Arena clicked'),
  },
  {
    id: '5',
    title: 'Magic World',
    rating: 4.9,
    players: '1.8K명',
    imagePlaceholder: '🪄',
    onClick: () => console.log('Magic World clicked'),
  },
  {
    id: '6',
    title: 'Puzzle Master',
    rating: 4.5,
    players: '750명',
    imagePlaceholder: '🧩',
    onClick: () => console.log('Puzzle Master clicked'),
  },
];

const mockQuickStartItems: QuickStartItemData[] = [
  {
    id: '1',
    label: '빠른 게임',
    iconBgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    iconPlaceholder: '⚡',
    onClick: () => console.log('빠른 게임 clicked'),
  },
  {
    id: '2',
    label: '멀티플레이어',
    iconBgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    iconPlaceholder: '👥',
    onClick: () => console.log('멀티플레이어 clicked'),
  },
  {
    id: '3',
    label: '토너먼트',
    iconBgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    iconPlaceholder: '🏆',
    onClick: () => console.log('토너먼트 clicked'),
  },
  {
    id: '4',
    label: '랭킹',
    iconBgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    iconPlaceholder: '📊',
    onClick: () => console.log('랭킹 clicked'),
  },
  {
    id: '5',
    label: '설정',
    iconBgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    iconPlaceholder: '⚙️',
    onClick: () => console.log('설정 clicked'),
  },
];

const meta: Meta<typeof GamePlatformLayout> = {
  title: 'Layouts/GamePlatformLayout',
  component: GamePlatformLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'GamePlatformLayout은 게임 플랫폼의 메인 레이아웃을 제공합니다. 인기 게임과 퀵스타트 아이템을 반응형 그리드로 표시합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    welcomeMessage: {
      description: '사용자에게 표시할 환영 메시지',
      control: 'text',
    },
    subMessage: {
      description: '환영 메시지 아래에 표시할 부제목',
      control: 'text',
    },
    popularGames: {
      description: '인기 게임 목록',
      control: 'object',
    },
    quickStartItems: {
      description: '퀵스타트 아이템 목록',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: {
    welcomeMessage: '안녕하세요, 게이머님! 👋',
    subMessage: '오늘도 즐거운 게임을 즐겨보세요',
    popularGames: mockPopularGames,
    quickStartItems: mockQuickStartItems,
  },
};

// 인기 게임이 적을 때
export const FewGames: Story = {
  args: {
    welcomeMessage: '안녕하세요, 게이머님! 👋',
    subMessage: '새로운 게임들을 확인해보세요',
    popularGames: mockPopularGames.slice(0, 3),
    quickStartItems: mockQuickStartItems.slice(0, 3),
  },
};

// 긴 제목을 가진 게임들
export const LongTitles: Story = {
  args: {
    welcomeMessage: '게임의 세계로 오신 것을 환영합니다! 🎮',
    subMessage: '다양한 장르의 흥미진진한 게임들을 만나보세요',
    popularGames: [
      {
        id: '1',
        title: 'Epic Space Adventure: The Ultimate Galaxy Quest',
        rating: 4.9,
        players: '1.2K명',
        imagePlaceholder: '🚀',
      },
      {
        id: '2',
        title: 'Lightning Fast Racing Thunder Championship',
        rating: 4.7,
        players: '2.5K명',
        imagePlaceholder: '🏎️',
      },
      {
        id: '3',
        title: 'Mysterious Detective Quest: Hidden Secrets',
        rating: 4.8,
        players: '890명',
        imagePlaceholder: '🔍',
      },
    ],
    quickStartItems: mockQuickStartItems,
  },
};

// 모바일 뷰 (viewport 조절을 위한 스토리)
export const Mobile: Story = {
  args: {
    welcomeMessage: '안녕하세요! 👋',
    subMessage: '모바일에서도 즐거운 게임을!',
    popularGames: mockPopularGames.slice(0, 4),
    quickStartItems: mockQuickStartItems.slice(0, 4),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// 빈 상태
export const Empty: Story = {
  args: {
    welcomeMessage: '게임을 찾을 수 없습니다',
    subMessage: '곧 새로운 게임들이 추가될 예정입니다',
    popularGames: [],
    quickStartItems: [],
  },
};
