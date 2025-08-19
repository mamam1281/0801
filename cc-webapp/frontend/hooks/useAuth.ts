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

// Backend may also supply refresh_token (optional) – include for future refresh support
interface Tokens { access_token: string; token_type: string; expires_in?: number | null; refresh_token?: string | null }

// Backend actually returns flat structure: { access_token, token_type, user, refresh_token }
interface SignupResponse extends Tokens { user: AuthUser }

// Canonical combined storage key used elsewhere (tokenStorage.js / useAuthToken.ts)
const LEGACY_ACCESS_KEY = 'cc_access_token'; // retained for backward compat (will deprecate)
const LEGACY_EXP_KEY = 'cc_access_exp';
const BUNDLE_KEY = 'cc_auth_tokens';

import { setTokens } from '../utils/tokenStorage';
function writeBundle(access: string, refresh?: string | null, expSeconds?: number | null | undefined) {
    // Unified bundle structure consumed by existing tokenStorage.js & useAuthToken.ts
    const bundle: Record<string, any> = { access_token: access };
    if (refresh) bundle.refresh_token = refresh;
    setTokens(bundle); // tokenStorage.js와 완전 통일
    // Maintain legacy separate keys to avoid breaking older code paths still reading them
    try {
        localStorage.setItem(LEGACY_ACCESS_KEY, access);
        if (expSeconds) {
            const abs = Date.now() + expSeconds * 1000;
            localStorage.setItem(LEGACY_EXP_KEY, abs.toString());
        } else {
            localStorage.removeItem(LEGACY_EXP_KEY);
        }
    } catch {}
}

function readLegacyToken(): { token: string | null; exp: number | null } {
    const token = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_ACCESS_KEY) : null;
    const expStr = typeof window !== 'undefined' ? localStorage.getItem(LEGACY_EXP_KEY) : null;
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
        // Persist in unified bundle + legacy keys
        writeBundle(t.access_token, t.refresh_token, t.expires_in);
        try {
            const payload = JSON.parse(atob(t.access_token.split('.')[1]));
            if (payload.exp) scheduleRefresh(payload.exp * 1000);
        } catch { /* silent */ }
    }, [scheduleRefresh]);

    const signup = useCallback(async (data: SignupPayload) => {
        setLoading(true);
        try {
            const res = await api.call('/api/auth/signup', { method: 'POST', body: data }) as SignupResponse;
            // Backend returns flat structure: { access_token, token_type, user, refresh_token }
            applyTokens(res);
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

    // logout 먼저 선언 필요 (refresh 훅 의존 순서 문제 회피)
    const logout = useCallback(() => {
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        try {
            localStorage.removeItem(LEGACY_ACCESS_KEY);
            localStorage.removeItem(LEGACY_EXP_KEY);
            localStorage.removeItem(BUNDLE_KEY);
        } catch {}
        setUser(null);
    }, []);

    const refresh = useCallback(async () => {
        let bundle: any = undefined;
        if (typeof window !== 'undefined') {
            try { bundle = JSON.parse(localStorage.getItem(BUNDLE_KEY) || 'null'); } catch { /* ignore */ }
        }
        const refreshToken: string | undefined = bundle?.refresh_token || undefined;
        const { token } = readLegacyToken();
        if (!token) return null;
        if (!refreshToken) return null;
        try {
            const res = await api.call('/api/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } }) as Tokens;
            applyTokens(res);
            return res;
        } catch {
            logout();
            return null;
        }
    }, [api, applyTokens, logout]);

    // 위로 이동 (중복 선언 방지) 

    // init load
    useEffect(() => {
    const { token } = readLegacyToken();
    if (token) {
            api.call('/api/auth/profile').then((u: any) => setUser(u as AuthUser)).catch(() => logout());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { user, loading, signup, login, refresh, logout };
}

export type UseAuthReturn = ReturnType<typeof useAuth>;
