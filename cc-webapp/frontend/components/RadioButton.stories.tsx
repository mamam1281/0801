import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import RadioButton from './RadioButton';

const meta: Meta<typeof RadioButton> = {
  title: 'UI/Forms/RadioButton',
  component: RadioButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: '기본 라디오 버튼',
    checked: false,
    disabled: false,
    name: 'default-radio',
    value: 'option1',
    onChange: (value: string) => console.log('Radio changed:', value),
  },
};

export const Checked: Story = {
  args: {
    label: '선택된 상태',
    checked: true,
    disabled: false,
    name: 'checked-radio',
    value: 'option1',
    onChange: (value: string) => console.log('Radio changed:', value),
  },
};

export const Disabled: Story = {
  args: {
    label: '비활성화된 라디오 버튼',
    checked: false,
    disabled: true,
    name: 'disabled-radio',
    value: 'option1',
    onChange: (value: string) => console.log('Radio changed:', value),
  },
};

export const DisabledChecked: Story = {
  args: {
    label: '비활성화된 선택 상태',
    checked: true,
    disabled: true,
    name: 'disabled-checked-radio',
    value: 'option1',
    onChange: (value: string) => console.log('Radio changed:', value),
  },
};

export const WithoutLabel: Story = {
  args: {
    checked: false,
    disabled: false,
    name: 'no-label-radio',
    value: 'option1',
    onChange: (value: string) => console.log('Radio changed:', value),
  },
};

export const LongLabel: Story = {
  args: {
    label: '이것은 매우 긴 레이블입니다. 라디오 버튼과 레이블이 어떻게 정렬되는지 확인할 수 있습니다.',
    checked: false,
    disabled: false,
    name: 'long-label-radio',
    value: 'option1',
    onChange: (value: string) => console.log('Radio changed:', value),
  },
};

export const RadioGroup: Story = {
  render: () => {
    const [selectedValue, setSelectedValue] = React.useState('option1');
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">라디오 그룹 예시</h3>
        <RadioButton 
          label="옵션 1" 
          checked={selectedValue === 'option1'} 
          name="radio-group" 
          value="option1"
          onChange={setSelectedValue}
        />
        <RadioButton 
          label="옵션 2" 
          checked={selectedValue === 'option2'} 
          name="radio-group" 
          value="option2"
          onChange={setSelectedValue}
        />
        <RadioButton 
          label="옵션 3" 
          checked={selectedValue === 'option3'} 
          name="radio-group" 
          value="option3"
          onChange={setSelectedValue}
        />
        <RadioButton 
          label="비활성화된 옵션" 
          checked={selectedValue === 'option4'} 
          disabled={true}
          name="radio-group" 
          value="option4"
          onChange={setSelectedValue}
        />
        <p className="mt-4 text-sm text-muted-foreground">
          선택된 값: {selectedValue}
        </p>
      </div>
    );
  },
};
