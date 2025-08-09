import { GameItem } from './index';

export interface GachaItem extends GameItem {
  // Narrow/align existing GameItem fields
  type: 'powerup' | 'skin' | 'currency' | 'collectible' | 'weapon' | 'character' | 'premium' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  value: number;
  // Additional gacha-specific metadata
  rate: number;
  sexiness?: number;
  isNew?: boolean;
}

export interface HeartParticle {
  id: string;
  x: number;
  y: number;
}

export type Particle = ParticleProps;

export interface GachaBanner {
  id: string;
  name: string;
  description: string;
  cost: number;
  price: number;
  image: string;
  theme?: string;
  guaranteedRarity?: string;
  bonusMultiplier?: number;
  bgGradient: string;
  featuredItems: GachaItem[];
}

export interface SparkleProps {
  id: string;
  size: number;
  left: string;
  top: string;
  animationDelay: string;
  emoji: string;
}

export interface ParticleProps {
  id: string;
  size: number;
  left: string;
  top: string;
  animationDuration: string;
  animationDelay: string;
  rarity: string;
}