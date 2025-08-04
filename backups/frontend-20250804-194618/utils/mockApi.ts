// Mock API client for SlotMachine integration

// Interfaces based on typical API responses and requirements
export interface SpinRequestBody {
  userId: string | number; // Assuming userId will be available
  betAmount: number;
}

export interface SymbolType { // Define more concretely if needed
  name: string; // e.g., "Diamond"
  icon: string; // e.g., "💎"
}

export interface SpinResponseBody {
  reels: string[]; // Array of symbols, e.g., ['💎', '🍒', '🔔']
  winAmount: number;
  isWin: boolean;
  winType?: string; // e.g., "Triple Diamond", "Small Win"
  winningPositions?: number[]; // e.g., [0, 1, 2]
  newCyberTokenBalance: number;
  newStreakCount: number;
  jackpotWon?: boolean; // If a jackpot was hit
  jackpotAmount?: number; // Amount of the jackpot won
  aiMessage?: string; // Optional AI message directly from spin
}

export interface ActionRequestBody {
  userId: string | number;
  actionType: string; // e.g., "slot_spin"
  details: Record<string, any>; // e.g., { betAmount: 10, reels: ['💎', '🍒', '🔔'] }
}

export interface FeedbackRequestBody {
  userId: string | number;
  game: string; // "slots"
  event: 'win' | 'loss' | 'jackpot' | 'streak_bonus';
  sentiment?: 'positive' | 'negative' | 'neutral'; // Optional, could be analyzed by backend
  details: Record<string, any>; // e.g., { winAmount: 50, streak: 3 }
}

export interface FeedbackResponseBody {
  aiMessage: string; // CJ AI's response
  emotionalState?: string; // e.g., "excited", "encouraged"
}

// Mock API functions
const MOCK_API_DELAY = 800; // Simulate network latency

// Mock symbols from slotLogic (should ideally be shared)
const MOCK_SYMBOLS = ['💎', '👑', '🎰', '🍒', '🔔', '7️⃣', '⭐'];

// Mock checkWinCondition from slotLogic
const mockCheckWinCondition = (reels: string[], betAmount: number): { isWin: boolean; payout: number; winType?: string; winningPositions?: number[] } => {
  // Simplified win logic for mock
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    let payoutMultiplier = 2;
    if (reels[0] === '⭐') payoutMultiplier = 50; // Jackpot symbol
    else if (reels[0] === '7️⃣') payoutMultiplier = 20;
    else if (reels[0] === '💎') payoutMultiplier = 10;
    return { isWin: true, payout: betAmount * payoutMultiplier, winType: `Triple ${reels[0]}`, winningPositions: [0, 1, 2] };
  }
  if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    return { isWin: true, payout: Math.floor(betAmount * 1.5), winType: 'Double Match', winningPositions: reels[0] === reels[1] ? [0,1] : (reels[1] === reels[2] ? [1,2] : [0,2]) };
  }
  return { isWin: false, payout: 0 };
};


export const postSlotSpin = async (body: SpinRequestBody, currentBalance: number, currentStreak: number): Promise<SpinResponseBody> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newReels = [
        MOCK_SYMBOLS[Math.floor(Math.random() * MOCK_SYMBOLS.length)],
        MOCK_SYMBOLS[Math.floor(Math.random() * MOCK_SYMBOLS.length)],
        MOCK_SYMBOLS[Math.floor(Math.random() * MOCK_SYMBOLS.length)],
      ];

      const winCheck = mockCheckWinCondition(newReels, body.betAmount);
      let newCyberTokenBalance = currentBalance - body.betAmount;
      let newStreakCount = currentStreak;

      if (winCheck.isWin) {
        newCyberTokenBalance += winCheck.payout;
        newStreakCount++;
      } else {
        newStreakCount = 0;
      }

      // Simulate rare jackpot
      const isJackpot = MOCK_SYMBOLS.includes('⭐') && newReels.every(s => s === '⭐') && Math.random() < 0.1; // 10% chance if all stars for mock
      let jackpotAmount = 0;
      if(isJackpot) {
        jackpotAmount = 5000 + Math.floor(Math.random() * 5000); // Random jackpot amount
        newCyberTokenBalance += jackpotAmount;
        winCheck.winType = "MEGA JACKPOT!";
        winCheck.payout += jackpotAmount; // Add jackpot to payout for simplicity in this mock
      }

      resolve({
        reels: newReels,
        winAmount: winCheck.payout,
        isWin: winCheck.isWin,
        winType: winCheck.winType,
        winningPositions: winCheck.winningPositions,
        newCyberTokenBalance,
        newStreakCount,
        jackpotWon: isJackpot,
        jackpotAmount: isJackpot ? jackpotAmount : undefined,
        aiMessage: winCheck.isWin ? `🎉 Wow! You won ${winCheck.payout} tokens!` : `🎲 Better luck next time! Your streak is now ${newStreakCount}.`
      });
    }, MOCK_API_DELAY);
  });
};

export const recordAction = async (body: ActionRequestBody): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Mock API: Action recorded', body);
      resolve({ success: true });
    }, MOCK_API_DELAY / 2);
  });
};

// GET /api/rewards is usually for fetching history, not updating it.
// Reward updates would typically happen on the backend after a spin.
// For this mock, we'll assume it's just a log.
export const getRewardsHistory = async (userId: string | number): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Mock API: Fetched rewards history for user', userId);
      resolve([{ rewardId: 'rew123', type: 'slot_win', amount: 50, date: new Date().toISOString() }]);
    }, MOCK_API_DELAY);
  });
};

export const postFeedback = async (body: FeedbackRequestBody): Promise<FeedbackResponseBody> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Mock API: Feedback posted', body);
      let aiMessage = "Thanks for the feedback!";
      if (body.event === 'win') aiMessage = `Awesome win, ${body.details.nickname}! Keep it up! 🔥`;
      if (body.event === 'loss') aiMessage = `Don't worry, ${body.details.nickname}! The next big win could be yours! Streak ${body.details.streakCount} is good!`;
      if (body.event === 'jackpot') aiMessage = `🤯 JACKPOT, ${body.details.nickname}!! You hit the motherlode of ${body.details.winAmount} tokens! 🥳`;

      resolve({
        aiMessage,
        emotionalState: body.event === 'win' || body.event === 'jackpot' ? 'excited' : 'encouraged'
      });
    }, MOCK_API_DELAY / 2);
  });
};
