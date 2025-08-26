'use client';

import React, { createContext, useContext, useReducer } from 'react';
import { api } from '../lib/unifiedApi';

// Types
export type User = {
  id: string | number;
  nickname?: string;
  tier?: string;
  created_at?: string;
  // ...other profile fields
};

export type Balances = {
  gold: number;
  gems?: number;
  [k: string]: any;
};

export type GameStats = Record<string, number>;
export type Inventory = Array<any>;
export type Streak = { level?: number; last_claim_ts?: string };
export type EventItem = { id: string; type: string; payload?: any };
export type NotificationItem = { id: string; type: string; message: string; meta?: any };

export type GlobalState = {
  user: User | null;
  balances: Balances;
  gameStats: GameStats;
  inventory: Inventory;
  streak?: Streak;
  events: EventItem[];
  notifications: NotificationItem[];
  ready: boolean;
  lastError?: string | null;
};

const initialState: GlobalState = {
  user: null,
  balances: { gold: 0, gems: 0 },
  gameStats: {},
  inventory: [],
  streak: {},
  events: [],
  notifications: [],
  ready: false,
  lastError: null,
};

// Actions
type Action =
  | { type: 'SET_READY'; ready: boolean }
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_BALANCES'; balances: Balances }
  | { type: 'MERGE_GAME_STATS'; stats: GameStats }
  | { type: 'APPLY_REWARD'; reward: { gold?: number; gems?: number; items?: any[] } }
  | {
      type: 'APPLY_PURCHASE';
      purchase: { gold_delta?: number; gems_delta?: number; items?: any[] };
    }
  | { type: 'SET_LAST_ERROR'; error?: string | null }
  | { type: 'PUSH_NOTIFICATION'; notification: NotificationItem };

function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'SET_READY':
      return { ...state, ready: action.ready };
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_BALANCES':
      return { ...state, balances: { ...state.balances, ...action.balances } };
    case 'MERGE_GAME_STATS':
      return { ...state, gameStats: { ...state.gameStats, ...action.stats } };
    case 'APPLY_REWARD': {
      const { gold = 0, gems = 0, items = [] } = action.reward;
      return {
        ...state,
        balances: {
          ...state.balances,
          gold: (state.balances.gold || 0) + gold,
          gems: (state.balances.gems || 0) + gems,
        },
        inventory: [...state.inventory, ...items],
      };
    }
    case 'APPLY_PURCHASE': {
      const { gold_delta = 0, gems_delta = 0, items = [] } = action.purchase;
      return {
        ...state,
        balances: {
          ...state.balances,
          gold: (state.balances.gold || 0) + gold_delta,
          gems: (state.balances.gems || 0) + gems_delta,
        },
        inventory: [...state.inventory, ...items],
      };
    }
    case 'SET_LAST_ERROR':
      return { ...state, lastError: action.error ?? null };
    case 'PUSH_NOTIFICATION':
      return {
        ...state,
        notifications: [action.notification, ...state.notifications].slice(0, 100),
      };
    default:
      return state;
  }
}

type Dispatch = (action: Action) => void;

const GlobalStoreContext = createContext<{
  state: GlobalState;
  dispatch: Dispatch;
} | null>(null);

export function GlobalStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GlobalStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStoreContext.Provider>
  );
}

export function useGlobalStore() {
  const ctx = useContext(GlobalStoreContext);
  if (!ctx) throw new Error('useGlobalStore must be used within GlobalStoreProvider');
  return ctx;
}

// 호환용 프로필 셀렉터: 기존 GlobalUserProfile 형태를 에뮬레이션
export function useGlobalProfile(): any | null {
  const { state } = useGlobalStore();
  if (!state) return null;
  const user = state.user || ({} as any);
  return {
    ...user,
    goldBalance: Number(state.balances?.gold ?? 0),
    gemsBalance: Number(state.balances?.gems ?? 0),
  };
}

