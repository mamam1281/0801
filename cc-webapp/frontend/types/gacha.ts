import { GameItem } from './index';

// GachaItem은 GameItem을 확장
export interface GachaItem extends GameItem {
  // GameItem이 이미 모든 필요한 속성을 가지고 있음
  // id, name, description, icon, value, rarity 등
}

// GachaBanner 인터페이스
export interface GachaBanner {
  id: string;
  name: string;
  description: string;
  theme: string;
  featuredItems: GachaItem[];
  cost: number;
  bonusMultiplier: number;
  bgGradient: string;
  guaranteedRarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}