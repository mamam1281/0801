import type { Meta, StoryObj } from '@storybook/react';
import GameCard, { GameCardProps } from './GameCard';

const meta: Meta<typeof GameCard> = {
  title: 'Atomic/GameCard',
  component: GameCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    rating: { control: 'number' },
    players: { control: 'text' },
    imageUrl: { control: 'text' },
    imagePlaceholder: { control: 'text' },
    onClick: { action: 'clicked' },
  },
};
export default meta;

type Story = StoryObj<typeof GameCard>;

export const Default: Story = {
  args: {
    title: 'Super Game',
    rating: 4.8,
    players: '1.2K players',
    imagePlaceholder: '🎮',
  },
};

export const WithImage: Story = {
  args: {
    title: 'Adventure Quest',
    rating: 4.9,
    players: '2.3K players',
    imageUrl: 'https://placehold.co/64x64',
    imagePlaceholder: '🎲',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <GameCard id="g1" title="Game 1" rating={4.7} players="1.1K" imagePlaceholder="🎮" />
      <GameCard id="g2" title="Game 2" rating={4.9} players="2.3K" imagePlaceholder="🕹️" />
      <GameCard id="g3" title="Game 3" rating={4.5} players="900" imagePlaceholder="🎲" />
    </div>
  ),
};
