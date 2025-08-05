import { configureStore } from '@reduxjs/toolkit';
import cyberTokenReducer from './cyberTokenSlice';

export const store = configureStore({
  reducer: {
    cyberToken: cyberTokenReducer,
    // Add other reducers here if needed
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Optional: Define typed hooks for convenience
// import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// export const useAppDispatch = () => useDispatch<AppDispatch>();
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
