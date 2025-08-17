import { useCallback, useEffect, useRef, useState } from 'react';
import { useApiClient } from './game/useApiClient';

interface AuthUser {
    id: number;
    site_id: string;
    nickname: string;
    cyber_token_balance: number;
    vip_tier?: string;
    created_at?: string;
}

interface SignupPayload {
    site_id: string;
    nickname: string;
    phone_number: string;
    password: string;
    invite_code: string;
}

interface Tokens { access_token: string; token_type: string; expires_in?: number | null }

interface SignupResponse { user: AuthUser; tokens: Tokens; initial_balance: number; invite_code_used: string }

const ACCESS_KEY = 'cc_access_token';
const EXP_KEY = 'cc_access_exp';

function storeToken(token: string, expSeconds?: number) {
    localStorage.setItem(ACCESS_KEY, token);
    if (expSeconds) {
        const abs = Date.now() + expSeconds * 1000;
        localStorage.setItem(EXP_KEY, abs.toString());
    } else {
        localStorage.removeItem(EXP_KEY);
    }
}

function readToken(): { token: string | null; exp: number | null } {
    const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
    const expStr = typeof window !== 'undefined' ? localStorage.getItem(EXP_KEY) : null;
    return { token, exp: expStr ? parseInt(expStr, 10) : null };
}

export function useAuth() {
    const api = useApiClient();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(false);
    const refreshTimer = useRef<number | null>(null);

    const scheduleRefresh = useCallback((exp: number | null) => {
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        if (!exp) return; // no exp claim present
        const now = Date.now();
        const msLeft = exp - now;
        // refresh 60s 전에 시도
        const refreshIn = Math.max(msLeft - 60_000, 10_000);
        refreshTimer.current = window.setTimeout(() => {
            void refresh();
        }, refreshIn);
    }, []);

    const applyTokens = useCallback((t: Tokens) => {
        // access_token만 존재. exp는 JWT 자체에서 파싱
        storeToken(t.access_token, t.expires_in || undefined);
        try {
            const payload = JSON.parse(atob(t.access_token.split('.')[1]));
            if (payload.exp) scheduleRefresh(payload.exp * 1000);
        } catch { }
    }, [scheduleRefresh]);

    const signup = useCallback(async (data: SignupPayload) => {
        setLoading(true);
        try {
            const res = await api.call('/api/auth/signup', { method: 'POST', body: data }) as SignupResponse;
            applyTokens(res.tokens);
            setUser(res.user);
            return res.user;
        } finally {
            setLoading(false);
        }
    }, [api, applyTokens]);

    const login = useCallback(async (site_id: string, password: string) => {
        setLoading(true);
        try {
            const res = await api.call('/api/auth/login', { method: 'POST', body: { site_id, password } }) as Tokens;
            applyTokens(res);
            // profile fetch
            const profile = await api.call('/api/auth/profile') as AuthUser;
            setUser(profile);
            return profile;
        } finally { setLoading(false); }
    }, [api, applyTokens]);

    const refresh = useCallback(async () => {
        const { token } = readToken();
        if (!token) return null;
        try {
            const res = await api.call('/api/auth/refresh', { method: 'POST', body: {} }) as Tokens;
            applyTokens(res);
            return res;
        } catch {
            logout();
            return null;
        }
    }, [api, applyTokens]);

    const logout = useCallback(() => {
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(EXP_KEY);
        setUser(null);
    }, []);

    // init load
    useEffect(() => {
        const { token } = readToken();
        if (token) {
            api.call('/api/auth/profile').then((u: any) => setUser(u as AuthUser)).catch(() => logout());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { user, loading, signup, login, refresh, logout };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
