import { GachaItem } from './index';

export interface GachaBanner {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  image: string;
  theme?: string;
  guaranteedRarity?: string;
  featuredItems: GachaItem[];
}