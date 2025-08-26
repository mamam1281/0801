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
  | { type: 'PATCH_BALANCES'; delta: { gold?: number; gems?: number } }
  | { type: 'APPLY_REWARD'; awarded: { gold?: number; gems?: number; reason?: string } }
  | { type: 'MERGE_PROFILE'; patch: Partial<GlobalUserProfile> }
  | { type: 'APPLY_PURCHASE'; items: any[] }
  | { type: 'MERGE_GAME_STATS'; source: string; delta: any };

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
    case 'APPLY_REWARD': {
      if (!state.profile) return state;
      const gold = state.profile.goldBalance ?? 0;
      const gems = state.profile.gemsBalance ?? 0;
      return {
        ...state,
        profile: {
          ...state.profile,
          goldBalance: gold + (action.awarded.gold ?? 0),
          gemsBalance: gems + (action.awarded.gems ?? 0),
          updatedAt: new Date().toISOString(),
        },
      };
    }
    case 'MERGE_PROFILE': {
      const existing = state.profile ?? ({} as GlobalUserProfile);
      const merged = {
        ...existing,
        ...action.patch,
        updatedAt: new Date().toISOString(),
      } as GlobalUserProfile;
      return {
        ...state,
        profile: merged,
        hydrated: true,
        lastHydratedAt: Date.now(),
      };
    }
    case 'APPLY_PURCHASE': {
      // inventory not stored globally yet; placeholder for future expansion
      return state;
    }
    case 'MERGE_GAME_STATS': {
      // game stats not stored in global state currently; ignore for now
      return state;
    }
    default:
      return state;
  }
}

export const StoreContext = createContext<{
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
  if (!ctx) {
    // SSR or outside provider: return a safe fallback to avoid runtime throws.
    return {
      state: initialState,
      dispatch: (() => {
        /* noop */
      }) as React.Dispatch<Actions>,
    } as { state: GlobalState; dispatch: React.Dispatch<Actions> };
  }
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

// Additional helpers used across the UI
export function mergeProfile(dispatch: React.Dispatch<Actions>, patch: Partial<GlobalUserProfile>) {
  dispatch({ type: 'MERGE_PROFILE', patch });
}

export function applyPurchase(dispatch: React.Dispatch<Actions>, items: any[]) {
  dispatch({ type: 'APPLY_PURCHASE', items });
}

export function applyReward(
  dispatch: React.Dispatch<Actions>,
  awarded: { gold?: number; gems?: number; reason?: string }
) {
  dispatch({ type: 'APPLY_REWARD', awarded });
}

export function mergeGameStats(dispatch: React.Dispatch<Actions>, source: string, delta: any) {
  dispatch({ type: 'MERGE_GAME_STATS', source, delta });
}

// Reconcile helper: 호출 시 서버 권위로 프로필/밸런스를 재하이드레이트합니다.
// dynamic import 사용으로 로드 시 순환 의존을 방지합니다.
export async function reconcileBalance(dispatch: React.Dispatch<Actions>) {
  try {
    const m = await import('../lib/sync');
    if (m && typeof m.hydrateProfile === 'function') {
      await m.hydrateProfile(dispatch as any);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[globalStore] reconcileBalance 실패', e);
  }
}
