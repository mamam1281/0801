import type { Meta, StoryObj } from '@storybook/react';
import { CustomCheckbox } from './CustomCheckbox';
import React, { useState } from 'react';

const meta: Meta<typeof CustomCheckbox> = {
  title: 'Components/CustomCheckbox',
  component: CustomCheckbox,
  parameters: {
    layout: 'centered',
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
        component: `
✅ **커스텀 체크박스 컴포넌트**

사용자 정의 스타일이 적용된 체크박스 컴포넌트입니다.

### 특징
- 프로젝트 디자인 시스템과 일치하는 스타일
- 체크 표시 애니메이션 효과
- 라벨 클릭으로 체크박스 토글 가능
- 비활성화 상태 지원
- 접근성 준수 (ARIA 속성, screen reader 지원)

### 사용 예시
\`\`\`tsx
<CustomCheckbox 
  id="agree-terms"
  label="이용약관에 동의합니다"
  checked={isChecked}
  onChange={(checked) => setIsChecked(checked)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: { type: 'text' },
      description: '체크박스의 고유 ID',
    },
    label: {
      control: { type: 'text' },
      description: '체크박스 옆에 표시될 라벨 텍스트',
    },
    checked: {
      control: { type: 'boolean' },
      description: '체크박스의 체크 상태',
    },
    disabled: {
      control: { type: 'boolean' },
      description: '체크박스 비활성화 여부',
    },
    className: {
      control: { type: 'text' },
      description: '추가 CSS 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 🎯 기본 스토리
export const Default: Story = {
  args: {
    id: 'default-checkbox',
    label: '기본 체크박스',
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    id: 'checked-checkbox',
    label: '체크된 상태',
    checked: true,
  },
  parameters: {
    docs: {
      description: {
        story: '초기에 체크된 상태의 체크박스입니다.',
      },
    },
  },
};

export const WithoutLabel: Story = {
  args: {
    id: 'no-label-checkbox',
    checked: false,
  },
  parameters: {
    docs: {
      description: {
        story: '라벨이 없는 체크박스입니다.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    id: 'disabled-checkbox',
    label: '비활성화된 체크박스',
    checked: false,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: '비활성화된 상태의 체크박스입니다. 클릭할 수 없습니다.',
      },
    },
  },
};

export const DisabledChecked: Story = {
  args: {
    id: 'disabled-checked-checkbox',
    label: '비활성화된 체크된 체크박스',
    checked: true,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: '비활성화되고 체크된 상태의 체크박스입니다.',
      },
    },
  },
};

// 🎯 인터랙티브 스토리
export const Interactive: Story = {
  render: () => {
    const [isChecked, setIsChecked] = useState(false);
    
    return (
      <div className="space-y-4">
        <CustomCheckbox
          id="interactive-checkbox"
          label="인터랙티브 체크박스"
          checked={isChecked}
          onChange={setIsChecked}
        />
        <p className="text-sm text-white/70">
          현재 상태: {isChecked ? '체크됨' : '체크 안됨'}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '상태가 실시간으로 변경되는 인터랙티브한 체크박스입니다.',
      },
    },
  },
};

// 🎯 다양한 라벨 길이
export const VariousLabels: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <CustomCheckbox
        id="short-label"
        label="짧은 라벨"
        checked={false}
      />
      <CustomCheckbox
        id="medium-label"
        label="중간 길이의 라벨 텍스트입니다"
        checked={true}
      />
      <CustomCheckbox
        id="long-label"
        label="매우 긴 라벨 텍스트입니다. 이런 경우에도 체크박스와 텍스트가 올바르게 정렬되어야 합니다. 여러 줄로 나뉠 수도 있습니다."
        checked={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '다양한 길이의 라벨 텍스트와 함께 사용된 체크박스들입니다.',
      },
    },
  },
};

// 🎯 폼 예시 (실제 사용 시나리오)
export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      agreeTerms: false,
      agreePrivacy: false,
      agreeMarketing: false,
      rememberMe: true,
    });

    const handleCheckboxChange = (key: keyof typeof formData) => (checked: boolean) => {
      setFormData(prev => ({
        ...prev,
        [key]: checked
      }));
    };

    return (
      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-md">
        <h3 className="text-lg font-semibold text-white mb-6">회원가입 약관 동의</h3>
        
        <div className="space-y-4">
          <CustomCheckbox
            id="agree-terms"
            label="이용약관에 동의합니다 (필수)"
            checked={formData.agreeTerms}
            onChange={handleCheckboxChange('agreeTerms')}
          />
          
          <CustomCheckbox
            id="agree-privacy"
            label="개인정보 처리방침에 동의합니다 (필수)"
            checked={formData.agreePrivacy}
            onChange={handleCheckboxChange('agreePrivacy')}
          />
          
          <CustomCheckbox
            id="agree-marketing"
            label="마케팅 정보 수신에 동의합니다 (선택)"
            checked={formData.agreeMarketing}
            onChange={handleCheckboxChange('agreeMarketing')}
          />
          
          <div className="border-t border-white/10 pt-4 mt-6">
            <CustomCheckbox
              id="remember-me"
              label="로그인 상태 유지"
              checked={formData.rememberMe}
              onChange={handleCheckboxChange('rememberMe')}
            />
          </div>
        </div>

        <div className="mt-6 p-3 bg-black/10 rounded-lg">
          <p className="text-xs text-white/60 mb-2">현재 선택 상태:</p>
          <ul className="text-xs text-white/80 space-y-1">
            <li>이용약관: {formData.agreeTerms ? '✅' : '❌'}</li>
            <li>개인정보: {formData.agreePrivacy ? '✅' : '❌'}</li>
            <li>마케팅: {formData.agreeMarketing ? '✅' : '❌'}</li>
            <li>자동로그인: {formData.rememberMe ? '✅' : '❌'}</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '실제 폼에서 사용되는 체크박스들의 예시입니다. 회원가입 약관 동의 시나리오를 보여줍니다.',
      },
    },
  },
};

// 🎯 상태별 모든 변형 보기
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="space-y-4">
        <h4 className="text-base font-medium text-white mb-3">일반 상태</h4>
        <CustomCheckbox
          id="normal-unchecked"
          label="체크 안됨"
          checked={false}
        />
        <CustomCheckbox
          id="normal-checked"
          label="체크됨"
          checked={true}
        />
      </div>
      
      <div className="space-y-4">
        <h4 className="text-base font-medium text-white mb-3">비활성화 상태</h4>
        <CustomCheckbox
          id="disabled-unchecked"
          label="비활성화 (체크 안됨)"
          checked={false}
          disabled={true}
        />
        <CustomCheckbox
          id="disabled-checked"
          label="비활성화 (체크됨)"
          checked={true}
          disabled={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '체크박스의 모든 상태를 한눈에 볼 수 있습니다.',
      },
    },
  },
};
