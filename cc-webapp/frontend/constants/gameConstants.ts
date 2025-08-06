import { 
  Dice1,
  Swords,
  Gift,
  Zap
} from 'lucide-react';
import { GameDashboardGame, User } from '../types';

// 🎮 게임 목록 데이터
export const createGamesData = (user: User): GameDashboardGame[] => [
  {
    id: 'slot',
    name: '모델 포인트슬롯',
    type: 'slot',
    icon: Dice1,
    color: 'from-primary to-primary-light',
    description: '잭팟의 짜릿함! 모델회원 전용 슬롯서비스',
    playCount: user.gameStats.slot?.totalSpins || 0,
    bestScore: user.gameStats.slot?.biggestWin || 0,
    lastPlayed: new Date(),
    difficulty: 'Easy',
    rewards: ['골드', '경험치', '특별 스킨'],

    trending: true,
    cost: 100
  },
  {
    id: 'rps',
    name: '가위바위보',
    type: 'rps',
    icon: Swords,
    color: 'from-success to-info',
    description: 'AI와 두뇌 대결! 승부의 짜릿함!',
    playCount: user.gameStats.rps?.totalGames || 0,
    bestScore: user.gameStats.rps?.bestStreak || 0,
    lastPlayed: new Date(),
    difficulty: 'Medium',
    rewards: ['골드', '전략 포인트', '승부사 배지'],

    trending: false,
    cost: 50
  },
  {
    id: 'gacha',
    name: '랜덤뽑기',
    type: 'gacha',
    icon: Gift,
    color: 'from-error to-warning',
    description: '엄청난 아이템혜택! 지금 바로 도전하세요!',
    playCount: user.gameStats.gacha?.totalPulls || 0,
    bestScore: user.gameStats.gacha?.legendaryPulls || 0,
    lastPlayed: new Date(),
    difficulty: 'Extreme',
    rewards: ['전설 아이템', '희귀 스킨', '특별 캐릭터'],

    trending: true,
    cost: 500
  },
  {
    id: 'crash',
    name: '모델 그래프',
    type: 'crash',
    icon: Zap,
    color: 'from-error to-primary',
    description: '배율 상승의 스릴! 언제 터질까?',
    playCount: user.gameStats.crash?.totalGames || 0,
    bestScore: user.gameStats.crash?.highestMultiplier || 0,
    lastPlayed: new Date(),
    difficulty: 'Hard',
    rewards: ['고배율 골드', '크래시 배지', '스릴 포인트'],

    trending: true,
    cost: 100
  }
];

// 🎯 리더보드 더미 데이터
export const createLeaderboardData = (user: User) => [
  { rank: 1, name: '레전드게이머', score: 125640, trend: 'up' as const },
  { rank: 2, name: 'ProPlayer2024', score: 98230, trend: 'up' as const },
  { rank: 3, name: user.nickname, score: user.stats.totalEarnings, trend: 'same' as const },
  { rank: 4, name: 'GameMaster', score: 87150, trend: 'down' as const },
  { rank: 5, name: 'ClickKing', score: 75680, trend: 'up' as const }
];