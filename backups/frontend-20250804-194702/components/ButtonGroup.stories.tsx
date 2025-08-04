import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Download, Save, Edit, Trash2, Search, Heart, Star, Settings, Check, X, Clock, Share } from 'lucide-react';
import ButtonGroup from './ButtonGroup';
import Button from './Button';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical', 'grid']
    },
    gap: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    columns: {
      control: 'number',
      if: { arg: 'direction', eq: 'grid' }
    },
    fullWidth: { control: 'boolean' },
    wrap: { 
      control: 'boolean',
      if: { arg: 'direction', eq: 'horizontal' }
    }
  },
  parameters: {
    docs: {
      description: {
        component: '버튼들을 그룹으로 묶어 간격을 일정하게 유지하는 ButtonGroup 컴포넌트입니다. 가로, 세로, 그리드 배치를 지원하며 7-10픽셀의 적절한 간격을 제공합니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

// 1. 기본 가로 배치
export const HorizontalGroup: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    fullWidth: false,
    wrap: false,
    children: (
      <>
        <Button variant="primary" size="md" rounded={false}>저장</Button>
        <Button variant="secondary" size="md" rounded={false}>취소</Button>
        <Button variant="outline" size="md" rounded={false}>도움말</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '기본적인 가로 배치 버튼 그룹입니다. 버튼들 사이에 10픽셀의 간격이 적용됩니다.',
      },
    },
  },
};

// 2. 세로 배치
export const VerticalGroup: Story = {
  args: {
    direction: 'vertical',
    gap: 'md',
    fullWidth: true,
    children: (
      <>
        <Button variant="primary" size="md" rounded={false} className="w-full">게임 시작</Button>
        <Button variant="secondary" size="md" rounded={false} className="w-full">설정</Button>
        <Button variant="outline" size="md" rounded={false} className="w-full">도움말</Button>
        <Button variant="text" size="md" rounded={false} className="w-full">종료</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '세로 배치 버튼 그룹입니다. 모든 버튼이 전체 너비를 차지하며 10픽셀의 세로 간격이 적용됩니다.',
      },
    },
  },
};

// 3. 그리드 배치 (2x2)
export const GridGroup: Story = {
  args: {
    direction: 'grid',
    gap: 'md',
    columns: 2,
    fullWidth: true,
    children: (
      <>
        <Button variant="primary" size="md" rounded={false} className="w-full">슬롯머신</Button>
        <Button variant="accent" size="md" rounded={false} className="w-full">블랙잭</Button>
        <Button variant="success" size="md" rounded={false} className="w-full">룰렛</Button>
        <Button variant="info" size="md" rounded={false} className="w-full">포커</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '2x2 그리드 배치 버튼 그룹입니다. 각 버튼 사이에 10픽셀의 간격이 적용됩니다.',
      },
    },
  },
};

// 4. 아이콘 버튼 그룹 (가로)
export const IconButtonGroup: Story = {
  args: {
    direction: 'horizontal',
    gap: 'sm',
    fullWidth: false,
    children: (
      <>
        <Button variant="outline" size="md" rounded={false} iconOnly icon={Edit} />
        <Button variant="outline" size="md" rounded={false} iconOnly icon={Trash2} />
        <Button variant="outline" size="md" rounded={false} iconOnly icon={Download} />
        <Button variant="outline" size="md" rounded={false} iconOnly icon={Settings} />
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '아이콘 전용 버튼들의 가로 그룹입니다. 8픽셀의 작은 간격을 사용합니다.',
      },
    },
  },
};

// 5. 액션 버튼 그룹 (가로, 아이콘 포함)
export const ActionButtonGroup: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    fullWidth: false,
    children: (
      <>
        <Button variant="primary" size="md" rounded={false} icon={Save} iconPosition="left">저장</Button>
        <Button variant="success" size="md" rounded={false} icon={Download} iconPosition="left">내보내기</Button>
        <Button variant="outline" size="md" rounded={false} icon={Edit} iconPosition="left">편집</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '아이콘이 포함된 액션 버튼들의 그룹입니다. 일관된 아이콘 위치와 간격을 제공합니다.',
      },
    },
  },
};

