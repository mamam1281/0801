/**
 * 레벨 시스템 유틸리티 함수들
 * 레벨 = (experience_points / 500) + 1
 */

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  progressPercent: number;
  xpToNext: number;
}

/**
 * 경험치 포인트를 기반으로 레벨과 진행도를 계산
 */
export function calculateLevelProgress(experiencePoints: number): LevelProgress {
  const currentLevel = Math.floor(experiencePoints / 500) + 1;
  const currentLevelStartXP = (currentLevel - 1) * 500;
  const nextLevelXP = currentLevel * 500;
  const currentXPInLevel = experiencePoints - currentLevelStartXP;
  const xpNeededForLevel = nextLevelXP - currentLevelStartXP;
  const progressPercent = (currentXPInLevel / xpNeededForLevel) * 100;
  const xpToNext = nextLevelXP - experiencePoints;

  return {
    currentLevel,
    currentXP: experiencePoints,
    nextLevelXP,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    xpToNext: Math.max(0, xpToNext),
  };
}

/**
 * 레벨에서 필요한 총 경험치 계산
 */
export function getXPForLevel(level: number): number {
  return (level - 1) * 500;
}

/**
 * 경험치에서 레벨 계산
 */
export function getLevelFromXP(experiencePoints: number): number {
  return Math.floor(experiencePoints / 500) + 1;
}
