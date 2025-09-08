// 🛍 Shop 관련 타입 정의 (API 연동 전 폴백 & 클라이언트 전용 로직 포함)
// 서버 카탈로그 도입 시 필드: id | name | type | rarity | price | value | discount | description | icon | isLimited | popular | bonusGold | oneTime

export type ShopItemType = 'currency' | 'powerup' | 'special' | 'utility' | 'item';
export type ShopRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface ShopItemBase {
  id: string;
  name: string;
  type: ShopItemType;
  rarity: ShopRarity;
  price: number; // 소비 골드
  value: number; // 통화 상품인 경우 획득 골드, 그 외 0 또는 의미적 값
  description: string;
  icon: string;
  discount?: number; // %
  isLimited?: boolean;
  popular?: boolean;
  bonusGold?: number; // 추가 지급 골드(표시용)
  oneTime?: boolean; // 1회 구매 제한 (클라 표시)
}

export interface NormalizedShopItem extends ShopItemBase {
  // 향후 서버에서 추가 메타 병합 시 확장
}

export interface PurchaseResult {
  success: boolean;
  newBalance?: number;
  awardedItems?: Array<{
    id: string; name: string; type: string; rarity?: string; quantity: number; value?: number; icon?: string;
  }>;
  message?: string;
  statsDelta?: Record<string, any>;
}

export interface CatalogState {
  loading: boolean;
  error: string | null;
  items: NormalizedShopItem[];
  lastFetchedAt?: number;
  usedFallback: boolean; // 폴백 사용 여부
}

export interface NormalizeCatalogOptions {
  existing?: NormalizedShopItem[];
  dedupeById?: boolean;
  preferServerFields?: boolean;
}

export interface NormalizeCatalogResult {
  items: NormalizedShopItem[];
  usedFallback: boolean;
}
