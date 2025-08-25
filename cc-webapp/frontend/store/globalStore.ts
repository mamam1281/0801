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

type GlobalState = {
    profile: GlobalUserProfile | null;
    hydrated: boolean;
    lastHydratedAt?: number;
};

type Actions =
    | { type: "SET_PROFILE"; profile: GlobalUserProfile | null }
    | { type: "SET_HYDRATED"; value: boolean }
    | { type: "PATCH_BALANCES"; delta: { gold?: number; gems?: number } };

const initialState: GlobalState = {
    profile: null,
    hydrated: false,
    lastHydratedAt: undefined,
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
