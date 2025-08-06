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
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
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
    pulls: number[]; 
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

// GameSpecific 타입 추가 (GameSpecificStats 대신 GameStatsDetail 사용)
export type GameSpecific = GameStatsDetail;

// Event 타입이 이미 추가되어 있는지 확인하고, 없으면 추가
// Mission 타입도 이미 추가됨

