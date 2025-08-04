// 슬롯 머신 게임 로직

export const SYMBOLS = ['🍒', '🔔', '💎', '7️⃣', '⭐'];

export interface WinResult {
  isWin: boolean;
  payout: number;
  winType?: string;
  winningPositions?: number[];
  multiplier?: number;
}

// 랜덤 심볼 생성
export function getRandomSymbol(): string {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

// 스핀 결과 생성
export function generateSpinResult(): string[] {
  return [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
}

// 심볼별 가중치 (낮을수록 자주 나옴)
export const SYMBOL_WEIGHTS: Record<string, number> = {
  '🍒': 30, // 가장 자주 나옴
  '🔔': 25,
  '💎': 20,
  '7️⃣': 15,
  '⭐': 5   // 가장 희귀
};

// 가중치를 적용한 랜덤 심볼 생성
export function getWeightedRandomSymbol(): string {
  const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [symbol, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return symbol;
    }
  }

  return SYMBOLS[0]; // 폴백
}

// 연속 패배 시 승리 확률 증가 로직 (Backend responsibility, but can be used for frontend optimistic updates or display)
export function adjustWinChance(consecutiveLosses: number): number { // Returns the probability
  const baseChance = 0.15; // 15% 기본 승리 확률
  const bonusChance = Math.min(consecutiveLosses * 0.05, 0.3); // 최대 30% 보너스
  return baseChance + bonusChance;
}

// 잭팟 확률 계산 (Backend responsibility, but can be used for frontend optimistic updates or display)
export function calculateJackpotChance(betAmount: number, consecutiveSpinsSinceLastJackpot: number): number { // Returns the probability
  if (betAmount < 50) return 0; // 최소 50코인 이상 베팅 시에만 잭팟 가능

  const baseChance = 0.0005; // 0.05% 기본 확률 (reduced from example for realism)
  // Bet multiplier could be more complex, e.g. non-linear. For now, simple.
  const betMultiplier = 1 + (betAmount - 50) / 50; // Increases chance by 1x for each 50 over min bet. Max bet 100 -> 2x.

  // Spin bonus could also be non-linear or capped
  const spinBonusFactor = Math.min(consecutiveSpinsSinceLastJackpot * 0.00001, 0.0005); // Small increase per spin

  return Math.min(baseChance * betMultiplier + spinBonusFactor, 0.01); // Cap total jackpot chance e.g. at 1%
}

// This function would typically be on the backend.
// For frontend, it's more about reacting to a `jackpotWon: true` from API.
export function isGlobalJackpotHit(betAmount: number, consecutiveSpins: number, currentJackpotAmount: number): boolean {
    // This is a simplified mock. Real jackpot logic is complex and server-side.
    // The calculateJackpotChance gives a probability.
    // The actual "hit" would be determined by the server comparing a random number to this probability.
    // And a "Triple Star" might be a condition for winning the displayed global jackpot amount.
    const chance = calculateJackpotChance(betAmount, consecutiveSpins);
    return Math.random() < chance;
}

export function checkWinCondition(reels: string[], betAmount: number): WinResult {
  const result: WinResult = {
    isWin: false,
    payout: 0,
    winningPositions: [],
    multiplier: 0
  };

  // 3개 모두 같은 경우 (트리플)
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    result.isWin = true;
    result.winningPositions = [0, 1, 2];

    switch (reels[0]) {
      case '🍒':
        result.multiplier = 5;
        result.payout = betAmount * result.multiplier;
        result.winType = '🍒 체리 트리플! 🍒';
        break;
      case '🔔':
        result.multiplier = 10;
        result.payout = betAmount * result.multiplier;
        result.winType = '🔔 벨 트리플! 🔔';
        break;
      case '💎':
        result.multiplier = 20;
        result.payout = betAmount * result.multiplier;
        result.winType = '💎 다이아몬드 트리플! 💎';
        break;
      case '7️⃣':
        result.multiplier = 50;
        result.payout = betAmount * result.multiplier;
        result.winType = '7️⃣ 럭키 세븐! 7️⃣';
        break;
      case '⭐':
        result.multiplier = 100;
        result.payout = betAmount * result.multiplier;
        result.winType = '⭐ 잭팟! ⭐';
        break;
    }
  }
  // 2개 같은 경우 (페어)
  else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    result.isWin = true;
    result.multiplier = 1.5;
    result.payout = Math.floor(betAmount * result.multiplier);
    result.winType = '페어 매치!';
    
    // 매칭된 위치 찾기
    if (reels[0] === reels[1]) {
      result.winningPositions = [0, 1];
    } else if (reels[1] === reels[2]) {
      result.winningPositions = [1, 2];
    } else {
      result.winningPositions = [0, 2];
    }
  }

  return result;
}
