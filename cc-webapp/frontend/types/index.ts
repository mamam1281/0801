// 🎮 게임 사용자 타입
export interface User {
  id: string;
  nickname: string;
  goldBalance: number;
  level: number;
  experience: number;
  maxExperience: number;
  dailyStreak: number;
  achievements: string[];
  inventory: GameItem[];
  stats: GameStats;
  gameStats: GameStatsDetail;
  lastLogin: Date;
  totalPlayTime: number;
  isAdmin: boolean;
  registrationDate: Date;
  lastActivity: Date;
  deviceInfo: string;
  ipAddress: string;
}

// 🎯 게임 아이템 타입
export interface GameItem {
  id: string;
  name: string;
  type: 'powerup' | 'skin' | 'currency' | 'collectible' | 'weapon' | 'character' | 'premium' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  quantity: number;
  description: string;
  icon: string;
  value?: number;
}

// 📊 게임 통계 타입
export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  highestScore: number;
  totalEarnings: number;
  winStreak: number;
  favoriteGame: string;
}

// 📈 세부 게임 통계 타입
export interface GameStatsDetail {
  slot: {
    totalSpins: number;
    totalWinnings: number;
    biggestWin: number;
    jackpotHits: number;
  };
  rps: {
    totalGames: number;
    wins: number;
    currentStreak: number;
    bestStreak: number;
  };
  gacha: {
    totalPulls: number;
    legendaryPulls: number;
    totalValue: number;
    pulls: number;
    totalSpent: number;
    epicCount: number;
    legendaryCount: number;
  };
  crash: {
    totalGames: number;
    highestMultiplier: number;
    totalCashedOut: number;
    averageMultiplier: number;
  };
  roulette: {
    spins: number;
    wins: number;
    biggestWin: number;
  };
}

// 🔧 알림 인터페이스
export interface Notification {
  id: string;
  message: string;
  timestamp: number;
}

// 🎮 게임 대시보드 게임 정보 타입
export interface GameDashboardGame {
  id: string;
  name: string;
  type: 'slot' | 'rps' | 'gacha' | 'crash';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  playCount: number;
  bestScore: number;
  lastPlayed: Date | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  rewards: string[];
  trending: boolean;
  cost: number;
}

// � 보상 아이템 타입
export interface RewardItem {
  type: 'gold' | 'exp' | 'item';
  amount: number;
  name?: string; // 아이템인 경우 이름
}

// �🎯 미션 타입
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'achievement';
  status: 'active' | 'completed' | 'locked';
  progress: number;
  maxProgress: number;
  rewards: RewardItem[];
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  icon: string;
  expiresAt?: Date;
  requirements?: string[];
}

// 🎪 이벤트 타입
export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'limited' | 'seasonal' | 'special';
  status: 'active' | 'scheduled' | 'ended';
  startDate: Date;
  endDate: Date;
  rewards: RewardItem[];
  participants: number;
  maxParticipants?: number;
  requirements?: string[];
  icon: string;
}

// 📱 앱 화면 타입
export type AppScreen = 
  | 'loading'
  | 'login'
  | 'signup'
  | 'admin-login'
  | 'home-dashboard'
  | 'game-dashboard'
  | 'shop'
  | 'inventory'
  | 'profile'
  | 'settings'
  | 'admin-panel'
  | 'event-mission-panel'
  | 'neon-slot'
  | 'rps'
  | 'gacha'
  | 'crash'
  | 'streaming';

// 🎲 Gacha 관련 타입들
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

export const ANIMATION_DURATIONS = {
  SPIN: 2000,
  REVEAL: 800,
  PARTICLE_LIFE: 1500,
  MULTI_PULL_DELAY: 150,
  particle: 1500,
  opening: 1000,
  heartFloat: 1200
} as const;

// 🔧 관리자 전용 타입들
export interface UserImportData {
  nickname: string;
  email?: string;
  goldBalance?: number;
  level?: number;
  isAdmin?: boolean;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface SystemBackup {
  id: string;
  name: string;
  description: string;
  size: number;
  createdAt: Date;
  type: 'full' | 'users' | 'shop' | 'logs';
  status: 'creating' | 'completed' | 'failed';
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'event' | 'maintenance' | 'promotion';
  targetUsers: 'all' | 'active' | 'specific';
  userIds?: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  readCount?: number;
  clickCount?: number;
}