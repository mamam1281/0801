/*
 * Global Store (Context + Reducer)
 * - 서버 권위 프로필/밸런스 상태 보관
 * - 최소 스키마만 우선 도입(추후 확장)
 */
"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import { api } from "@/lib/unifiedApi";

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
    // 권위 사용자/밸런스
    profile: GlobalUserProfile | null;
    balances?: { gold: number; gems?: number };
    // 준비 플래그
    hydrated: boolean;
    lastHydratedAt?: number;
    // 게임별 통계(키: 게임 식별자)
    gameStats?: Record<string, any>;
    // 인벤토리(가벼운 캐시; 서버와 불일치 시 서버값 우선)
    inventory?: InventoryItem[];
    // 스트릭/이벤트/알림(경량)
    streak?: Record<string, any>;
    events?: Record<string, any>;
    notifications?: Array<{ id: string; type: string; message: string; at: number }>;
    // 오류 상태(옵션)
    lastError?: { message: string; at: number } | null;
};

type Actions =
    | { type: "SET_PROFILE"; profile: GlobalUserProfile | null }
    | { type: "SET_HYDRATED"; value: boolean }
    | { type: "PATCH_BALANCES"; delta: { gold?: number; gems?: number } }
    | { type: "APPLY_REWARD"; award: { gold?: number; gems?: number } }
    | { type: "MERGE_PROFILE"; patch: Partial<GlobalUserProfile> & Record<string, unknown> }
    | { type: "MERGE_GAME_STATS"; game: string; delta: Record<string, any> }
    | { type: "SET_GAME_STATS"; gameStats: Record<string, any> }
    | { type: "APPLY_PURCHASE"; items: InventoryItem[]; replace?: boolean }
    | { type: "SET_ERROR"; error: { message: string; at: number } | null }
    | { type: "SET_BALANCES"; balances: { gold: number; gems?: number } }
    | { type: "SET_STREAK"; streak: Record<string, any> }
    | { type: "SET_EVENTS"; events: Record<string, any> }
    | { type: "PUSH_NOTIFICATION"; item: { id: string; type: string; message: string; at: number } };

const initialState: GlobalState = {
    profile: null,
    balances: { gold: 0, gems: 0 },
    hydrated: false,
    lastHydratedAt: undefined,
    gameStats: {},
    inventory: [],
    streak: {},
    events: {},
    notifications: [],
    lastError: null,
};

