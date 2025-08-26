/*
 * Global Store (Context + Reducer)
 * - 서버 권위 프로필/밸런스 상태 보관
 * - 최소 스키마만 우선 도입(추후 확장)
 */
'use client';

import React, { createContext, useContext, useMemo, useReducer } from 'react';

export type GlobalUserProfile = {
  id: string | number;
  nickname: string;
  goldBalance: number;
  gemsBalance?: number;
  level?: number;
  xp?: number;
  updatedAt?: string;
  // 필요한 필드는 점진 확장
  [k: string]: unknown;
};

type GlobalState = {
  profile: GlobalUserProfile | null;
  hydrated: boolean;
  lastHydratedAt?: number;
};

type Actions =
  | { type: 'SET_PROFILE'; profile: GlobalUserProfile | null }
  | { type: 'SET_HYDRATED'; value: boolean }
  | { type: 'PATCH_BALANCES'; delta: { gold?: number; gems?: number } };

const initialState: GlobalState = {
  profile: null,
  hydrated: false,
  lastHydratedAt: undefined,
};

function reducer(state: GlobalState, action: Actions): GlobalState {
  switch (action.type) {
    case 'SET_PROFILE': {
      return {
        ...state,
        profile: action.profile,
        hydrated: true,
        lastHydratedAt: Date.now(),
      };
    }
    case 'SET_HYDRATED': {
      return {
        ...state,
        hydrated: action.value,
        lastHydratedAt: action.value ? Date.now() : state.lastHydratedAt,
      };
    }
    case 'PATCH_BALANCES': {
      if (!state.profile) return state;
      const gold = state.profile.goldBalance ?? 0;
      const gems = state.profile.gemsBalance ?? 0;
      return {
        ...state,
        profile: {
          ...state.profile,
          goldBalance: gold + (action.delta.gold ?? 0),
          gemsBalance: gems + (action.delta.gems ?? 0),
        },
      };
    }
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<Actions>;
} | null>(null);

export function GlobalStoreProvider({ children }: { children?: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return React.createElement(StoreContext.Provider, { value }, children as any);
}

export function useGlobalStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useGlobalStore must be used within GlobalStoreProvider');
  return ctx;
}

export function useGlobalProfile() {
  return useGlobalStore().state.profile;
}

export function useIsHydrated() {
  return useGlobalStore().state.hydrated;
}

// Action helpers
export function setProfile(dispatch: React.Dispatch<Actions>, profile: GlobalUserProfile | null) {
  dispatch({ type: 'SET_PROFILE', profile });
}

export function setHydrated(dispatch: React.Dispatch<Actions>, value: boolean) {
  dispatch({ type: 'SET_HYDRATED', value });
}

export function patchBalances(
  dispatch: React.Dispatch<Actions>,
  delta: { gold?: number; gems?: number }
) {
  dispatch({ type: 'PATCH_BALANCES', delta });
}