// Action helpers
export const hydrateFromServer = async (dispatch: Dispatch) => {
  try {
    const [me, balances, stats] = await Promise.all([
      api.get('auth/me'),
      api.get('users/balance'),
      api.get('games/stats/me'),
    ]);
    dispatch({ type: 'SET_USER', user: me });
    dispatch({ type: 'SET_BALANCES', balances });
    dispatch({ type: 'MERGE_GAME_STATS', stats });
    dispatch({ type: 'SET_READY', ready: true });
  } catch (err: any) {
    dispatch({ type: 'SET_LAST_ERROR', error: err?.message ?? 'hydrate_failed' });
  }
};

export const reconcileBalance = async (dispatch: Dispatch) => {
  try {
    const balances = await api.get('users/balance');
    dispatch({ type: 'SET_BALANCES', balances });
  } catch (err: any) {
    dispatch({ type: 'SET_LAST_ERROR', error: err?.message ?? 'reconcile_failed' });
  }
};

// 범용 시그니처 지원: (dispatch, stats) | (dispatch, game: string, delta)
export const mergeGameStats = (
  dispatch: Dispatch,
  a: GameStats | string,
  b?: Record<string, any>
) => {
  if (typeof a === 'string' && b && typeof b === 'object') {
    const out: GameStats = {};
    for (const [k, v] of Object.entries(b)) {
      if (typeof v === 'number') out[`${a}.${k}`] = v;
    }
    dispatch({ type: 'MERGE_GAME_STATS', stats: out });
  } else {
    dispatch({ type: 'MERGE_GAME_STATS', stats: a as GameStats });
  }
};

export const applyReward = (
  dispatch: Dispatch,
  reward: { gold?: number; gems?: number; items?: any[] }
) => {
  dispatch({ type: 'APPLY_REWARD', reward });
};

export const applyPurchase = (
  dispatch: Dispatch,
  purchase: { gold_delta?: number; gems_delta?: number; items?: any[] }
) => {
  dispatch({ type: 'APPLY_PURCHASE', purchase });
};

// 호환 헬퍼: 기존 setProfile/mergeProfile/patchBalances 시그니처를 새 스토어로 매핑
export function setProfile(dispatch: Dispatch, profile: any | null) {
  if (!profile) {
    dispatch({ type: 'SET_USER', user: null });
    return;
  }
  const { goldBalance, gemsBalance, ...rest } = profile as any;
  if (goldBalance != null || gemsBalance != null) {
    dispatch({
      type: 'SET_BALANCES',
      balances: {
        ...(goldBalance != null ? { gold: Number(goldBalance) } : {}),
        ...(gemsBalance != null ? { gems: Number(gemsBalance) } : {}),
      } as Balances,
    });
  }
  dispatch({ type: 'SET_USER', user: rest as User });
}

export function mergeProfile(dispatch: Dispatch, patch: Record<string, any>) {
  const { goldBalance, gemsBalance, ...rest } = (patch || {}) as any;
  if (goldBalance != null || gemsBalance != null) {
    dispatch({
      type: 'SET_BALANCES',
      balances: {
        ...(goldBalance != null ? { gold: Number(goldBalance) } : {}),
        ...(gemsBalance != null ? { gems: Number(gemsBalance) } : {}),
      } as Balances,
    });
  }
  if (Object.keys(rest).length > 0) {
    // 병합 동작을 위해 최소한으로 필드 덮어쓰기(서버 응답이 전체 프로필일 것을 가정)
    dispatch({ type: 'SET_USER', user: rest as User });
  }
}

export function patchBalances(dispatch: Dispatch, delta: { gold?: number; gems?: number }) {
  // 누적 반영은 APPLY_REWARD로 처리(내부에서 가산)
  dispatch({ type: 'APPLY_REWARD', reward: { gold: delta.gold ?? 0, gems: delta.gems ?? 0 } });
}

export default GlobalStoreProvider;
