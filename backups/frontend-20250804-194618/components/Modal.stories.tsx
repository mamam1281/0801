import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { BaseCard } from './Basecard';

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

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '상용 서비스급 Modal 컴포넌트 - CSS Variables 완전 준수, 모바일 전체화면 + 스와이프 제스처 지원',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl', 'full'] },
    variant: { control: 'select', options: ['default', 'ice'] },
    showCloseButton: { control: 'boolean' },
    allowSwipeClose: { control: 'boolean' },
    children: { control: false },
  },
};
export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (      <div className="p-4">
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} isOpen={open} onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <h2 className="text-h3 font-semibold">Hello Modal!</h2>
            <p className="text-muted-foreground">
              데스크톱에서는 중앙 정렬, 모바일에서는 하단에서 올라오는 전체화면 모달입니다.
              모바일에서 아래로 스와이프하면 닫힙니다.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="primary" onClick={() => setOpen(false)}>
                확인
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
  args: {
    title: 'Modal Title',
    description: 'Modal description goes here.',
    size: 'md',
    showCloseButton: true,
    allowSwipeClose: true,
  },
};

export const Sizes: Story = {
  render: () => {
    const [openModal, setOpenModal] = useState<string | null>(null);
    const sizes: Array<{ size: any; name: string }> = [
      { size: 'sm', name: '작은 모달' },
      { size: 'md', name: '중간 모달' },
      { size: 'lg', name: '큰 모달' },
      { size: 'xl', name: '매우 큰 모달' },
    ];    return (
      <div className="p-4 space-y-3">
        {sizes.map(({ size, name }) => (
          <Button key={size} onClick={() => setOpenModal(size)} className="mr-2">
            {name} 열기
          </Button>
        ))}
        
        {sizes.map(({ size, name }) => (
          <Modal
            key={size}
            isOpen={openModal === size}
            onClose={() => setOpenModal(null)}
            size={size as any}
            title={`${name} (${size})`}
            description="각 크기별 모달을 확인해보세요. 모바일에서는 모두 전체화면으로 표시됩니다."
          >            <Card title={`${name} 콘텐츠`}>
              <p className="text-muted-foreground">
                이것은 {name}입니다. 데스크톱에서는 크기가 다르지만, 
                모바일에서는 모두 동일한 전체화면 경험을 제공합니다.
              </p>
            </Card>
          </Modal>
        ))}
      </div>
    );
  },
};

export const MobileOptimized: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (      <div className="p-4">
        <div className="space-y-3">
          <h3 className="text-h4 font-semibold">
            모바일 최적화 모달
          </h3>
          <p className="text-muted-foreground">
            모바일에서 테스트해보세요: 하단에서 올라오는 애니메이션과 스와이프로 닫기 기능을 확인할 수 있습니다.
          </p>
          <Button onClick={() => setOpen(true)}>모바일 모달 열기</Button>
        </div>
        
        <Modal 
          isOpen={open} 
          onClose={() => setOpen(false)}
          title="모바일 전용 모달"
          description="아래로 스와이프하여 닫을 수 있습니다"
          allowSwipeClose={true}
        >          <div className="space-y-4">
            <Card title="스와이프 제스처">
              <p className="text-muted-foreground">
                이 모달은 모바일에서 아래로 스와이프하여 닫을 수 있습니다. 
                상단의 인디케이터를 드래그해보세요.
              </p>
            </Card>
            
            <Card title="전체화면 경험">
              <p className="text-muted-foreground">
                모바일에서는 하단에서 올라오는 전체화면 모달로 표시되어 
                네이티브 앱과 같은 사용자 경험을 제공합니다.
              </p>
            </Card>
            
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => setOpen(false)} className="flex-1">
                확인
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                취소
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};

// ❄️ 얼음 글래스모피즘 모달
export const IceGlassmorphism: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-4">
        <Button onClick={() => setOpen(true)} variant="glass">❄️ 얼음 모달 열기</Button>
        <Modal {...args} isOpen={open} onClose={() => setOpen(false)} variant="ice">
          <div className="space-y-4">
            <h2 className="text-h3 font-semibold">❄️ 얼음 글래스모피즘</h2>
            <p className="text-muted-foreground">
              시원하고 깔끔한 얼음 같은 투명 효과를 가진 모달입니다.
              백드롭 필터와 밝은 테두리로 차가운 느낌을 연출합니다.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="primary" onClick={() => setOpen(false)}>
                확인
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};