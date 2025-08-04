export type GachaTier = 'common' | 'rare' | 'epic' | 'legendary';

export interface GachaItem {
  id: string;
  name: string;
  tier: GachaTier;
  description: string;
  emoji: string;
  probability: number;
}

export interface GachaResult {
  item: GachaItem;
  isNew: boolean;
}

export const TIER_COLORS = {
  common: {
    name: '일반',
    color: '#9CA3AF',
    bg: 'rgba(120, 139, 172, 0.15)',
    border: '#9CA3AF',
    glow: 'rgba(156, 163, 175, 0.4)'
  },
  rare: {
    name: '레어',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.4)'
  },
  epic: {
    name: '에픽',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.4)'
  },
  legendary: {
    name: '전설',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#F59E0B',
    glow: 'rgba(243, 218, 174, 0.4)'
  }
};

export const SAMPLE_ITEMS: GachaItem[] = [
  // Common items (60%)
  { id: '1', name: '기본 검', tier: 'common', description: '평범한 검입니다.', emoji: '⚔️', probability: 20 },
  { id: '2', name: '나무 방패', tier: 'common', description: '나무로 만든 방패입니다.', emoji: '🛡️', probability: 20 },
  { id: '3', name: '체력 물약', tier: 'common', description: '체력을 회복하는 물약입니다.', emoji: '🧪', probability: 20 },

  // Rare items (25%)
  { id: '4', name: '강철 검', tier: 'rare', description: '강철로 제련된 검입니다.', emoji: '⚔️', probability: 12 },
  { id: '5', name: '마법 반지', tier: 'rare', description: '마법이 깃든 반지입니다.', emoji: '💍', probability: 13 },

  // Epic items (12%)
  { id: '6', name: '용의 검', tier: 'epic', description: '용의 힘이 깃든 전설의 검입니다.', emoji: '🗡️', probability: 7 },
  { id: '7', name: '마법사의 지팡이', tier: 'epic', description: '강력한 마법을 사용할 수 있는 지팡이입니다.', emoji: '🪄', probability: 5 },

  // Legendary items (3%)
  { id: '8', name: '신의 검', tier: 'legendary', description: '신이 내린 최강의 검입니다.', emoji: '⚡', probability: 2 },
  { id: '9', name: '불멸의 왕관', tier: 'legendary', description: '불멸의 힘을 주는 왕관입니다.', emoji: '👑', probability: 1 },
];
