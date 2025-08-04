import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import Toast from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toast 컴포넌트는 사용자에게 즉각적인 피드백을 제공하는 비침범적 알림 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      description: '토스트에 표시될 메시지',
      control: 'text',
    },
    type: {
      description: '토스트의 타입 (색상과 아이콘을 결정)',
      control: 'select',
      options: ['success', 'error', 'info', 'warning', 'default'],
    },
    duration: {
      description: '토스트가 표시될 시간 (ms). 0이면 수동 닫기',
      control: 'number',
    },
    id: {
      description: '토스트의 고유 식별자',
      control: 'text',
    },
    onClose: {
      description: '토스트 닫기 시 호출될 콜백 함수',
      action: 'onClose',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리들
export const Success: Story = {
  args: {
    id: 'success-1',
    message: '작업이 성공적으로 완료되었습니다!',
    type: 'success',
    duration: 3000,
    onClose: action('onClose'),
  },
};

export const Error: Story = {
  args: {
    id: 'error-1',
    message: '오류가 발생했습니다. 다시 시도해주세요.',
    type: 'error',
    duration: 3000,
    onClose: action('onClose'),
  },
};

export const Info: Story = {
  args: {
    id: 'info-1',
    message: '새로운 업데이트가 있습니다.',
    type: 'info',
    duration: 3000,
    onClose: action('onClose'),
  },
};

export const Warning: Story = {
  args: {
    id: 'warning-1',
    message: '주의: 이 작업은 되돌릴 수 없습니다.',
    type: 'warning',
    duration: 3000,
    onClose: action('onClose'),
  },
};

export const Default: Story = {
  args: {
    id: 'default-1',
    message: '일반적인 알림 메시지입니다.',
    type: 'default',
    duration: 3000,
    onClose: action('onClose'),
  },
};

// 긴 메시지
export const LongMessage: Story = {
  args: {
    id: 'long-1',
    message: '이것은 매우 긴 메시지입니다. 토스트에서 어떻게 표시되는지 확인해보세요. 텍스트가 적절히 처리되는지 테스트합니다.',
    type: 'info',
    duration: 5000,
    onClose: action('onClose'),
  },
};

// 수동 닫기 (duration: 0)
export const ManualClose: Story = {
  args: {
    id: 'manual-1',
    message: '이 토스트는 수동으로 닫아야 합니다.',
    type: 'info',
    duration: 0, // 자동으로 사라지지 않음
    onClose: action('onClose'),
  },
};

// 짧은 duration
export const QuickDisappear: Story = {
  args: {
    id: 'quick-1',
    message: '1초 후 사라집니다!',
    type: 'success',
    duration: 1000,
    onClose: action('onClose'),
  },
};

// 모든 타입 변형 그룹
export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <Toast
        id="all-success"
        message="성공 메시지"
        type="success"
        duration={0}
        onClose={action('onClose')}
      />
      <Toast
        id="all-error"
        message="에러 메시지"
        type="error"
        duration={0}
        onClose={action('onClose')}
      />
      <Toast
        id="all-info"
        message="정보 메시지"
        type="info"
        duration={0}
        onClose={action('onClose')}
      />
      <Toast
        id="all-warning"
        message="경고 메시지"
        type="warning"
        duration={0}
        onClose={action('onClose')}
      />
      <Toast
        id="all-default"
        message="기본 메시지"
        type="default"
        duration={0}
        onClose={action('onClose')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 Toast 타입을 한 번에 볼 수 있는 스토리입니다.',
      },
    },
  },
};
