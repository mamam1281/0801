import type { Meta, StoryObj } from '@storybook/react';
import { SimpleProgressBar } from './SimpleProgressBar';
import React, { useState, useEffect } from 'react';

const meta: Meta<typeof SimpleProgressBar> = {
  title: 'UI/Data Display/SimpleProgressBar',
  component: SimpleProgressBar,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '진행률 (0-100)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '프로그레스 바 크기',
    },
    indeterminate: {
      control: 'boolean',
      description: '무한 로딩 모드',
    },
    label: {
      control: 'text',
      description: '레이블 텍스트',
    },
    showPercentage: {
      control: 'boolean',
      description: '퍼센트 표시 여부',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 프로그레스 바
export const Default: Story = {
  args: {
    progress: 65,
    size: 'md',
    label: '다운로드 중...',
    showPercentage: true,
  },
  render: (args) => (
    <div className="w-80">
      <SimpleProgressBar {...args} />
    </div>
  ),
};

// 크기별 비교
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <SimpleProgressBar progress={45} size="sm" label="작은 크기" showPercentage />
      <SimpleProgressBar progress={65} size="md" label="중간 크기" showPercentage />
      <SimpleProgressBar progress={85} size="lg" label="큰 크기" showPercentage />
    </div>
  ),
};

// 무한 로딩
export const Indeterminate: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <SimpleProgressBar 
        indeterminate 
        size="sm" 
        label="파일 업로드 중..." 
      />
      <SimpleProgressBar 
        indeterminate 
        size="md" 
        label="데이터 처리 중..." 
      />
      <SimpleProgressBar 
        indeterminate 
        size="lg" 
        label="서버 연결 중..." 
      />
    </div>
  ),
};

// 진행률별 비교
export const ProgressLevels: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <SimpleProgressBar progress={0} label="시작 전" showPercentage />
      <SimpleProgressBar progress={25} label="진행 중" showPercentage />
      <SimpleProgressBar progress={50} label="반 완료" showPercentage />
      <SimpleProgressBar progress={75} label="거의 완료" showPercentage />
      <SimpleProgressBar progress={100} label="완료!" showPercentage />
    </div>
  ),
};

// 애니메이션 데모
export const AnimatedProgress: Story = {
  render: () => {
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 2;
        });
      }, 100);
      
      return () => clearInterval(timer);
    }, []);
    
    return (
      <div className="w-80">
        <SimpleProgressBar 
          progress={progress} 
          label="자동 진행" 
          showPercentage 
          size="md"
        />
      </div>
    );
  },
};

// 미니멀 버전 (레이블 없음)
export const Minimal: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <SimpleProgressBar progress={30} size="sm" />
      <SimpleProgressBar progress={60} size="md" />
      <SimpleProgressBar progress={90} size="lg" />
    </div>
  ),
};

// 다크/라이트 테마 비교
export const ThemeComparison: Story = {
  parameters: {
    backgrounds: { disable: true },
  },
  render: () => (
    <div className="flex gap-8">
      {/* 다크 테마 */}
      <div className="p-6 bg-gray-900 rounded-lg">
        <h3 className="text-white mb-4 font-medium" style={{ fontFamily: 'var(--font-primary)' }}>
          다크 테마
        </h3>
        <div className="space-y-4 w-64">
          <SimpleProgressBar progress={45} label="업로드" showPercentage />
          <SimpleProgressBar indeterminate label="처리 중..." />
        </div>
      </div>
      
      {/* 라이트 테마 */}
      <div className="p-6 bg-white rounded-lg border">
        <h3 className="text-gray-900 mb-4 font-medium" style={{ fontFamily: 'var(--font-primary)' }}>
          라이트 테마
        </h3>
        <div className="space-y-4 w-64">
          <SimpleProgressBar progress={45} label="업로드" showPercentage />
          <SimpleProgressBar indeterminate label="처리 중..." />
        </div>
      </div>
    </div>
  ),
};
