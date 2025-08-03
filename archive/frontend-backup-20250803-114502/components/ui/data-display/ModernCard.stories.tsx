import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import React from 'react';
import ModernCard from './ModernCard';

const meta: Meta<typeof ModernCard> = {
  title: 'UI/Data Display/ModernCard',
  component: ModernCard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
ModernCard는 최신 웹 디자인 트렌드를 반영한 카드 컴포넌트입니다.

**주요 특징:**
- **모던 메시 글래스모피즘**: 투명도와 블러 효과로 깊이감 연출
- **네온 글로우**: 사이버펑크 스타일의 빛나는 테두리 효과
- **호버 리프트**: 마우스 오버 시 부드러운 상승 애니메이션
- **반응형 그리드**: 화면 크기에 따른 자동 레이아웃 조정

**적용된 CSS 효과:**
- \`backdrop-filter: blur(16px) saturate(180%)\` - 고급 블러 효과
- \`box-shadow\` 다중 레이어 - 깊이감과 네온 효과
- \`transform: translateY()\` - 3D 리프트 효과
- 메시 패턴 애니메이션 - 20초 순환 회전
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['glass', 'neon'],
      description: '카드 스타일 변형',
    },
    children: {
      control: 'text',
      description: '카드 내용',
    },
    onClick: {
      action: 'card-clicked',
      description: '카드 클릭 핸들러',
    },
  },
};
export default meta;

type Story = StoryObj<typeof ModernCard>;

export const GlassMorphism: Story = {
  args: {
    variant: 'glass',
    children: (
      <div>
        <h3 className="text-foreground text-lg font-bold mb-2">글래스모피즘</h3>
        <p className="text-muted-foreground text-sm">투명도와 블러로 만든 모던한 카드</p>
      </div>
    ),
    onClick: action('glass-card-clicked'),
  },
};

export const NeonGlow: Story = {
  args: {
    variant: 'neon',
    children: (
      <div>
        <h3 className="text-foreground text-lg font-bold mb-2">네온 글로우</h3>
        <p className="text-muted-foreground text-sm">사이버펑크 스타일의 빛나는 카드</p>
      </div>
    ),
    onClick: action('neon-card-clicked'),
  },
};

export const GridDemo: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-4">
      <h2 className="text-foreground text-2xl font-bold mb-6 text-center">모던 카드 그리드 데모</h2>
      
      <div className="content-grid">
        <ModernCard variant="glass" onClick={action('card-1-clicked')}>
          <h3 className="text-foreground text-lg font-bold mb-2">💎</h3>
          <p className="text-muted-foreground text-sm">프리미엄 기능</p>
        </ModernCard>
        
        <ModernCard variant="neon" onClick={action('card-2-clicked')}>
          <h3 className="text-foreground text-lg font-bold mb-2">🎮</h3>
          <p className="text-muted-foreground text-sm">게임 센터</p>
        </ModernCard>
        
        <ModernCard variant="glass" onClick={action('card-3-clicked')}>
          <h3 className="text-foreground text-lg font-bold mb-2">🏆</h3>
          <p className="text-muted-foreground text-sm">리더보드</p>
        </ModernCard>
        
        <ModernCard variant="neon" onClick={action('card-4-clicked')}>
          <h3 className="text-foreground text-lg font-bold mb-2">⚡</h3>
          <p className="text-muted-foreground text-sm">빠른 시작</p>
        </ModernCard>
        
        <ModernCard variant="glass" onClick={action('card-5-clicked')}>
          <h3 className="text-foreground text-lg font-bold mb-2">🎯</h3>
          <p className="text-muted-foreground text-sm">미션</p>
        </ModernCard>
        
        <ModernCard variant="neon" onClick={action('card-6-clicked')}>
          <h3 className="text-foreground text-lg font-bold mb-2">🎪</h3>
          <p className="text-muted-foreground text-sm">이벤트</p>
        </ModernCard>
      </div>
      
      <div className="mt-8 p-4 bg-card rounded-lg border">
        <h4 className="text-foreground text-lg font-medium mb-2">그리드 반응형 설정</h4>
        <ul className="text-muted-foreground text-sm space-y-1">
          <li>• 모바일 (768px 이하): 2열 그리드, 16px 간격</li>
          <li>• 태블릿 (769px ~ 1024px): 3열 그리드, 24px 간격</li>
          <li>• 데스크톱 (1025px 이상): 4열 그리드, 32px 간격</li>
          <li>• 각 카드는 호버 시 8px 상승 효과</li>
        </ul>
      </div>
    </div>
  ),
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selectedCard, setSelectedCard] = React.useState<string | null>(null);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-purple-primary/5 to-background p-4">
        <h2 className="text-foreground text-2xl font-bold mb-6 text-center">인터랙티브 카드 데모</h2>
        
        <div className="content-grid">
          {[
            { id: 'glass-1', variant: 'glass' as const, icon: '🌟', title: '스타 기능' },
            { id: 'neon-1', variant: 'neon' as const, icon: '🔥', title: '핫 아이템' },
            { id: 'glass-2', variant: 'glass' as const, icon: '💫', title: '매직 모드' },
            { id: 'neon-2', variant: 'neon' as const, icon: '⚡', title: '터보 부스트' },
          ].map((card) => (
            <ModernCard
              key={card.id}
              variant={card.variant}
              onClick={() => {
                setSelectedCard(card.id);
                action('card-selected')(card.id);
              }}
              className={selectedCard === card.id ? 'ring-2 ring-purple-primary' : ''}
            >
              <div className="text-4xl mb-2">{card.icon}</div>
              <h3 className="text-foreground text-lg font-bold mb-1">{card.title}</h3>
              <p className="text-muted-foreground text-xs">클릭해보세요!</p>
              {selectedCard === card.id && (
                <div className="mt-2 text-purple-primary text-xs font-medium">선택됨 ✓</div>
              )}
            </ModernCard>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-card rounded-lg border">
          <h4 className="text-foreground text-lg font-medium mb-2">선택된 카드</h4>
          <p className="text-muted-foreground text-sm">
            {selectedCard ? `현재 선택: ${selectedCard}` : '카드를 클릭해보세요'}
          </p>
        </div>
      </div>
    );
  },
};