// 6. 다양한 크기 버튼 그룹
export const SizeVariantGroup: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    fullWidth: false,
    wrap: true,
    children: (
      <>
        <Button variant="primary" size="xs" rounded={false}>Extra Small</Button>
        <Button variant="primary" size="sm" rounded={false}>Small</Button>
        <Button variant="primary" size="md" rounded={false}>Medium</Button>
        <Button variant="primary" size="lg" rounded={false}>Large</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '다양한 크기의 버튼들을 그룹으로 배치한 예시입니다. wrap 옵션으로 줄바꿈이 허용됩니다.',
      },
    },
  },
};

// 7. 폼 액션 그룹 (전체 너비)
export const FormActionGroup: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    fullWidth: true,
    children: (
      <>
        <Button variant="outline" size="md" rounded={false} className="flex-1">취소</Button>
        <Button variant="primary" size="md" rounded={false} className="flex-1">확인</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '폼 하단의 액션 버튼들을 위한 그룹입니다. 전체 너비를 차지하며 각 버튼이 동일한 크기를 가집니다.',
      },
    },
  },
};

// 8. 상태별 버튼 그룹 (세로)
export const StatusButtonGroup: Story = {
  args: {
    direction: 'vertical',
    gap: 'lg',
    fullWidth: true,
    children: (
      <>
        <Button variant="success" size="md" rounded={false} className="w-full" icon={Check} iconPosition="left">승인</Button>
        <Button variant="error" size="md" rounded={false} className="w-full" icon={X} iconPosition="left">거절</Button>
        <Button variant="info" size="md" rounded={false} className="w-full" icon={Clock} iconPosition="left">대기</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '상태별 액션을 나타내는 버튼들의 세로 그룹입니다. 12픽셀의 큰 간격을 사용합니다.',
      },
    },
  },
};

// 9. 그리드 배치 (3x2)
export const WideGridGroup: Story = {
  args: {
    direction: 'grid',
    gap: 'md',
    columns: 3,
    fullWidth: true,
    children: (
      <>
        <Button variant="glass" size="md" rounded={false} className="w-full" icon={Star}>즐겨찾기</Button>
        <Button variant="glass" size="md" rounded={false} className="w-full" icon={Heart}>좋아요</Button>
        <Button variant="glass" size="md" rounded={false} className="w-full" icon={Search}>검색</Button>
        <Button variant="outline" size="md" rounded={false} className="w-full" icon={Download}>다운로드</Button>
        <Button variant="outline" size="md" rounded={false} className="w-full" icon={Share}>공유</Button>
        <Button variant="outline" size="md" rounded={false} className="w-full" icon={Settings}>설정</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '3x2 그리드 배치로 더 많은 버튼을 체계적으로 배열한 예시입니다.',
      },
    },
  },
};

// 10. 반응형 래핑 그룹
export const ResponsiveWrapGroup: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    fullWidth: false,
    wrap: true,
    children: (
      <>
        <Button variant="primary" size="md" rounded={false}>첫 번째 버튼</Button>
        <Button variant="secondary" size="md" rounded={false}>두 번째 버튼</Button>
        <Button variant="accent" size="md" rounded={false}>세 번째 버튼</Button>
        <Button variant="success" size="md" rounded={false}>네 번째 버튼</Button>
        <Button variant="info" size="md" rounded={false}>다섯 번째 버튼</Button>
        <Button variant="outline" size="md" rounded={false}>여섯 번째 버튼</Button>
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '화면 크기에 따라 자동으로 줄바꿈되는 반응형 버튼 그룹입니다. 많은 버튼이 있을 때 유용합니다.',
      },
    },
  },
};
