import { NormalizeCatalogOptions, NormalizeCatalogResult, NormalizedShopItem, ShopItemBase } from '@/types/shop';

// 내부 폴백 아이템을 외부에서 주입받도록 하기 위해 별도 export (ShopScreen에서 import)
export const FALLBACK_SHOP_ITEMS: ShopItemBase[] = [
  { id: 'model_points_30000', name: '모델 30,000 포인트', type: 'currency', rarity: 'common', price: 30000, value: 30000, description: '30,000 GOLD 충전', icon: '💰' },
  { id: 'model_points_105000', name: '모델 105,000 포인트', type: 'currency', rarity: 'rare', price: 100000, value: 100000, description: '105,000 포인트 교환 (100,000 GOLD 지급)', icon: '💰', popular: true },
  { id: 'model_points_330000', name: '모델 330,000 포인트', type: 'currency', rarity: 'epic', price: 300000, value: 300000, description: '330,000 포인트 교환 (300,000 GOLD 지급)', icon: '💰' },
  { id: 'model_points_1150000', name: '모델 1,150,000 포인트', type: 'currency', rarity: 'legendary', price: 1000000, value: 1000000, description: '1,150,000 포인트 교환 (1,000,000 GOLD + 보너스 20,000 GOLD)', icon: '💰', bonusGold: 20000, popular: true },
  { id: 'anti_single_loss', name: '한폴방지', type: 'powerup', rarity: 'rare', price: 30000, value: 0, description: '낙첨 1회 무효', icon: '🛡️' },
  { id: 'charge_plus_30', name: '충전 30%', type: 'powerup', rarity: 'epic', price: 50000, value: 0, description: '충전/획득 골드 보너스 +30%', icon: '⚡', popular: true },
  { id: 'early_rank_up', name: '조기등업', type: 'special', rarity: 'legendary', price: 500000, value: 0, description: '즉시 한 단계 등급 상승 (1회만 구매 가능)', icon: '🚀', oneTime: true, isLimited: true },
  { id: 'attendance_link', name: '출석연결', type: 'utility', rarity: 'common', price: 20000, value: 0, description: '출석 보상 누락/이월 기능', icon: '📅' },
  { id: 'comp_double_day', name: '하루동안 콤프 2배', type: 'powerup', rarity: 'epic', price: 50000, value: 0, description: '24시간 동안 컴프 보상 2배', icon: '🔥', popular: true }
];

export function calcFinalPrice(item: { price: number; discount?: number }): number {
  const d = Math.min(Math.max(item.discount || 0, 0), 95); // 0~95% 안전
  return Math.floor(item.price * (1 - d / 100));
}

export function calcEffectiveGold(item: { type: string; value: number; bonusGold?: number }): number {
  if (item.type !== 'currency') return 0;
  return (item.value || 0) + (item.bonusGold || 0);
}

export function normalizeCatalog(raw: any[] | null | undefined, opts: NormalizeCatalogOptions = {}): NormalizeCatalogResult {
  const usedFallback = !raw || raw.length === 0;
  const source = usedFallback ? FALLBACK_SHOP_ITEMS : raw;
  const map: Record<string, NormalizedShopItem> = {};
  const push = (it: any) => {
    const id = String(it.id ?? it.item_id ?? it.slug ?? it.code ?? Math.random().toString(36).slice(2));
    const base: NormalizedShopItem = {
      id,
      name: String(it.name ?? '아이템'),
      type: (it.type ?? 'item') as any,
      rarity: (it.rarity ?? 'common') as any,
      price: Number(it.price ?? it.cost ?? 0),
      value: Number(it.value ?? it.amount ?? 0),
      description: String(it.description ?? it.desc ?? ''),
      icon: String(it.icon ?? '🎁'),
      discount: Number(it.discount ?? it.sale_pct ?? 0) || undefined,
      isLimited: Boolean(it.isLimited ?? it.limited ?? false) || undefined,
      popular: Boolean(it.popular ?? it.isPopular ?? false) || undefined,
      bonusGold: typeof it.bonusGold === 'number' ? it.bonusGold : undefined,
      oneTime: Boolean(it.oneTime ?? it.one_time ?? false) || undefined,
    };
    if (!opts.dedupeById) {
      map[id + Math.random().toString(36).slice(2)] = base; // 비중복 강제 (디버그용)
    } else {
      if (map[id]) {
        // preferServerFields=false 면 기존 유지
        if (opts.preferServerFields) map[id] = { ...map[id], ...base };
      } else map[id] = base;
    }
  };
  source.forEach(push);

  const items = Object.values(map);
  return { items, usedFallback };
}

// oneTime 아이템 구매 후 비활성화 처리를 위한 helper
export function isOneTimePurchased(itemId: string, purchasedIds: Set<string>): boolean {
  return purchasedIds.has(itemId);
}
