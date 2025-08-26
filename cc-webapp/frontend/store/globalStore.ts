/*
 * Global Store (Context + Reducer)
 * - 서버 권위 프로필/밸런스 상태 보관
 * - 최소 스키마만 우선 도입(추후 확장)
 */
"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

export type GlobalUserProfile = {
    id: string | number;
    nickname: string;
    goldBalance: number;
    gemsBalance?: number;
    level?: number;
    xp?: number;
    updatedAt?: string;
    [k: string]: unknown;
};

// 인벤토리 아이템(느슨한 스키마; 서버 권위와 실시간 동기화 전제)
export type InventoryItem = {
    id: string;
    name: string;
    type?: string;
    rarity?: string;
    quantity?: number;
    value?: number;
    icon?: string;
    [k: string]: unknown;
};

type GlobalState = {
    profile: GlobalUserProfile | null;
    hydrated: boolean;
    lastHydratedAt?: number;
    // 게임별 통계(키: 게임 식별자)
    gameStats?: Record<string, any>;
    // 인벤토리(가벼운 캐시; 서버와 불일치 시 서버값 우선)
    inventory?: InventoryItem[];
};

type Actions =
    | { type: "SET_PROFILE"; profile: GlobalUserProfile | null }
    | { type: "SET_HYDRATED"; value: boolean }
    | { type: "PATCH_BALANCES"; delta: { gold?: number; gems?: number } }
    | { type: "APPLY_REWARD"; awarded: { gold?: number; gems?: number; reason?: string } }
    | { type: "MERGE_PROFILE"; patch: Partial<GlobalUserProfile> & Record<string, unknown> }
    | { type: "MERGE_GAME_STATS"; game: string; delta: Record<string, any> }
    | { type: "APPLY_PURCHASE"; items: InventoryItem[]; replace?: boolean };

const initialState: GlobalState = {
    profile: null,
    hydrated: false,
    lastHydratedAt: undefined,
    gameStats: {},
    inventory: [],
};

function reducer(state: GlobalState, action: Actions): GlobalState {
    switch (action.type) {
        case "SET_PROFILE":
            return { ...state, profile: action.profile, hydrated: true, lastHydratedAt: Date.now() };
        case "SET_HYDRATED":
            return { ...state, hydrated: action.value, lastHydratedAt: action.value ? Date.now() : state.lastHydratedAt };
        case "PATCH_BALANCES": {
            if (!state.profile) return state;
            const gold = state.profile.goldBalance ?? 0;
            const gems = (state.profile as any).gemsBalance ?? 0;
            return {
                ...state,
                profile: {
                    ...state.profile,
                    goldBalance: gold + (action.delta.gold ?? 0),
                    gemsBalance: gems + (action.delta.gems ?? 0),
                } as GlobalUserProfile,
            };
        }
        case "MERGE_PROFILE": {
            if (!state.profile) {
                // If profile isn't set yet, create one from patch minimally
                return { ...state, profile: { goldBalance: 0, nickname: "", id: "unknown", ...(action.patch as any) } };
            }
            return { ...state, profile: { ...state.profile, ...(action.patch as any) } as GlobalUserProfile };
        }
        case "MERGE_GAME_STATS": {
            const current = state.gameStats || {};
            const prev = (current[action.game] as any) || {};

            const deepMergeNumericAdd = (a: any, b: any): any => {
                if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
                if (typeof a === "number" && typeof b === "number") return a + b;
                if (a === undefined) return b;
                if (b === undefined) return a;
                if (typeof a === "object" && typeof b === "object") {
                    const out: Record<string, any> = { ...a };
                    for (const k of Object.keys(b)) {
                        out[k] = deepMergeNumericAdd((a as any)[k], (b as any)[k]);
                    }
                    return out;
                }
                return b; // 다른 타입은 최근 delta로 덮기
            };

            const mergedForGame = deepMergeNumericAdd(prev, action.delta);
            return { ...state, gameStats: { ...current, [action.game]: mergedForGame } };
        }
        case "PATCH_BALANCES": {
            if (!state.profile) return state;
            const gold = state.profile.goldBalance ?? 0;
            const gems = (state.profile as any).gemsBalance ?? 0;
            return {
                ...state,
                profile: {
                    ...state.profile,
                    goldBalance: gold + (action.delta.gold ?? 0),
                    gemsBalance: gems + (action.delta.gems ?? 0),
                } as GlobalUserProfile,
            };
        }
        case "APPLY_REWARD": {
            if (!state.profile) return state;
            const gold = state.profile.goldBalance ?? 0;
            const gems = (state.profile as any).gemsBalance ?? 0;
            return {
                ...state,
                profile: {
                    ...state.profile,
                    goldBalance: gold + (action.awarded.gold ?? 0),
                    gemsBalance: gems + (action.awarded.gems ?? 0),
                    updatedAt: new Date().toISOString(),
                } as GlobalUserProfile,
            };
        }
        case "APPLY_PURCHASE": {
            const current = state.inventory || [];
            if (action.replace) {
                return { ...state, inventory: [...action.items] };
            }
            // 동일 id는 수량 합산(없으면 append)
            const byId: Record<string, InventoryItem> = {};
            for (const it of current) byId[it.id] = { ...it };
            for (const it of action.items) {
                const prev = byId[it.id];
                if (prev) {
                    byId[it.id] = {
                        ...prev,
                        ...it,
                        quantity: (prev.quantity ?? 0) + (it.quantity ?? 0),
                    };
                } else {
                    byId[it.id] = { ...it } as InventoryItem;
                }
            }
            return { ...state, inventory: Object.values(byId) };
        }
        default:
            return state;
    }
}

type DispatchFn = (action: Actions) => void;
export const StoreContext = createContext(null as unknown as { state: GlobalState; dispatch: DispatchFn } | null);

export function GlobalStoreProvider(props: { children?: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const value = useMemo(() => ({ state, dispatch }), [state]);
    return React.createElement((StoreContext as any).Provider, { value }, props.children as any);
}

export function useGlobalStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) {
        // SSR or outside provider: return a safe fallback to avoid runtime throws.
        return {
            state: initialState,
            dispatch: (() => { }) as DispatchFn,
        } as { state: GlobalState; dispatch: DispatchFn };
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
export function setProfile(dispatch: DispatchFn, profile: GlobalUserProfile | null) {
    dispatch({ type: "SET_PROFILE", profile });
}

export function setHydrated(dispatch: DispatchFn, value: boolean) {
    dispatch({ type: "SET_HYDRATED", value });
}

export function patchBalances(dispatch: DispatchFn, delta: { gold?: number; gems?: number }) {
    dispatch({ type: "PATCH_BALANCES", delta });
}

export function applyReward(dispatch: DispatchFn, awarded: { gold?: number; gems?: number; reason?: string }) {
    dispatch({ type: "APPLY_REWARD", awarded });
}

export function mergeProfile(dispatch: DispatchFn, patch: Partial<GlobalUserProfile> & Record<string, unknown>) {
    dispatch({ type: "MERGE_PROFILE", patch });
}

// 통계 병합(숫자는 누적, 배열은 concat, 객체는 재귀 병합)
export function mergeGameStats(dispatch: DispatchFn, game: string, delta: Record<string, any>) {
    dispatch({ type: "MERGE_GAME_STATS", game, delta });
}

// 인벤토리 적용(append 기본, replace=true 시 교체)
export function applyPurchase(dispatch: DispatchFn, items: InventoryItem[], options?: { replace?: boolean }) {
    dispatch({ type: "APPLY_PURCHASE", items, replace: options?.replace });
}
