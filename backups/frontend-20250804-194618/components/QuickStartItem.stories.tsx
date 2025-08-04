import type { Meta, StoryObj } from '@storybook/react';
import QuickStartItem, { QuickStartItemProps } from './QuickStartItem';

const meta: Meta<typeof QuickStartItem> = {
  title: 'Atomic/QuickStartItem',
  component: QuickStartItem,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    iconBgColor: { control: 'color' },
    iconPlaceholder: { control: 'text' },
    onClick: { action: 'clicked' },
  },
};
export default meta;

type Story = StoryObj<typeof QuickStartItem>;

export const Default: Story = {
  args: {
    label: 'Quick Start',
    iconBgColor: '#7b29cd',
    iconPlaceholder: '▶️',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <QuickStartItem id="q1" label="Random" iconBgColor="#7b29cd" iconPlaceholder="🎲" />
      <QuickStartItem id="q2" label="Challenge" iconBgColor="#870dd1" iconPlaceholder="🏆" />
      <QuickStartItem id="q3" label="Friends" iconBgColor="#5b30f6" iconPlaceholder="🧑‍🤝‍🧑" />
    </div>
  ),
};
