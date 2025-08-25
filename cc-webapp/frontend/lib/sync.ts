/*
 * Sync utilities
 * - hydrateProfile: 서버 권위 프로필 로드
 * - EnsureHydrated: 최초 마운트 시 하이드레이트 트리거(렌더 차단 안함)
 * - RealtimeSyncProvider: WS 수신 → 프로필/상태 동기화 (필요 시 재하이드레이트)
 * - withReconcile: 쓰기 요청 후 재조정(hydrate)
 */
import React, { useEffect } from "react";
import { api, API_ORIGIN } from "../lib/unifiedApi";
import {
  useGlobalStore,
  setProfile,
  setHydrated,
} from "../store/globalStore";

export async function hydrateProfile(dispatch: ReturnType<typeof useGlobalStore>["dispatch"]) {
  try {
    const data = await api.get("users/profile");
    // 서버 스키마 → 전역 스키마 매핑은 최소 가정으로 통과
    const mapped = {
      id: data?.id ?? data?.user_id ?? "unknown",
      nickname: data?.nickname ?? data?.name ?? "",
      goldBalance: Number(data?.gold ?? data?.gold_balance ?? 0),
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
    hydrateProfile(dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return React.createElement(React.Fragment, null, props.children ?? null);
}

// 간단 WS 프로바이더 (프로필/구매/리워드 이벤트 수신)
export function RealtimeSyncProvider(props: { children?: React.ReactNode }) {
  const { dispatch } = useGlobalStore();
  useEffect(() => {
    if (typeof window === "undefined") return;
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
            case "profile_update":
            case "purchase_update":
            case "reward_granted":
            case "game_update":
              safeHydrate();
              break;
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
  dispatch: ReturnType<typeof useGlobalStore>["dispatch"],
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
  const { dispatch } = useGlobalStore();
  return React.useMemo(() => {
    return async function run<T>(serverCall: (idemKey: string) => Promise<T>, opts?: ReconcileOptions) {
      return withReconcile<T>(dispatch, serverCall, opts);
    };
  }, [dispatch]);
}
