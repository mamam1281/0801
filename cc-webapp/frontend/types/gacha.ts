import { GameItem } from './index';

// GachaItem은 GameItem과 호환되도록 직접 정의
export interface GachaItem {
  id: string;
  name: string;
  type: 'powerup' | 'skin' | 'currency' | 'collectible';  // GameItem과 일치하는 타입
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'; // 'mythic' 추가됨
  rate: number;
  quantity: number;
  description: string;
  icon: string;
  value: number;
  sexiness?: number;
  isNew?: boolean;
}

export interface HeartParticle {
  id: string;
  x: number;
  y: number;
}

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