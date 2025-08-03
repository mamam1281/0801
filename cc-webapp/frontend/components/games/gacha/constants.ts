import { GameItem } from '../../../types';

export interface GachaItem extends GameItem {
  rate: number; // Pull rate percentage
  isNew?: boolean;
  sexiness?: number; // 키치/섹시 레벨 (1-5)
}

export interface GachaBanner {
  id: string;
  name: string;
  description: string;
  theme: string;
  featuredItems: GachaItem[];
  cost: number;
  guaranteedRarity?: 'epic' | 'legendary';
  bonusMultiplier: number;
  bgGradient: string;
}

// 키치하고 섹시한 가챠 아이템들
export const GACHA_ITEMS: GachaItem[] = [
  // Common items (60% rate) - 기본 키치 아이템들
  { id: 'glitter_lip', name: '반짝 립글로스', type: 'skin', rarity: 'common', rate: 15, quantity: 1, description: '눈부신 글리터가 가득한 섹시 립글로스', icon: '💋', value: 100, sexiness: 2 },
  { id: 'neon_nail', name: '네온 네일', type: 'skin', rarity: 'common', rate: 15, quantity: 1, description: '형광색으로 빛나는 네일아트', icon: '💅', value: 80, sexiness: 2 },
  { id: 'cute_sticker', name: '귀여운 스티커팩', type: 'collectible', rarity: 'common', rate: 15, quantity: 5, description: '초키치한 하트와 별 스티커들', icon: '🌟', value: 50, sexiness: 1 },
  { id: 'pink_coin', name: '핑크 코인백', type: 'currency', rarity: 'common', rate: 15, quantity: 500, description: '분홍빛 반짝이는 골드 코인들', icon: '💖', value: 500, sexiness: 1 },

  // Rare items (25% rate) - 좀 더 섹시한 아이템들
  { id: 'lace_lingerie', name: '레이스 란제리', type: 'skin', rarity: 'rare', rate: 8, quantity: 1, description: '고급스러운 블랙 레이스 란제리 세트', icon: '🖤', value: 1000, sexiness: 4 },
  { id: 'diamond_choker', name: '다이아 초커', type: 'skin', rarity: 'rare', rate: 8, quantity: 1, description: '목을 감싸는 화려한 다이아몬드 초커', icon: '💎', value: 1200, sexiness: 4 },
  { id: 'silk_dress', name: '실크 드레스', type: 'skin', rarity: 'rare', rate: 9, quantity: 1, description: '몸매를 돋보이게 하는 실크 원피스', icon: '👗', value: 1500, sexiness: 3 },

  // Epic items (12% rate) - 극상의 섹시 아이템들
  { id: 'angel_wings', name: '엔젤 윙', type: 'skin', rarity: 'epic', rate: 4, quantity: 1, description: '천사 같지만 악마 같은 화이트 윙', icon: '🤍', value: 5000, sexiness: 5 },
  { id: 'devil_horns', name: '데빌 혼', type: 'skin', rarity: 'epic', rate: 4, quantity: 1, description: '치명적인 매력의 붉은 뿔 헤드피스', icon: '😈', value: 5500, sexiness: 5 },
  { id: 'crystal_heels', name: '크리스탈 힐', type: 'skin', rarity: 'epic', rate: 4, quantity: 1, description: '신데렐라도 울고 갈 투명 하이힐', icon: '👠', value: 4000, sexiness: 4 },

  // Legendary items (2.5% rate) - 전설의 글래머 아이템들
  { id: 'goddess_crown', name: '여신의 왕관', type: 'skin', rarity: 'legendary', rate: 1, quantity: 1, description: '아프로디테가 착용했다는 전설의 왕관', icon: '👑', value: 20000, sexiness: 5 },
  { id: 'mermaid_tail', name: '인어 꼬리', type: 'skin', rarity: 'legendary', rate: 0.8, quantity: 1, description: '심해의 여왕이 내려준 신비한 꼬리', icon: '🧜‍♀️', value: 18000, sexiness: 5 },
  { id: 'phoenix_feather', name: '불사조 깃털 드레스', type: 'skin', rarity: 'legendary', rate: 0.7, quantity: 1, description: '영원히 타오르는 아름다움의 상징', icon: '🔥', value: 25000, sexiness: 5 },

  // Mythic items (0.5% rate) - 우주급 섹시 아이템들
  { id: 'galaxy_body', name: '갤럭시 바디슈트', type: 'skin', rarity: 'mythic', rate: 0.3, quantity: 1, description: '우주의 별빛을 담은 몸에 밀착되는 슈트', icon: '🌌', value: 100000, sexiness: 5 },
  { id: 'rainbow_aura', name: '레인보우 오라', type: 'collectible', rarity: 'mythic', rate: 0.2, quantity: 1, description: '몸 전체를 감싸는 무지개빛 오라', icon: '🌈', value: 150000, sexiness: 5 }
];

