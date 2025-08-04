import { User } from '../../../App';
import { GachaItem, GachaBanner, GACHA_ITEMS, ANIMATION_DURATIONS } from './constants';

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface HeartParticle {
  id: string;
  x: number;
  y: number;
}

// 고유 ID 생성기
let idCounter = 0;
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${++idCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate particles based on rarity
export const generateParticles = (rarity: string): Particle[] => {
  const colors = {
    common: ['#ec4899', '#f472b6'],
    rare: ['#8b5cf6', '#a78bfa'],
    epic: ['#f59e0b', '#fbbf24'],
    legendary: ['#ef4444', '#f87171'],
    mythic: ['#22d3ee', '#67e8f9', '#ffd700']
  };
  
  const particleCount = rarity === 'mythic' ? 30 : rarity === 'legendary' ? 20 : 15;
  return Array.from({ length: particleCount }, (_, i) => ({
    id: generateUniqueId(`particle-${rarity}`),
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: colors[rarity as keyof typeof colors]?.[Math.floor(Math.random() * colors[rarity as keyof typeof colors].length)] || '#ec4899',
    size: rarity === 'mythic' ? 6 : rarity === 'legendary' ? 4 : 3
  }));
};

// Generate floating heart particles
export const generateHeartParticles = (): HeartParticle[] => {
  return Array.from({ length: 3 }, (_, i) => ({
    id: generateUniqueId('heart'),
    x: Math.random() * 100,
    y: Math.random() * 100
  }));
};

// Generate sparkle effects for banners
export const generateSparkles = (count: number = 8) => {
  return Array.from({ length: count }, (_, i) => ({
    id: generateUniqueId('sparkle'),
    top: `${20 + (i * 10)}%`,
    left: `${10 + (i * 12)}%`,
    delay: i * 0.4
  }));
};

// Get random item based on rates
export const getRandomItem = (banner: GachaBanner, user: User): GachaItem => {
  // Adjust rates for premium banners
  let adjustedItems = [...GACHA_ITEMS];
  
  if (banner.guaranteedRarity === 'epic') {
    // Remove common items, increase epic/legendary rates
    adjustedItems = adjustedItems.filter(item => item.rarity !== 'common');
    adjustedItems = adjustedItems.map(item => ({
      ...item,
      rate: item.rarity === 'epic' ? item.rate * 2 : item.rate
    }));
  } else if (banner.guaranteedRarity === 'legendary') {
    // Only legendary and mythic items
    adjustedItems = adjustedItems.filter(item => ['legendary', 'mythic'].includes(item.rarity));
    adjustedItems = adjustedItems.map(item => ({
      ...item,
      rate: item.rarity === 'legendary' ? item.rate * 3 : item.rate * 2
    }));
  }

  const totalRate = adjustedItems.reduce((sum, item) => sum + item.rate, 0);
  let random = Math.random() * totalRate;
  
  for (const item of adjustedItems) {
    random -= item.rate;
    if (random <= 0) {
      return { ...item, isNew: !user.inventory.some(inv => inv.id === item.id) };
    }
  }
  
  return adjustedItems[0];
};

// Update user inventory with new item
export const updateUserInventory = (user: User, item: GachaItem): User => {
  const updatedInventory = [...user.inventory];
  const existingItemIndex = updatedInventory.findIndex(inv => inv.id === item.id);
  
  if (existingItemIndex !== -1) {
    updatedInventory[existingItemIndex].quantity += item.quantity;
  } else {
    updatedInventory.push(item);
  }
  
  return {
    ...user,
    inventory: updatedInventory
  };
};

// Get rarity notification message
export const getRarityMessage = (item: GachaItem): string => {
  const rarityMessages = {
    common: `💋 카와이 아이템: ${item.name}`,
    rare: `💎 레어 아이템: ${item.name}!`,
    epic: `🔥 에픽 아이템: ${item.name}!!`,
    legendary: `👑 레전더리 아이템: ${item.name}!!!`,
    mythic: `🌟 미식 아이템: ${item.name}!!!!`
  };
  
  return rarityMessages[item.rarity as keyof typeof rarityMessages];
};

// Count rarities in items array
export const countRarities = (items: GachaItem[]): Record<string, number> => {
  return items.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

// Get ten pull notification message
export const getTenPullMessage = (items: GachaItem[]): string => {
  const rarityCounts = countRarities(items);
  const notificationParts = [];
  
  if (rarityCounts.mythic) notificationParts.push(`🌟미식 ${rarityCounts.mythic}개`);
  if (rarityCounts.legendary) notificationParts.push(`👑레전더리 ${rarityCounts.legendary}개`);
  if (rarityCounts.epic) notificationParts.push(`🔥에픽 ${rarityCounts.epic}개`);
  
  return `🎁 10연 뽑기 완료! ${notificationParts.length > 0 ? notificationParts.join(', ') : '새로운 아이템들을 획득했습니다!'}`;
};

// Get banner background style
export const getBannerStyle = (banner: GachaBanner, isSelected: boolean) => {
  const colorMaps = {
    'pink-400': '236, 72, 153, 0.3',
    'pink-500': '236, 72, 153, 0.4', 
    'pink-600': '219, 39, 119, 0.5',
    'purple-600': '147, 51, 234, 0.5',
    'red-500': '239, 68, 68, 0.4',
    'yellow-400': '250, 204, 21, 0.4'
  };

  const gradient = banner.bgGradient.replace(/from-|via-|to-/g, '').split(' ').map(color => {
    const rgbaValue = colorMaps[color as keyof typeof colorMaps] || '255, 255, 255, 0.1';
    return `rgba(${rgbaValue})`;
  }).join(', ');

  return {
    background: `linear-gradient(135deg, ${gradient})`,
    border: isSelected ? '2px solid rgba(236, 72, 153, 1)' : '1px solid rgba(236, 72, 153, 0.3)'
  };
};

// Animation timing helpers
export const getAnimationDelay = (index: number, baseDelay: number = 0.1): number => {
  return baseDelay + (index * 0.1);
};

export const createAnimationSequence = async (steps: (() => Promise<void>)[]): Promise<void> => {
  for (const step of steps) {
    await step();
  }
};

// Sexiness level helpers
export const getSexinessLevel = (item: GachaItem): number => {
  return item.sexiness || 1;
};

export const getSexinessColor = (level: number): string => {
  const colors = {
    1: '#ec4899', // Pink
    2: '#8b5cf6', // Purple  
    3: '#f59e0b', // Orange
    4: '#ef4444', // Red
    5: '#22d3ee'  // Cyan
  };
  return colors[level as keyof typeof colors] || colors[1];
};