function reducer(state: GlobalState, action: Actions): GlobalState {
    switch (action.type) {
        case "SET_PROFILE":
            // Ensure level/xp normalized to numbers to avoid undefined usage in UI
            if (action.profile) {
                const lp = action.profile as GlobalUserProfile & any;
                const coercedLevel = lp.level !== undefined ? Number(lp.level) : (lp.battlepass_level !== undefined ? Number(lp.battlepass_level) : undefined);
                const coercedXP = lp.experience_points ?? lp.xp ?? lp.experience ?? undefined;
                action.profile = { ...action.profile, level: coercedLevel === undefined ? undefined : (Number.isFinite(coercedLevel) ? coercedLevel : undefined), xp: coercedXP === undefined ? undefined : Number(coercedXP) } as GlobalUserProfile;
            }
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
                balances: { gold: (state.balances?.gold ?? gold) + (action.delta.gold ?? 0), gems: (state.balances?.gems ?? gems) + (action.delta.gems ?? 0) },
            };
        }
        case "APPLY_REWARD": {
            if (!state.profile) return state;
            const gold = state.profile.goldBalance ?? 0;
            const gems = (state.profile as any).gemsBalance ?? 0;
            const addGold = Number(action.award.gold ?? 0);
            const addGems = Number(action.award.gems ?? 0);
            return {
                ...state,
                profile: {
                    ...state.profile,
                    goldBalance: gold + (Number.isFinite(addGold) ? addGold : 0),
                    gemsBalance: gems + (Number.isFinite(addGems) ? addGems : 0),
                } as GlobalUserProfile,
                balances: { gold: (state.balances?.gold ?? gold) + (Number.isFinite(addGold) ? addGold : 0), gems: (state.balances?.gems ?? gems) + (Number.isFinite(addGems) ? addGems : 0) },
            };
        }
        case "MERGE_PROFILE": {
            if (!state.profile) {
                // If profile isn't set yet, create one from patch minimally and normalize level/xp
                const base = { goldBalance: 0, nickname: "", id: "unknown", ...(action.patch as any) } as any;
                const levelVal = base.level ?? base.battlepass_level ?? undefined;
                base.level = levelVal !== undefined ? (Number.isFinite(Number(levelVal)) ? Number(levelVal) : undefined) : undefined;
                base.xp = base.experience_points ?? base.xp ?? base.experience ?? undefined;
                if (base.xp !== undefined) base.xp = Number(base.xp);
                return { ...state, profile: base };
            }
            const patched = { ...state.profile, ...(action.patch as any) } as any;
            // normalize level/xp
            const lvl = patched.level ?? patched.battlepass_level ?? undefined;
            patched.level = lvl !== undefined ? (Number.isFinite(Number(lvl)) ? Number(lvl) : undefined) : undefined;
            patched.xp = patched.experience_points ?? patched.xp ?? patched.experience ?? undefined;
            if (patched.xp !== undefined) patched.xp = Number(patched.xp);
            return { ...state, profile: patched as GlobalUserProfile };
        }
        case "MERGE_GAME_STATS": {
            const current = state.gameStats || {};
            const prev = (current[action.game] as any) || {};
            const delta = action.delta || {};

            const deepMergeNumericAdd = (a: any, b: any): any => {
                // Early null/undefined checks
                if (a === undefined || a === null) return b ?? {};
                if (b === undefined || b === null) return a ?? {};
                
                // Array handling
                if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
                
                // Number handling  
                if (typeof a === "number" && typeof b === "number") return a + b;
                
                // Object handling with comprehensive null checks
                if (typeof a === "object" && typeof b === "object" && 
                    a !== null && b !== null && 
                    !Array.isArray(a) && !Array.isArray(b) &&
                    Object.prototype.toString.call(a) === '[object Object]' &&
                    Object.prototype.toString.call(b) === '[object Object]') {
                    
                    const out: Record<string, any> = { ...a };
                    const keys = Object.keys(b);
                    for (const k of keys) {
                        out[k] = deepMergeNumericAdd((a as any)[k], (b as any)[k]);
                    }
                    return out;
                }
                
                // Default fallback - return b if not mergeable
                return b ?? a ?? {};
            };

            const mergedForGame = deepMergeNumericAdd(prev, delta);
            return { ...state, gameStats: { ...current, [action.game]: mergedForGame } };
        }
        case "SET_GAME_STATS": {
            // 서버에서 받은 권위 있는 통계로 전체 교체
            return { ...state, gameStats: action.gameStats || {} };
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
        case "SET_ERROR":
            return { ...state, lastError: action.error };
        case "SET_BALANCES":
            return { ...state, balances: { ...action.balances }, profile: state.profile ? { ...state.profile, goldBalance: action.balances.gold, gemsBalance: action.balances.gems } as GlobalUserProfile : state.profile };
        case "SET_STREAK":
            return { ...state, streak: { ...action.streak } };
        case "SET_EVENTS":
            return { ...state, events: { ...action.events } };
        case "PUSH_NOTIFICATION":
            return { ...state, notifications: [{ ...action.item }, ...(state.notifications || [])].slice(0, 50) };
        default:
            return state;
    }
}

type DispatchFn = (action: Actions) => void;
const StoreContext = createContext(null as unknown as { state: GlobalState; dispatch: DispatchFn } | null);

