import { User, GameSpecificStats } from '../types';

export function createDefaultGameStats(): GameSpecificStats {
  return {
    slot: {
      spins: 0,
      jackpots: 0,
      biggestWin: 0,
      totalWinnings: 0,
      wins: 0
    },
    rps: {
      matches: 0,
      wins: 0,
      draws: 0,
      winStreak: 0
    },
    gacha: {
      pulls: 0,
      legendaryCount: 0,
      epicCount: 0,
      totalSpent: 0
    },
    crash: { // 🚀 새로운 크래시 게임 기본 통계
      games: 0,
      totalWinnings: 0,
      biggestWin: 0,
      biggestMultiplier: 0,
      cashOutCount: 0
    }
    // 🚫 룰렛 통계 완전 제거
  };
}

export function ensureUserCompatibility(userData: any): User {
  // 기본 gameStats가 없으면 생성
  if (!userData.gameStats) {
    userData.gameStats = createDefaultGameStats();
  } else {
    // 각 게임 통계가 없으면 기본값으로 초기화
    if (!userData.gameStats.slot) {
      userData.gameStats.slot = {
        spins: 0,
        jackpots: 0,
        biggestWin: 0,
        totalWinnings: 0,
        wins: 0
      };
    }
    
    if (!userData.gameStats.rps) {
      userData.gameStats.rps = {
        matches: 0,
        wins: 0,
        draws: 0,
        winStreak: 0
      };
    }
    
    if (!userData.gameStats.gacha) {
      userData.gameStats.gacha = {
        pulls: 0,
        legendaryCount: 0,
        epicCount: 0,
        totalSpent: 0
      };
    }
    
    // 🚀 크래시 게임 통계 추가
    if (!userData.gameStats.crash) {
      userData.gameStats.crash = {
        games: 0,
        totalWinnings: 0,
        biggestWin: 0,
        biggestMultiplier: 0,
        cashOutCount: 0
      };
    }

    // 🚫 룰렛 통계 제거
    if (userData.gameStats.roulette) {
      delete userData.gameStats.roulette;
    }

    // 슬롯 wins 필드 추가 (없으면)
    if (userData.gameStats.slot && !userData.gameStats.slot.hasOwnProperty('wins')) {
      userData.gameStats.slot.wins = 0;
    }
  }

  // 기본 필드들 확인
  if (!userData.stats) {
    userData.stats = {
      gamesPlayed: 0,
      gamesWon: 0,
      highestScore: 0,
      totalEarnings: 0,
      winStreak: 0,
      favoriteGame: ''
    };
  }

  if (!userData.inventory) {
    userData.inventory = [];
  }

  if (!userData.achievements) {
    userData.achievements = [];
  }

  // Date 객체로 변환
  if (userData.lastLogin && typeof userData.lastLogin === 'string') {
    userData.lastLogin = new Date(userData.lastLogin);
  }

  if (userData.registrationDate && typeof userData.registrationDate === 'string') {
    userData.registrationDate = new Date(userData.registrationDate);
  }

  if (userData.lastActivity && typeof userData.lastActivity === 'string') {
    userData.lastActivity = new Date(userData.lastActivity);
  }

  return userData as User;
}

export function calculateExperiencePercentage(user: User): number {
  return Math.min(100, (user.experience / user.maxExperience) * 100);
}

export function calculateWinRate(user: User): number {
  if (user.stats.gamesPlayed === 0) return 0;
  return Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100);
}

export function checkLevelUp(user: User): { updatedUser: User; leveledUp: boolean } {
  if (user.experience >= user.maxExperience) {
    const newLevel = user.level + 1;
    const remainingExp = user.experience - user.maxExperience;
    const newMaxExp = user.maxExperience + (newLevel * 100); // 레벨당 경험치 증가
    
    return {
      updatedUser: {
        ...user,
        level: newLevel,
        experience: remainingExp,
        maxExperience: newMaxExp,
        goldBalance: user.goldBalance + (newLevel * 500) // 레벨업 보너스
      },
      leveledUp: true
    };
  }
  
  return { updatedUser: user, leveledUp: false };
}

export function calculateDailyBonus(user: User): { updatedUser: User; bonusGold: number } {
  const baseBonus = 1000;
  const streakBonus = user.dailyStreak * 200;
  const bonusGold = baseBonus + streakBonus;
  
  const updatedUser = {
    ...user,
    goldBalance: user.goldBalance + bonusGold,
    dailyStreak: user.dailyStreak + 1,
    lastLogin: new Date()
  };
  
  return { updatedUser, bonusGold };
}

export function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

export function getUserRank(user: User): { rank: string; color: string } {
  if (user.level >= 50) {
    return { rank: '전설', color: 'text-error' };
  } else if (user.level >= 30) {
    return { rank: '마스터', color: 'text-gold' };
  } else if (user.level >= 20) {
    return { rank: '엘리트', color: 'text-primary' };
  } else if (user.level >= 10) {
    return { rank: '베테랑', color: 'text-success' };
  } else {
    return { rank: '초보자', color: 'text-muted-foreground' };
  }
}