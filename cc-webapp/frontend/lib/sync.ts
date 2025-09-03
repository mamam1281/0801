/*
 * Sync utilities
 * - hydrateProfile: 서버 권위 프로필 로드
 * - EnsureHydrated: 최초 마운트 시 하이드레이트 트리거(렌더 차단 안함)
 * - RealtimeSyncProvider: WS 수신 → 프로필/상태 동기화 (필요 시 재하이드레이트)
 * - withReconcile: 쓰기 요청 후 재조정(hydrate)
 */
"use client";
import React, { useEffect } from "react";
import { api, API_ORIGIN, hasAccessToken } from "../lib/unifiedApi";
import { useGlobalStore, setProfile, setHydrated, applyReward } from "../store/globalStore";

// hydrate profile + balances + stats
export async function hydrateProfile(dispatch: any) {
  try {
    // 로그인 전에는 호출을 생략해 401/403 콘솔 소음을 방지
    if (!hasAccessToken()) {
      return;
    }
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

    if (profileRes) dispatch({ type: 'SET_USER', user: profileRes })
    if (balanceRes) dispatch({ type: 'SET_BALANCES', balances: balanceRes })
    if (statsRes) dispatch({ type: 'MERGE_GAME_STATS', stats: statsRes })
  } catch (e) {
    // ignore
    // console.warn('[sync] hydrateProfile failed', e)
  }
}

export function EnsureHydrated(props: { children?: React.ReactNode }) {
  const { state, dispatch } = useGlobalStore()
  useEffect(() => {
    if (state.ready) return
    hydrateProfile(dispatch).finally(() => {
      dispatch({ type: 'SET_READY', ready: true })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <>{ props.children ?? null } </>
}

function toWs(origin: string) {
  return origin.replace(/^http/i, 'ws')
}

export function RealtimeSyncProvider(props: { children?: React.ReactNode }) {
  const ctx = useContext((React as any).createContext ? undefined : undefined) // noop for typing clarity
  const { state, dispatch } = useGlobalStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    let ws: WebSocket | null = null
    let closed = false

    const url = `${toWs(API_ORIGIN)}/ws/updates`
    try {
      ws = new WebSocket(url)
      ws.onopen = () => console.log('[sync] WS connected', url)
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          const type = msg?.type
          const payload = msg?.data || msg?.payload || {}
          const targetId = payload?.user_id ?? payload?.id ?? payload?.target_user_id

          switch (type) {
            case "profile_update":
            case "purchase_update":
            case "reward_granted": {
              // 빠른 체감: 보상 즉시 적용 후 재하이드레이트로 정합화
              try {
                const data = msg?.data || {};
                const reward = data?.reward_data || data || {};
                const gold = Number(reward?.awarded_gold ?? reward?.gold ?? reward?.amount ?? 0);
                if (Number.isFinite(gold) && gold !== 0) {
                  applyReward(dispatch, { gold });
                }
              } catch { /* noop */ }

              // 유형별 토스트 발행 (ToastProvider가 중복 1.5s 억제)
              try {
                if (typeof window !== "undefined") {
                  if (type === "reward_granted") {
                    const g = (() => {
                      try {
                        const d = msg?.data?.reward_data ?? msg?.data ?? {};
                        const val = Number(d?.awarded_gold ?? d?.gold ?? d?.amount ?? 0);
                        return Number.isFinite(val) ? val : 0;
                      } catch { return 0; }
                    })();
                    const text = g !== 0 ? `보상 지급: ${g > 0 ? "+" : ""}${g}G` : "보상 지급";
                    window.dispatchEvent(new CustomEvent("app:notification", { detail: { type: "reward", payload: text } }));
                  } else if (type === "purchase_update") {
                    const st = (msg?.data?.status || "pending").toString();
                    const product = msg?.data?.product_id ? `상품 ${msg?.data?.product_id}` : "구매";
                    let t = "shop"; let text = `${product} 결제가 진행 중입니다...`;
                    if (st === "success") { t = "success"; text = `${product} 결제가 완료되었습니다.`; }
                    else if (st === "failed") { t = "error"; text = `${product} 결제가 실패했습니다.`; }
                    else if (st === "idempotent_reuse") { t = "system"; text = `${product} 결제가 이미 처리되었습니다.`; }
                    window.dispatchEvent(new CustomEvent("app:notification", { detail: { type: t, payload: text } }));
                  } else if (type === "profile_update") {
                    window.dispatchEvent(new CustomEvent("app:notification", { detail: { type: "system", payload: "프로필이 갱신되었습니다." } }));
                  }
                }
              } catch { /* noop */ }
              safeHydrate();
              break;
            }
            case "game_update":
              safeHydrate();
              break;
            case "catalog_updated":
            case "package_upserted":
              try {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("cc:catalog.invalidate"));
                }
              } catch { /* noop */ }
              break;
            default:
              break
          }
        } catch (e) { /* ignore */ }
      }
      ws.onclose = () => { if (!closed) { setTimeout(() => { if (!closed) hydrateProfile(dispatch) }, 1500) } }
      ws.onerror = () => { ws?.close() }
    } catch (e) {
      console.warn('[sync] WS init failed', e)
    }

    return () => { closed = true; try { ws?.close() } catch { } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.id])

  return <>{ props.children ?? null } </>
}

// uuid helper
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16)
  })
}

type ReconcileOptions = { reconcile?: boolean };

export async function withReconcile<T>(
  dispatch: ReturnType<typeof useGlobalStore>["dispatch"],
  serverCall: (idemKey: string) => Promise<T>,
  options: ReconcileOptions = { reconcile: true }
): Promise<T> {
  const idemKey = uuidv4();
  let caught: any = null;
  let result!: T;
  try {
    result = await serverCall(idemKey);
    return result;
  } catch (e:any) {
    caught = e;
    throw e;
  } finally {
    if (options.reconcile !== false) {
      await hydrateProfile(dispatch);
    }
  }
}

export function useWithReconcile() {
  const { dispatch } = useGlobalStore()
  return (serverCall: (idemKey: string) => Promise<any>, opts?: any) => {
    if (!dispatch) throw new Error('useWithReconcile requires GlobalStoreProvider')
    return withReconcile(dispatch, serverCall, opts)
  }
}

// 멱등키 부여 유틸: 서버콜에 헤더/본문 중 하나로 키를 전달할 때 사용
export async function withIdem<T>(
  fn: (idemKey: string) => Promise<T>,
  explicitKey?: string
): Promise<T> {
  const key = explicitKey || uuidv4();
  return fn(key);
}
