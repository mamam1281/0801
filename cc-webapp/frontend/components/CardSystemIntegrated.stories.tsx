import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

// 카드 컴포넌트들
import { BaseCard } from './Basecard';
import { FeedbackCard } from './Feedbackcard';
import { GameStatsCard } from './Gamestatscard';
import { InputCard } from './Inputcard';
import { NotificationCard } from './NotificationCard';
import { PointsCard } from './PointsCard';
import { RecentActivityCard } from './RecentActivityCard';

// 버튼 컴포넌트들
import Button from './Button';

const meta: Meta<typeof BaseCard> = {
  title: 'Components/CardSystemIntegrated',
  component: BaseCard,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'project-dark',
      values: [
        { name: 'project-dark', value: 'var(--color-primary-dark-navy)' },
        { name: 'project-charcoal', value: 'var(--color-primary-charcoal)' },
        { name: 'project-gradient', value: 'var(--gradient-dark)' },
      ],
    },
    docs: {
      description: {
        component: '🎨 **통합 카드 시스템** - 모든 개별 카드 컴포넌트들을 확인할 수 있는 종합 갤러리입니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 🎯 1. 전체 카드 갤러리 (메인 쇼케이스)
export const AllCardsGallery: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 제목 섹션 */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-base font-bold text-[var(--foreground)]">
            카드 시스템 갤러리
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            다양한 카드 컴포넌트를 한눈에 확인해보세요.
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="space-y-4">
          {/* 첫 번째 줄 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 로그인 카드 */}
            <InputCard
              title="로그인"
              onSubmit={action('login-submitted')}
            />

            {/* 포인트 카드 */}
            <PointsCard
              currentPoints={12450}
              weeklyChange={320}
              rank={7}
              nextReward="다음 보상 프리미엄 아이템"
            />

            {/* 게임 통계 카드 */}
            <GameStatsCard
              gamesPlayed={127}
              winRate={73.2}
              bestScore={98765}
              totalPlayTime="45시간 12분"
            />
          </div>

          {/* 두 번째 줄 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 피드백 카드 - 성공 */}
            <FeedbackCard
              type="success"
              title="업무 목표 달성!"
              message="오늘 목표를 모두 완료했습니다."
              onDismiss={action('dismissed')}
            />

            {/* 최근 활동 카드 */}
            <RecentActivityCard
              activities={[
                {
                  id: '1',
                  type: 'game',
                  title: '퍼즐 게임 완료',
                  description: '레벨 15 클리어!',
                  timestamp: '2분 전'
                },
                {
                  id: '2',
                  type: 'achievement',
                  title: '새로운 업적 달성',
                  description: '연속 승리 10회',
                  timestamp: '1시간 전'
                },
                {
                  id: '3',
                  type: 'message',
                  title: '새 메시지',
                  description: '팀 채팅에 새 메시지가 있습니다',
                  timestamp: '2시간 전'
                }
              ]}
            />

            {/* 피드백 카드 - 경고 */}
            <FeedbackCard
              type="warning"
              title="주의 필요"
              message="일부 설정을 확인해 주세요."
              onDismiss={action('dismissed')}
            />
          </div>

          {/* 세 번째 줄 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 피드백 카드 - 에러 */}
            <FeedbackCard
              type="error"
              title="오류 발생"
              message="연결에 문제가 발생했습니다."
              onDismiss={action('dismissed')}
            />

            {/* 알림 카드 추가 */}
            <NotificationCard
              title="새로운 업데이트"
              description="새로운 기능이 추가되었습니다. 지금 확인해보세요!"
              actionText="확인하기"
              onAction={action('notification action')}
              onDismiss={action('notification dismissed')}
            />

            {/* 시스템 알림 카드 */}
            <NotificationCard
              title="시스템 점검 예정"
              description="내일 새벽 2시~4시 시스템 점검이 예정되어 있습니다."
              actionText="자세히 보기"
              onAction={action('maintenance details')}
              onDismiss={action('maintenance dismissed')}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '🎨 모든 카드 컴포넌트를 한눈에 볼 수 있는 메인 갤러리입니다.',
      },
    },
  },
};

// 🎯 2. 개별 카드 스토리들

export const LoginCard: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-6 flex items-center justify-center">
      <InputCard
        title="로그인"
        onSubmit={action('login submitted')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '로그인 폼이 포함된 입력 카드입니다.',
      },
    },
  },
};

export const PointsShowcase: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-6 flex items-center justify-center">
      <PointsCard
        currentPoints={12450}
        weeklyChange={320}
        rank={7}
        nextReward="다음 보상 프리미엄 아이템"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '사용자의 포인트 정보를 표시하는 카드입니다.',
      },
    },
  },
};

export const GameStatsShowcase: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-6 flex items-center justify-center">
      <GameStatsCard
        gamesPlayed={127}
        winRate={73.2}
        bestScore={98765}
        totalPlayTime="45시간 12분"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '게임 통계 정보를 표시하는 카드입니다.',
      },
    },
  },
};

export const RecentActivityShowcase: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-6 flex items-center justify-center">
      <RecentActivityCard
        activities={[
          {
            id: '1',
            type: 'game',
            title: '퍼즐 게임 완료',
            description: '레벨 15 클리어!',
            timestamp: '2분 전'
          },
          {
            id: '2',
            type: 'achievement',
            title: '새로운 업적 달성',
            description: '연속 승리 10회',
            timestamp: '1시간 전'
          },
          {
            id: '3',
            type: 'message',
            title: '새 메시지',
            description: '팀 채팅에 새 메시지가 있습니다',
            timestamp: '2시간 전'
          }
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '최근 활동 내역을 표시하는 카드입니다.',
      },
    },
  },
};

export const NotificationShowcase: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-2 flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
        <NotificationCard
          title="친구 요청"
          description="새로운 친구 요청이 3개 있습니다."
          actionText="확인하기"
          onAction={action('friend requests')}
          onDismiss={action('dismissed')}
        />
        <NotificationCard
          title="일일 보상"
          description="오늘의 로그인 보상을 받아보세요!"
          actionText="수령하기"
          onAction={action('daily reward')}
        />
        <NotificationCard
          title="시스템 점검"
          description="내일 새벽 2시~4시 시스템 점검이 예정되어 있습니다."
          actionText="자세히 보기"
          onAction={action('maintenance')}
          onDismiss={action('dismissed')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '다양한 알림 상황을 보여주는 카드들입니다.',
      },
    },
  },
};

export const FeedbackCards: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">
          피드백 카드 변형들
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeedbackCard
            type="success"
            title="성공!"
            message="작업이 성공적으로 완료되었습니다."
            onDismiss={action('success dismissed')}
          />
          <FeedbackCard
            type="warning"
            title="주의"
            message="확인이 필요한 항목이 있습니다."
            onDismiss={action('warning dismissed')}
          />
          <FeedbackCard
            type="error"
            title="오류"
            message="처리 중 오류가 발생했습니다."
            onDismiss={action('error dismissed')}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '성공, 경고, 오류 상황에 대한 피드백 카드들입니다.',
      },
    },
  },
};
