import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable avatar component with multiple sizes, loading states, and fallback options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the avatar',
    },
    isActive: {
      control: 'boolean',
      description: 'Whether the avatar has an active state (neon glow)',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the avatar is in loading state',
    },
    src: {
      control: 'text',
      description: 'URL of the avatar image',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the avatar image',
    },
    fallback: {
      control: 'text',
      description: 'Fallback content when image fails to load',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic stories
export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    alt: 'John Doe',
    size: 'md',
  },
};

export const WithoutImage: Story = {
  args: {
    alt: 'User Avatar',
    size: 'md',
  },
};

export const WithFallbackText: Story = {
  args: {
    fallback: 'JD',
    alt: 'John Doe',
    size: 'md',
  },
};

export const Active: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    alt: 'John Doe',
    size: 'md',
    isActive: true,
  },
};

// Size variants
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="text-center">
        <Avatar
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
          alt="Small Avatar"
          size="sm"
        />        <p className="mt-2 text-xs text-muted-foreground">Small</p>
      </div>
      <div className="text-center">
        <Avatar
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
          alt="Medium Avatar"
          size="md"
        />
        <p className="mt-2 text-xs text-muted-foreground">Medium</p>
      </div>
      <div className="text-center">
        <Avatar
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
          alt="Large Avatar"
          size="lg"
        />
        <p className="mt-2 text-xs text-muted-foreground">Large</p>
      </div>
      <div className="text-center">
        <Avatar
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
          alt="Extra Large Avatar"
          size="xl"
        />
        <p className="mt-2 text-xs text-muted-foreground">Extra Large</p>
      </div>
    </div>
  ),
};

// Fallback variants
export const FallbackOptions: Story = {
  render: () => (
    <div className="space-y-6">
      <div>        <h4 className="text-body font-medium text-foreground mb-4">
          Fallback Types
        </h4>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Avatar size="lg" alt="Default Icon" />
            <p className="mt-2 text-xs text-muted-foreground">Default Icon</p>
          </div>
          <div className="text-center">
            <Avatar size="lg" fallback="AB" alt="Text Fallback" />
            <p className="mt-2 text-xs text-muted-foreground">Text Fallback</p>
          </div>
          <div className="text-center">
            <Avatar size="lg" fallback="😀" alt="Happy Emoji" />
            <p className="mt-2 text-xs text-muted-foreground">Happy Emoji</p>
          </div>
          <div className="text-center">
            <Avatar size="lg" fallback="👤" alt="User Emoji" />
            <p className="mt-2 text-xs text-muted-foreground">User Emoji</p>
          </div>
        </div>
      </div>
        <div>
        <h4 className="text-body font-medium text-foreground mb-4">
          Different Sizes with Text
        </h4>
        <div className="flex items-end gap-4">          <div className="text-center">
            <Avatar size="sm" fallback="AB" alt="Small Text" />
            <p className="mt-2 text-xs text-muted-foreground">Small</p>
          </div>
          <div className="text-center">
            <Avatar size="md" fallback="AB" alt="Medium Text" />
            <p className="mt-2 text-xs text-muted-foreground">Medium</p>
          </div>
          <div className="text-center">
            <Avatar size="lg" fallback="AB" alt="Large Text" />
            <p className="mt-2 text-xs text-muted-foreground">Large</p>
          </div>
          <div className="text-center">
            <Avatar size="xl" fallback="AB" alt="Extra Large Text" />
            <p className="mt-2 text-xs text-muted-foreground">Extra Large</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// States demo
export const States: Story = {
  render: () => (
    <div className="space-y-6">
      <div>        <h4 className="text-body font-medium text-foreground mb-4">
          Avatar States
        </h4>        <div className="flex items-center gap-6">
          <div className="text-center">
            <Avatar
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
              alt="Normal"
              size="lg"
            />
            <p className="mt-2 text-xs text-muted-foreground">Normal</p>
          </div>
          <div className="text-center">
            <Avatar
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
              alt="Active"
              size="lg"
              isActive={true}
            />
            <p className="mt-2 text-xs text-muted-foreground">Active</p>
          </div>
        </div>
      </div>
    </div>
  ),
};