// 키치하고 섹시한 가챠 배너들
export const GACHA_BANNERS: GachaBanner[] = [
  {
    id: 'kawaii',
    name: '🌸 카와이 컬렉션',
    description: '큐트하고 사랑스러운 아이템들이 가득!',
    theme: 'KAWAII PARADISE',
    featuredItems: GACHA_ITEMS.filter(item => item.sexiness && item.sexiness <= 2),
    cost: 300,
    bonusMultiplier: 1,
    bgGradient: 'from-pink-400 via-pink-500 to-pink-600'
  },
  {
    id: 'glamour',
    name: '💎 글래머 컬렉션',
    description: '섹시하고 고혹적인 아이템으로 변신하세요!',
    theme: 'GLAMOUR NIGHT',
    featuredItems: GACHA_ITEMS.filter(item => ['epic', 'legendary'].includes(item.rarity)),
    cost: 800,
    guaranteedRarity: 'epic',
    bonusMultiplier: 1.5,
    bgGradient: 'from-purple-600 via-pink-600 to-red-500'
  },
  {
    id: 'goddess',
    name: '👑 여신 컬렉션',
    description: '전설 속 여신들의 아이템을 소유하세요!',
    theme: 'DIVINE GODDESS',
    featuredItems: GACHA_ITEMS.filter(item => ['legendary', 'mythic'].includes(item.rarity)),
    cost: 1500,
    guaranteedRarity: 'legendary',
    bonusMultiplier: 3,
    bgGradient: 'from-yellow-400 via-pink-500 to-purple-600'
  }
];

export const RARITY_COLORS = {
  common: { 
    text: 'text-pink-300', 
    border: 'border-pink-300', 
    bg: 'from-pink-400 to-pink-600',
    glow: '0 0 20px rgba(236, 72, 153, 0.5)'
  },
  rare: { 
    text: 'text-purple-300', 
    border: 'border-purple-300', 
    bg: 'from-purple-400 to-purple-600',
    glow: '0 0 20px rgba(147, 51, 234, 0.5)'
  },
  epic: { 
    text: 'text-yellow-300', 
    border: 'border-yellow-300', 
    bg: 'from-yellow-400 to-orange-500',
    glow: '0 0 20px rgba(245, 158, 11, 0.5)'
  },
  legendary: { 
    text: 'text-red-300', 
    border: 'border-red-300', 
    bg: 'from-red-400 to-pink-500',
    glow: '0 0 20px rgba(239, 68, 68, 0.5)'
  },
  mythic: { 
    text: 'text-cyan-300', 
    border: 'border-cyan-300', 
    bg: 'from-cyan-400 to-purple-500',
    glow: '0 0 30px rgba(34, 211, 238, 0.8)'
  }
};

// 애니메이션 관련 상수들
export const ANIMATION_DURATIONS = {
  opening: 2000,
  revealing: 1000,
  particle: 3000,
  heartFloat: 8000
};

export const SEXY_EMOJIS = ['💋', '💖', '✨', '🌟', '💅', '👠', '💎', '🔥'];

export const BANNER_GRADIENTS = {
  kawaii: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(236, 72, 153, 0.4), rgba(219, 39, 119, 0.5))',
  glamour: 'linear-gradient(135deg, rgba(147, 51, 234, 0.5), rgba(236, 72, 153, 0.5), rgba(239, 68, 68, 0.4))',
  goddess: 'linear-gradient(135deg, rgba(250, 204, 21, 0.4), rgba(236, 72, 153, 0.5), rgba(147, 51, 234, 0.5))'
};