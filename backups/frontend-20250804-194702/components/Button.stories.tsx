import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Download, Save, Edit, Trash2, Search } from 'lucide-react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
    icon: { control: false },
    children: { control: 'text' },
    ripple: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'success', 'error', 'info', 'outline', 'text', 'neon', 'glass', 'animated']
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg']
    },
    rounded: { control: 'boolean' },
    disabled: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    iconPosition: {
      control: 'select',
      options: ['left', 'right']
    }
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// 기본 Primary 버튼
export const Primary: Story = {
  args: {
    children: '코드 확인',
    variant: 'primary',
    size: 'md',
    rounded: false,
  },
};

// Secondary 버튼
export const Secondary: Story = {
  args: {
    children: '취소',
    variant: 'secondary',
    size: 'md',
    rounded: false,
  },
};

// 그라데이션 효과 버튼들
export const Accent: Story = {
  args: {
    children: 'Accent',
    variant: 'accent',
    size: 'md',
    rounded: false,
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
    size: 'md',
    rounded: false,
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
    size: 'md',
    rounded: false,
  },
};

export const Info: Story = {
  args: {
    children: 'Info',
    variant: 'info',
    size: 'md',
    rounded: false,
  },
};

// 아웃라인 버튼 (이중 테두리)
export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
    size: 'md',
    rounded: false,
  },
};

// 텍스트 버튼
export const Text: Story = {
  args: {
    children: 'Text',
    variant: 'text',
    size: 'md',
    rounded: false,
  },
};

// 특수 효과 버튼들
export const Neon: Story = {
  args: {
    children: 'Neon',
    variant: 'neon',
    size: 'md',
    rounded: false,
  },
};

export const Glass: Story = {
  args: {
    children: 'Glass',
    variant: 'glass',
    size: 'md',
    rounded: false,
  },
};

export const Animated: Story = {
  args: {
    children: 'Animated',
    variant: 'animated',
    size: 'md',
    rounded: false,
  },
};

// 리플 효과가 있는 버튼
export const WithRipple: Story = {
  args: {
    children: 'Click Me',
    variant: 'primary',
    size: 'md',
    ripple: true,
    rounded: false,
  },
};

// 아이콘이 있는 버튼들
export const WithIconLeft: Story = {
  args: {
    children: 'Download',
    variant: 'primary',
    size: 'md',
    icon: Download,
    iconPosition: 'left',
    rounded: false,
  },
};

export const WithIconRight: Story = {
  args: {
    children: 'Save',
    variant: 'success',
    size: 'md',
    icon: Save,
    iconPosition: 'right',
    rounded: false,
  },
};

// 아이콘 전용 버튼
export const IconOnly: Story = {
  args: {
    iconOnly: true,
    icon: Plus,
    variant: 'primary',
    size: 'md',
    rounded: false,
  },
};

// 비활성화된 버튼
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    variant: 'primary',
    size: 'md',
    disabled: true,
    rounded: false,
  },
};

// 다양한 크기들
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="primary" size="xs" rounded={false}>Extra Small</Button>
      <Button variant="primary" size="sm" rounded={false}>Small</Button>
      <Button variant="primary" size="md" rounded={false}>Medium</Button>
      <Button variant="primary" size="lg" rounded={false}>Large</Button>
    </div>
  ),
};

// 모든 변형들 한눈에 보기
export const AllVariants: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[
        'primary',
        'secondary', 
        'accent',
        'success',
        'error',
        'info',
        'outline',
        'text',
        'neon',
        'glass',
        'animated'
      ].map((variant) => (
        <Button 
          key={variant}
          variant={variant as any} 
          size={args.size} 
          disabled={args.disabled}
          ripple={args.ripple}
          rounded={false}
        >
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Button>
      ))}
    </div>
  ),
  args: {
    size: 'md',
    disabled: false,
    ripple: false,
  },
};

// 실제 사용 예시들
export const CommonUseCases: Story = {
  render: () => (
    <div className="space-y-6">
      {/* 폼 액션 버튼들 */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Form Actions</h4>
        <div className="flex gap-2">
          <Button variant="primary" size="md" rounded={false}>
            저장
          </Button>
          <Button variant="secondary" size="md" rounded={false}>
            취소
          </Button>
        </div>
      </div>

      {/* 상태별 버튼들 */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Status Actions</h4>
        <div className="flex gap-2">
          <Button variant="success" size="md" rounded={false}>
            승인
          </Button>
          <Button variant="error" size="md" rounded={false}>
            거절
          </Button>
          <Button variant="info" size="md" rounded={false}>
            대기
          </Button>
        </div>
      </div>

      {/* 아이콘 버튼들 */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Icon Actions</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="md" icon={Edit} rounded={false}>
            편집
          </Button>
          <Button variant="error" size="md" icon={Trash2} rounded={false}>
            삭제
          </Button>
          <Button variant="info" size="md" icon={Search} rounded={false}>
            검색
          </Button>
        </div>
      </div>

      {/* 아이콘 전용 버튼들 */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Icon Only</h4>
        <div className="flex gap-2">
          <Button iconOnly icon={Plus} variant="primary" size="md" rounded={false} />
          <Button iconOnly icon={Edit} variant="outline" size="md" rounded={false} />
          <Button iconOnly icon={Trash2} variant="error" size="md" rounded={false} />
          <Button iconOnly icon={Download} variant="success" size="md" rounded={false} />
        </div>
      </div>
    </div>
  ),
};