export function GlobalStoreProvider(props: { children?: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const value = useMemo(() => ({ state, dispatch }), [state]);
    return React.createElement((StoreContext as any).Provider, { value }, props.children as any);
}

export function useGlobalStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useGlobalStore must be used within GlobalStoreProvider");
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

export function applyReward(dispatch: DispatchFn, award: { gold?: number; gems?: number }) {
    dispatch({ type: "APPLY_REWARD", award });
}

export function mergeProfile(dispatch: DispatchFn, patch: Partial<GlobalUserProfile> & Record<string, unknown>) {
    dispatch({ type: "MERGE_PROFILE", patch });
}

// 통계 병합(숫자는 누적, 배열은 concat, 객체는 재귀 병합)
export function mergeGameStats(dispatch: DispatchFn, game: string, delta: Record<string, any>) {
    // Validate inputs to prevent null/undefined errors
    if (!dispatch || typeof dispatch !== 'function') {
        console.warn('[mergeGameStats] Invalid dispatch function');
        return;
    }
    if (!game || typeof game !== 'string') {
        console.warn('[mergeGameStats] Invalid game name:', game);
        return;
    }
    if (!delta || typeof delta !== 'object') {
        console.warn('[mergeGameStats] Invalid delta object:', delta);
        return;
    }
    
    dispatch({ type: "MERGE_GAME_STATS", game, delta });
}

// 인벤토리 적용(append 기본, replace=true 시 교체)
export function applyPurchase(dispatch: DispatchFn, items: InventoryItem[], options?: { replace?: boolean }) {
    dispatch({ type: "APPLY_PURCHASE", items, replace: options?.replace });
}

// 고수준 액션들(hydrate/reconcile)
export async function hydrateFromServer(dispatch: DispatchFn) {
    try {
        const [me, bal, stats] = await Promise.all([
            api.get("auth/me"),
            api.get("users/balance").catch(() => null),
            api.get("games/stats/me").catch(() => null),
        ]);
        const goldFromBalanceRaw = (bal as any)?.gold ?? (bal as any)?.gold_balance ?? (bal as any)?.cyber_token_balance ?? (bal as any)?.balance;
        const rawLevel = me?.level ?? me?.battlepass_level ?? undefined;
        const rawXp = me?.experience_points ?? me?.xp ?? me?.experience ?? undefined;
        const mapped = {
            id: me?.id ?? me?.user_id ?? "unknown",
            nickname: me?.nickname ?? me?.name ?? "",
            goldBalance: Number.isFinite(Number(goldFromBalanceRaw)) ? Number(goldFromBalanceRaw) : Number(me?.gold ?? me?.gold_balance ?? 0),
            gemsBalance: Number(me?.gems ?? me?.gems_balance ?? 0),
            level: rawLevel !== undefined ? (Number.isFinite(Number(rawLevel)) ? Number(rawLevel) : undefined) : undefined,
            xp: rawXp !== undefined ? Number(rawXp) : undefined,
            updatedAt: new Date().toISOString(),
            ...me,
        } as GlobalUserProfile as any;
        const balances = { gold: mapped.goldBalance ?? 0, gems: (mapped as any).gemsBalance ?? 0 };
        setProfile(dispatch, mapped);
        dispatch({ type: "SET_BALANCES", balances });
        if (stats && typeof stats === 'object') {
            try { dispatch({ type: "SET_GAME_STATS", gameStats: stats as any }); } catch { /* noop */ }
        }
    } catch (e:any) {
        dispatch({ type: "SET_ERROR", error: { message: e?.message || "hydrateFromServer failed", at: Date.now() } });
    } finally {
        setHydrated(dispatch, true);
    }
}

export async function reconcileBalance(dispatch: DispatchFn) {
    try {
        const bal = await api.get("users/balance");
        const gold = Number((bal as any)?.gold ?? (bal as any)?.gold_balance ?? (bal as any)?.cyber_token_balance ?? (bal as any)?.balance ?? 0);
        const gems = Number((bal as any)?.gems ?? (bal as any)?.gems_balance ?? 0);
        dispatch({ type: "SET_BALANCES", balances: { gold, gems } });
    } catch (e:any) {
        dispatch({ type: "SET_ERROR", error: { message: e?.message || "reconcileBalance failed", at: Date.now() } });
    }
}

export function getLastError(state: GlobalState) { return state.lastError; }
