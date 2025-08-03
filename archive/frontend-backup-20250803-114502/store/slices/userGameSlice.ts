import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserGameState {
  userId: string | null;
  nickname: string | null;
  cyberTokenBalance: number;
  streakCount: number;
  // Potentially add other game-related user states here
  // e.g., highestWin, totalSpins, etc., if managed globally
}

const initialState: UserGameState = {
  userId: 'user123', // Mock initial value, replace with actual loading mechanism
  nickname: 'PlayerOne', // Mock initial value
  cyberTokenBalance: 1000, // Default starting balance
  streakCount: 0,
};

const userGameSlice = createSlice({
  name: 'userGame',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string | null>) => {
      state.userId = action.payload;
    },
    setNickname: (state, action: PayloadAction<string | null>) => {
      state.nickname = action.payload;
    },
    setCyberTokenBalance: (state, action: PayloadAction<number>) => {
      state.cyberTokenBalance = action.payload;
    },
    incrementCyberTokenBalance: (state, action: PayloadAction<number>) => {
      state.cyberTokenBalance += action.payload;
    },
    decrementCyberTokenBalance: (state, action: PayloadAction<number>) => {
      state.cyberTokenBalance -= action.payload;
      if (state.cyberTokenBalance < 0) state.cyberTokenBalance = 0; // Ensure balance doesn't go negative
    },
    setStreakCount: (state, action: PayloadAction<number>) => {
      state.streakCount = action.payload;
    },
    incrementStreakCount: (state) => {
      state.streakCount += 1;
    },
    resetStreakCount: (state) => {
      state.streakCount = 0;
    },
    initializeUserGameData: (state, action: PayloadAction<Partial<UserGameState>>) => {
      // For setting initial data loaded from API, e.g. on app start
      return { ...state, ...action.payload };
    }
  },
  // Extra reducers for async thunks can be added here if needed
});

export const {
  setUserId,
  setNickname,
  setCyberTokenBalance,
  incrementCyberTokenBalance,
  decrementCyberTokenBalance,
  setStreakCount,
  incrementStreakCount,
  resetStreakCount,
  initializeUserGameData,
} = userGameSlice.actions;

// Selector examples (can be in the same file or a dedicated selectors file)
// export const selectCyberTokenBalance = (state: { userGame: UserGameState }) => state.userGame.cyberTokenBalance;
// export const selectStreakCount = (state: { userGame: UserGameState }) => state.userGame.streakCount;
// export const selectUserId = (state: { userGame: UserGameState }) => state.userGame.userId;
// export const selectNickname = (state: { userGame: UserGameState }) => state.userGame.nickname;

export default userGameSlice.reducer;
