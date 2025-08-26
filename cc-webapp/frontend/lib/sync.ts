/*
 * Sync utilities
 * - hydrateProfile: 서버 권위 프로필 로드
 * - EnsureHydrated: 최초 마운트 시 하이드레이트 트리거(렌더 차단 안함)
 * - RealtimeSyncProvider: WS 수신 → 프로필/상태 동기화 (필요 시 재하이드레이트)
 * - withReconcile: 쓰기 요청 후 재조정(hydrate)
 */
import React, { useEffect, useContext } from "react";
import { api, API_ORIGIN } from "../lib/unifiedApi";
import { setProfile, setHydrated, useGlobalStore, StoreContext } from "../store/globalStore";

export async function hydrateProfile(dispatch: any) {
  try {
    // 최초 진입 병렬 hydrate:
  // - /auth/me (필수)
    // - /users/balance (권위 잔액)
    // - /games/stats/me (통계 – 전역 저장은 아직 없으나, 워밍업/요건 충족용 호출)
    const [profileRes, balanceRes] = await Promise.all([
      api.get("auth/me"),
      api.get("users/balance").catch(() => null),
      // 통계는 실패/401 무시 (호출만 수행)
      api.get("games/stats/me").catch(() => null),
    ]);

    const data = profileRes as any;
    // balance 응답에서 가능한 키를 우선적으로 사용
    const balAny = balanceRes as any;
    const goldFromBalanceRaw = balAny?.gold ?? balAny?.gold_balance ?? balAny?.cyber_token_balance ?? balAny?.balance;
    const goldFromBalance = Number.isFinite(Number(goldFromBalanceRaw)) ? Number(goldFromBalanceRaw) : undefined;

    const mapped = {
      id: data?.id ?? data?.user_id ?? "unknown",
      nickname: data?.nickname ?? data?.name ?? "",
      goldBalance: goldFromBalance ?? Number(data?.gold ?? data?.gold_balance ?? 0),
      gemsBalance: Number(data?.gems ?? data?.gems_balance ?? 0),
      level: data?.level ?? data?.battlepass_level ?? undefined,
      xp: data?.xp ?? undefined,
      updatedAt: new Date().toISOString(),
      ...data,
    } as any;
    setProfile(dispatch, mapped);
  } catch (e) {
    // 401 등은 무시(로그인 전/토큰 만료 시점)
    // eslint-disable-next-line no-console
    console.warn("[sync] hydrateProfile 실패", e);
  } finally {
    setHydrated(dispatch, true);
  }
}

export function EnsureHydrated(props: { children?: React.ReactNode }) {
  const { dispatch } = useGlobalStore();
  useEffect(() => {
    // 최초 1회 하이드레이트 (토큰 없으면 실패하지만 harmless)
    try {
      if (dispatch) hydrateProfile(dispatch);
    } catch {
      // Provider may not be present during SSR; ignore.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
  return React.createElement(React.Fragment, null, props.children ?? null);
}

// 간단 WS 프로바이더 (프로필/구매/리워드 이벤트 수신)
export function RealtimeSyncProvider(props: { children?: React.ReactNode }) {
  const ctx = useContext(StoreContext);
  const dispatch = ctx?.dispatch;
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!dispatch) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let lastHydrate = 0;
    const minInterval = 600; // ms, 잦은 재하이드레이트 방지

    function toWs(origin: string) {
      return origin.replace(/^http/i, "ws");
    }

    function safeHydrate() {
      const now = Date.now();
      if (now - lastHydrate < minInterval) return;
      lastHydrate = now;
      hydrateProfile(dispatch);
    }

    try {
      const url = toWs(API_ORIGIN) + "/ws/updates";
      ws = new WebSocket(url);
      ws.onopen = () => {
        // eslint-disable-next-line no-console
        console.log("[sync] WS connected", url);
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const type = msg?.type;
          switch (type) {
              case "profile_update": {
                // profile_update may include target user id; if it targets current session,
                // call reconcileBalance for an explicit re-sync. Otherwise, run general hydrate.
                try {
                  const payload = msg?.data || msg?.payload || {};
                  const targetId = payload?.user_id ?? payload?.id ?? payload?.target_user_id;
                  // dynamic import to avoid circular import
                  import('../store/globalStore').then((m: any) => {
                    const state = (m as any).useGlobalStore ? undefined : undefined; // noop to satisfy bundler
                    // get current profile id via context import at runtime
                    import('../store/globalStore').then((storeMod: any) => {
                      try {
                        const ctx = storeMod.useGlobalStore();
                        const currentId = ctx?.state?.profile?.id;
                        if (targetId && String(targetId) === String(currentId) && typeof storeMod.reconcileBalance === 'function') {
                          storeMod.reconcileBalance(dispatch);
                        } else {
                          safeHydrate();
                        }
                      } catch (e) {
                        safeHydrate();
                      }
                    }).catch(() => safeHydrate());
                  }).catch(() => safeHydrate());
                } catch (e) {
                  safeHydrate();
                }
                break;
              }
              case "purchase_update":
              case "game_update":
                safeHydrate();
                break;
            case "reward_granted": {
              // try to apply awarded_gold immediately to reduce visual latency.
              try {
                const awarded = msg?.data || msg?.payload || msg?.award || {};
                const gold = Number(awarded?.awarded_gold ?? awarded?.gold ?? awarded?.amount ?? 0) || 0;
                const gems = Number(awarded?.awarded_gems ?? awarded?.gems ?? 0) || 0;
                // dynamic import to avoid circular dependency at module load
                import('../store/globalStore').then((m: any) => {
                  const applyReward = (m as any).applyReward;
                  if (typeof applyReward === 'function' && (gold !== 0 || gems !== 0)) {
                    applyReward(dispatch, { gold, gems, reason: awarded?.reason });
                  } else {
                    safeHydrate();
                  }
                }).catch(() => safeHydrate());
              } catch (e) {
                safeHydrate();
              }
              break;
            }
            default:
              break;
          }
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        if (closed) return;
        // eslint-disable-next-line no-console
        console.log("[sync] WS closed – retry soon");
        setTimeout(() => {
          if (!closed) {
            // 재연결
            hydrateProfile(dispatch);
          }
        }, 1500);
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[sync] WS init failed", e);
    }

    return () => {
      closed = true;
      try { ws?.close(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return React.createElement(React.Fragment, null, props.children ?? null);
}

// 간단 UUIDv4 (라이브러리 무의존)
function uuidv4() {
  // eslint-disable-next-line no-bitwise
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ReconcileOptions = { reconcile?: boolean };

export async function withReconcile<T>(
  dispatch: any,
  serverCall: (idemKey: string) => Promise<T>,
  options: ReconcileOptions = { reconcile: true }
): Promise<T> {
  const idemKey = uuidv4();
  const result = await serverCall(idemKey);
  if (options.reconcile !== false) {
    await hydrateProfile(dispatch);
  }
  return result;
}

export function useWithReconcile() {
  const ctx = useContext(StoreContext);
  const dispatch = ctx?.dispatch;
  return React.useMemo(() => {
    return async function run<T>(serverCall: (idemKey: string) => Promise<T>, opts?: ReconcileOptions) {
      if (!dispatch) throw new Error('No dispatch available in useWithReconcile');
      return withReconcile<T>(dispatch, serverCall, opts);
    };
  }, [dispatch]);
}
