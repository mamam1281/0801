import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CyberTokenState {
  balance: number;
  lastTransactionAmount: number | null;
  lastTransactionStatus: 'success' | 'failed' | null;
}

const initialState: CyberTokenState = {
  balance: 1000, // Initial mock balance
  lastTransactionAmount: null,
  lastTransactionStatus: null,
};

const cyberTokenSlice = createSlice({
  name: 'cyberToken',
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    incrementBalance: (state, action: PayloadAction<number>) => {
      state.balance += action.payload;
      state.lastTransactionAmount = action.payload;
      state.lastTransactionStatus = 'success';
    },
    decrementBalance: (state, action: PayloadAction<number>) => {
      if (state.balance >= action.payload) {
        state.balance -= action.payload;
        state.lastTransactionAmount = -action.payload;
        state.lastTransactionStatus = 'success';
      } else {
        state.lastTransactionAmount = -action.payload;
        state.lastTransactionStatus = 'failed';
        // Optionally, dispatch a notification or handle insufficient funds
        console.warn('Transaction failed: Insufficient token balance.');
      }
    },
    clearLastTransaction: (state) => {
      state.lastTransactionAmount = null;
      state.lastTransactionStatus = null;
    },
  },
});

export const {
  setBalance,
  incrementBalance,
  decrementBalance,
  clearLastTransaction
} = cyberTokenSlice.actions;

export default cyberTokenSlice.reducer;
