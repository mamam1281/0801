import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { useState } from 'react';
import { Search } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'Atomic/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'search', 'email', 'password', 'gradient'],
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success', 'disabled'],
    },
    placeholder: { control: 'text' },
    value: { control: 'text' },
    errorMessage: { control: 'text' },
    successMessage: { control: 'text' },
    leftIcon: { control: 'object' },
    rightIcon: { control: 'object' },
    onChange: { action: 'changed' },
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text',
    state: 'default',
  },
};

export const WithError: Story = {
  args: {
    type: 'text',
    placeholder: 'Error state',
    state: 'error',
    errorMessage: 'Invalid input',
  },
};

export const WithSuccess: Story = {
  args: {
    type: 'text',
    placeholder: 'Success state',
    state: 'success',
    successMessage: 'Looks good!',
  },
};

export const PasswordToggle: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return <Input {...args} type="password" value={value} onChange={e => setValue(e.target.value)} />;
  },
  args: {
    placeholder: 'Password',
    state: 'default',
  },
};

export const WithIcons: Story = {
  args: {
    type: 'text',
    placeholder: '', // 텍스트 없이 아이콘만 표시
    leftIcon: <Search size={18} />,
    rightIcon: null,
  },
};

export const Gradient: Story = {
  args: {
    type: 'gradient',
    placeholder: 'Gradient input',
  },
};

export const Disabled: Story = {
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    state: 'disabled',
    value: 'Disabled',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Input type="text" placeholder="Default" />
      <Input type="search" placeholder="Search" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Input type="gradient" placeholder="Gradient" />
      <Input type="text" placeholder="Error" state="error" errorMessage="Invalid input" />
      <Input type="text" placeholder="Success" state="success" successMessage="Looks good!" />
      <Input type="text" placeholder="Disabled" state="disabled" value="Disabled" />
    </div>
  ),
};
