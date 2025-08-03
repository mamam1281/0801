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
  type: 'powerup' | 'skin' | 'currency' | 'collectible';
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
    totalWinnings: number;
    bestWin: number;
  };
}

// 🔧 알림 인터페이스
export interface Notification {
  id: string;
  message: string;
  timestamp: number;
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
  | 'rock-paper-scissors'
  | 'gacha-system'
  | 'neon-crash'
  | 'streaming';

// 🎪 이벤트 타입
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: 'daily' | 'weekly' | 'special' | 'seasonal' | 'limited';
  rewards: GameItem[];
  requirements: string[];
  isActive: boolean;
  status: 'active' | 'completed' | 'expired' | 'scheduled' | 'ended';
  participants: number;
  maxParticipants?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  category: string;
  imageUrl?: string;
  icon?: string;
  progress?: number;
  maxProgress?: number;
}

// 🎯 미션 타입
export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement' | 'special';
  category: string;
  requirements: {
    action: string;
    target: number;
    current: number;
  } | string[]; // string[] for legacy compatibility
  rewards: GameItem[];
  isCompleted: boolean;
  isActive: boolean;
  status: 'active' | 'completed' | 'expired' | 'locked';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  expiresAt?: Date;
  priority: number;
  imageUrl?: string;
  icon?: string;
  progress?: number;
  maxProgress?: number;
}