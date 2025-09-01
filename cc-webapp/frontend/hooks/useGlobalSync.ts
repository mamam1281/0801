/**
 * 전역 동기화 훅 - 모든 데이터를 중앙에서 관리
 * 백엔드의 권위 소스와 프론트엔드 상태를 동기화
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/unifiedApi';
import { hasAccessToken } from '@/lib/unifiedApi';
import { useGlobalStore } from '@/store/globalStore';

interface SyncOptions {
    showToast?: boolean;
    force?: boolean;
}

interface SyncResult {
    success: boolean;
    error?: string;
    timestamp: number;
}

// 권위 소스 엔드포인트 정의
const AUTHORITY_ENDPOINTS = {
    USER_PROFILE: 'auth/me',           // 사용자 전체 정보
    USER_BALANCE: 'users/balance',     // 잔액 권위
    GAME_STATS: 'games/stats/me'       // 게임 통계
} as const;

// 동기화 간격 (밀리초)
const SYNC_INTERVALS = {
    PROFILE: 60000,    // 1분
    BALANCE: 10000,    // 10초
    STATS: 30000,      // 30초
    FULL: 5000         // 전체 동기화 최소 간격
} as const;

export function useGlobalSync() {
    const { state, dispatch } = useGlobalStore();
    const [syncing, setSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState(null as SyncResult | null);

    // 마지막 동기화 시간 추적
    const lastSyncTimes = useRef({
        profile: 0,
        balance: 0,
        stats: 0,
        full: 0
    });

    // 동기화 잠금 (중복 호출 방지)
    const syncLock = useRef(false);

    /**
     * 프로필 데이터 동기화
     */
    const syncProfile = useCallback(async (): Promise<boolean> => {
        try {
            const response = await api.get(AUTHORITY_ENDPOINTS.USER_PROFILE);
            const profile = response.data || response;

            if (profile) {
                dispatch({
                    type: 'SET_PROFILE',
                    profile: {
                        id: profile.id || profile.user_id,
                        nickname: profile.nickname || profile.username,
                        goldBalance: profile.cyber_tokens || profile.gold_balance || 0,
                        level: profile.level || 1,
                        xp: profile.xp || 0,
                        vip_tier: profile.vip_tier,
                        battlepass_level: profile.battlepass_level
                    }
                });
                lastSyncTimes.current.profile = Date.now();
                return true;
            }
            return false;
        } catch (error) {
            console.error('[GlobalSync] Profile sync failed:', error);
            return false;
        }
    }, [dispatch]);

    /**
     * 잔액 데이터 동기화 (가장 중요!)
     */
    const syncBalance = useCallback(async (): Promise<boolean> => {
        try {
            const response = await api.get(AUTHORITY_ENDPOINTS.USER_BALANCE);
            const balanceData = response.data || response;

            if (balanceData) {
                const goldBalance = balanceData.cyber_token_balance ?? balanceData.gold ?? 0;

                // 현재 잔액과 비교
                const currentGold = state.profile?.goldBalance ?? 0;
                if (Math.abs(currentGold - goldBalance) > 0.01) {
                    console.log(`[GlobalSync] Balance updated: ${currentGold} → ${goldBalance}`);
                }

                dispatch({
                    type: 'SET_BALANCES',
                    balances: {
                        gold: goldBalance,
                        gems: balanceData.gems || 0
                    }
                });

                lastSyncTimes.current.balance = Date.now();
                return true;
            }
            return false;
        } catch (error) {
            console.error('[GlobalSync] Balance sync failed:', error);
            return false;
        }
    }, [dispatch, state.profile?.goldBalance]);

    /**
     * 게임 통계 동기화
     */
    const syncGameStats = useCallback(async (): Promise<boolean> => {
        try {
            const response = await api.get(AUTHORITY_ENDPOINTS.GAME_STATS);

            // 다양한 응답 포맷을 안전하게 stats 오브젝트로 변환
            const raw = (response as any)?.data ?? response;
            const statsRoot = (raw && typeof raw === 'object' && 'stats' in raw) ? (raw as any).stats : raw;

            const gameStats: Record<string, any> = {};

            // 1) 배열 형태 (예: { game_stats: [...] } 또는 바로 [...])
            const arr = Array.isArray((statsRoot as any)?.game_stats)
                ? (statsRoot as any).game_stats
                : (Array.isArray(statsRoot) ? (statsRoot as any) : null);

            if (arr) {
                for (const stat of arr as any[]) {
                    const key = (stat.game_type || stat.game || stat.id || '').toString().toLowerCase();
                    if (!key) continue;
                    // 셀렉터 호환을 위해 공통 별칭 키를 함께 채워줌
                    const plays = stat.total_hands ?? stat.play_count ?? stat.total_games ?? stat.plays ?? stat.spins ?? 0;
                    const wins = stat.wins ?? stat.total_wins ?? 0;
                    const games = stat.games ?? stat.total_games ?? plays ?? 0;
                    const entry = {
                        ...stat,
                        plays,
                        games,
                        wins,
                    };
                    // 슬롯의 경우 spins가 있으면 유지
                    if (typeof stat.spins === 'number') (entry as any).spins = stat.spins;
                    gameStats[key] = entry;
                }
            } else if (statsRoot && typeof statsRoot === 'object') {
                // 2) 객체 형태 (예: { slot: {...}, rps: {...}, ... })
                Object.entries(statsRoot as Record<string, any>).forEach(([k, v]) => {
                    if (!v || typeof v !== 'object') return;
                    const plays = (v as any).total_hands ?? (v as any).play_count ?? (v as any).total_games ?? (v as any).plays ?? (v as any).spins ?? 0;
                    const wins = (v as any).wins ?? (v as any).total_wins ?? 0;
                    const games = (v as any).games ?? (v as any).total_games ?? plays ?? 0;
                    gameStats[k] = { ...(v as any), plays, games, wins };
                });
            }

            if (Object.keys(gameStats).length > 0) {
                dispatch({ type: 'SET_GAME_STATS', gameStats });
                lastSyncTimes.current.stats = Date.now();
                return true;
            }
            return false;
        } catch (error: any) {
            // stats/me가 422 에러를 반환할 수 있음 (라우트 순서 문제)
            if (error?.response?.status === 422) {
                console.warn('[GlobalSync] Game stats endpoint issue, skipping');
                return true; // 에러지만 다른 동기화는 계속
            }
            console.error('[GlobalSync] Game stats sync failed:', error);
            return false;
        }
    }, [dispatch]);

    /**
     * 전체 데이터 동기화
     */
    const syncAll = useCallback(async (options: SyncOptions = {}): Promise<SyncResult> => {
        const { showToast = false, force = false } = options;

        // 중복 호출 방지
        if (syncLock.current && !force) {
            return {
                success: false,
                error: 'Sync already in progress',
                timestamp: Date.now()
            };
        }

        // 최소 간격 체크
        const now = Date.now();
        if (!force && (now - lastSyncTimes.current.full) < SYNC_INTERVALS.FULL) {
            return {
                success: true,
                error: 'Too soon to sync',
                timestamp: lastSyncTimes.current.full
            };
        }

        // 토큰이 없으면 로그인 전 단계 → 소음 방지를 위해 하이드레이트만 표시하고 종료
        if (!hasAccessToken() && !force) {
            dispatch({ type: 'SET_HYDRATED', value: true });
            const nowTs = Date.now();
            lastSyncTimes.current.full = nowTs;
            return { success: true, timestamp: nowTs };
        }

        syncLock.current = true;
        setSyncing(true);

        try {
            // 동기화 시작 로그
            console.log('[GlobalSync] Starting full sync...');

            // 병렬로 모든 데이터 동기화
            const results = await Promise.allSettled([
                syncProfile(),
                syncBalance(),
                syncGameStats()
            ]);

            const successes = results.filter(r => r.status === 'fulfilled' && r.value).length;
            const success = successes >= 2; // 최소 2개 이상 성공하면 OK

            lastSyncTimes.current.full = now;
            dispatch({ type: 'SET_HYDRATED', value: true });

            const result: SyncResult = {
                success,
                timestamp: now
            };

            if (showToast) {
                if (success) {
                    console.log('[GlobalSync] Sync completed successfully');
                } else {
                    console.warn('[GlobalSync] Some sync operations failed');
                }
            }

            setLastSyncResult(result);
            return result;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '동기화 실패';
            const result: SyncResult = {
                success: false,
                error: errorMessage,
                timestamp: now
            };

            if (showToast) {
                console.error(`[GlobalSync] Sync failed: ${errorMessage}`);
            }

            setLastSyncResult(result);
            return result;

        } finally {
            syncLock.current = false;
            setSyncing(false);
        }
    }, [syncProfile, syncBalance, syncGameStats, dispatch]);

    /**
     * 게임 후 동기화 (잔액과 통계만)
     */
    const syncAfterGame = useCallback(async (): Promise<SyncResult> => {
        setSyncing(true);

        try {
            // 잔액과 통계만 업데이트
            const [balanceOk, statsOk] = await Promise.all([
                syncBalance(),
                syncGameStats()
            ]);

            const success = balanceOk; // 잔액은 필수
            const result: SyncResult = {
                success,
                timestamp: Date.now()
            };

            setLastSyncResult(result);
            return result;

        } catch (error) {
            const result: SyncResult = {
                success: false,
                error: '게임 데이터 동기화 실패',
                timestamp: Date.now()
            };

            setLastSyncResult(result);
            return result;

        } finally {
            setSyncing(false);
        }
    }, [syncBalance, syncGameStats]);

    /**
     * 자동 동기화 설정
     */
    useEffect(() => {
        if (!state.hydrated && hasAccessToken()) {
            // 초기 로드 시 전체 동기화
            syncAll({ showToast: false });
        }

        // 주기적 잔액 동기화 (10초마다)
        const balanceInterval = setInterval(() => {
            if (state.hydrated && !syncLock.current && hasAccessToken()) {
                syncBalance();
            }
        }, SYNC_INTERVALS.BALANCE);

        // 주기적 통계 동기화 (30초마다)
        const statsInterval = setInterval(() => {
            if (state.hydrated && !syncLock.current && hasAccessToken()) {
                syncGameStats();
            }
        }, SYNC_INTERVALS.STATS);

        return () => {
            clearInterval(balanceInterval);
            clearInterval(statsInterval);
        };
    }, [state.hydrated, syncAll, syncBalance, syncGameStats]);

    /**
     * 수동 새로고침
     */
    const refresh = useCallback(() => {
        return syncAll({ showToast: true, force: true });
    }, [syncAll]);

    return {
        // 상태
        syncing,
        lastSyncResult,
        isHydrated: state.hydrated,

        // 동기화 함수
        syncAll,
        syncAfterGame,
        syncBalance,
        syncProfile,
        syncGameStats,
        refresh,

        // 타임스탬프
        lastSyncAt: lastSyncTimes.current.full,
        lastBalanceSyncAt: lastSyncTimes.current.balance
    };
}

/**
 * 게임 액션 후 자동 동기화를 위한 래퍼
 */
export function withGameSync<T extends (...args: any[]) => Promise<any>>(
    gameAction: T,
    syncHook: ReturnType<typeof useGlobalSync>
): T {
    return (async (...args: Parameters<T>) => {
        try {
            const result = await gameAction(...args);
            // 게임 액션 성공 후 자동 동기화
            await syncHook.syncAfterGame();
            return result;
        } catch (error) {
            throw error;
        }
    }) as T;
}
