export interface BaseCardProps {
  title: string;
  description: string;
  image?: string;
  className?: string;
  onClick?: () => void;
}

export interface GameCardProps extends BaseCardProps {
  gameType: 'roulette' | 'slots' | 'rps' | 'gacha';
  isNew?: boolean;
  badge?: string;
  onPlay?: () => void;
}

export interface ContentCardProps extends BaseCardProps {
  contentType: 'adult' | 'game' | 'vip';
  isUnlocked?: boolean;
  unlockCost?: number;
  thumbnailUrl?: string;
  stage?: string;
}

export interface VIPCardProps extends BaseCardProps {
  tier: 'basic' | 'premium' | 'vip' | 'whale';
  benefits: string[];
  cost: number;
}

export interface MissionCardProps extends BaseCardProps {
  progress: number;
  reward: string;
  deadline?: string;
  state?: 'default' | 'hover' | 'active';
  content?: boolean;
  onStart?: () => void;
}

export interface RewardCardProps extends BaseCardProps {
  rewardType: 'tokens' | 'points' | 'items';
  amount: number;
  claimable?: boolean;
  state?: 'default' | 'hover' | 'active';
  content?: boolean;
  onClaim?: () => void;
}
