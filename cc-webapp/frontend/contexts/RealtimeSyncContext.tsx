'use client';

import React, { useContext, useEffect, useReducer, useCallback, useRef, createContext } from 'react';
import { API_ORIGIN } from '../lib/unifiedApi';
import { WSClient, createWSClient, WebSocketMessage, SyncEventData } from '../utils/wsClient';
import { useAuth } from '../hooks/useAuth';
import { useAuthToken } from '../hooks/useAuthToken';
import { globalFallbackPoller, createSyncPollingTasks } from '../utils/fallbackPolling';
import { useToast } from '@/components/NotificationToast';

/**
 * 실시간 동기화 전역 상태 정의
 */
export interface RealtimeSyncState {
  // 사용자 프로필 데이터
  profile: {
    gold: number;
    exp: number;
    tier: string;
    total_spent: number;
    last_updated?: string;
  };

  // 업적 진행도
  achievements: Record<
    number,
    {
      id: number;
      progress: number;
      unlocked: boolean;
      type?: string;
      last_updated?: string;
    }
  >;

  // 스트릭 상태
  streaks: Record<
    string,
    {
      action_type: string;
      current_count: number;
      last_action_date: string;
      last_updated?: string;
    }
  >;

  // 이벤트 진행도
  events: Record<
    number,
    {
      id: number;
      progress: Record<string, any>;
      completed: boolean;
      last_updated?: string;
    }
  >;

  // 게임 통계
  stats: Record<
    string,
    {
      game_type: string;
      data: Record<string, any>;
      last_updated?: string;
    }
  >;

  // 최근 보상 내역 (UI 알림용)
  recent_rewards: Array<{
    id: string;
    reward_type: string;
    reward_data: Record<string, any>;
    source: string;
    timestamp: string;
  }>;

  // 결제 진행 상태 (배지/알림용 경량 상태)
  purchase: {
    pending_count: number; // 진행중 결제 건수(추정)
    last_status?: 'pending' | 'success' | 'failed' | 'idempotent_reuse';
    last_product_id?: string;
    last_receipt?: string;
    last_updated?: string;
  };

  // 최근 구매 히스토리(WS 기반 경량 로그, 최대 20개)
  recent_purchases: Array<{
    id: string; // receipt_code 또는 합성 키
    status: 'pending' | 'success' | 'failed' | 'idempotent_reuse';
    product_id?: string;
    amount?: number;
    receipt_code?: string;
    timestamp: string; // 수신 시각
  }>;

  // WebSocket 연결 상태
  connection: {
    status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
    last_connected?: string;
    reconnect_attempts: number;
  };

  // 마지막 폴백 폴링 시간
  last_poll_time?: string;
}

/**
 * 상태 업데이트 액션 타입
 */
type SyncAction =
  | {
      type: 'SET_CONNECTION_STATUS';
      payload: { status: RealtimeSyncState['connection']['status']; attempts?: number };
    }
  | { type: 'UPDATE_PROFILE'; payload: SyncEventData['profile_update'] }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: SyncEventData['achievement_progress'] }
  | { type: 'UPDATE_STREAK'; payload: SyncEventData['streak_update'] }
  | { type: 'UPDATE_EVENT'; payload: SyncEventData['event_progress'] }
  | { type: 'UPDATE_STATS'; payload: SyncEventData['stats_update'] }
  | { type: 'ADD_REWARD'; payload: SyncEventData['reward_granted'] }
  | { type: 'CLEAR_OLD_REWARDS' }
  | { type: 'SET_LAST_POLL_TIME'; payload: string }
  | { type: 'INITIALIZE_STATE'; payload: Partial<RealtimeSyncState> }
  | { type: 'UPDATE_PURCHASE'; payload: SyncEventData['purchase_update'] };

/**
 * 초기 상태
 */
const initialState: RealtimeSyncState = {
  profile: {
    gold: 0,
    exp: 0,
    tier: 'STANDARD',
    total_spent: 0,
  },
  achievements: {},
  streaks: {},
  events: {},
  stats: {},
  recent_rewards: [],
  purchase: {
    pending_count: 0,
  },
  recent_purchases: [],
  connection: {
    status: 'disconnected',
    reconnect_attempts: 0,
  },
};

/**
 * 상태 리듀서
 */
function syncStateReducer(state: RealtimeSyncState, action: SyncAction): RealtimeSyncState {
  const timestamp = new Date().toISOString();

  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connection: {
          ...state.connection,
          status: action.payload.status,
          reconnect_attempts: action.payload.attempts ?? state.connection.reconnect_attempts,
          last_connected:
            action.payload.status === 'connected' ? timestamp : state.connection.last_connected,
        },
      };

    case 'UPDATE_PROFILE':
      if (!action.payload) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          ...(action.payload.gold !== undefined && { gold: action.payload.gold }),
          ...(action.payload.exp !== undefined && { exp: action.payload.exp }),
          ...(action.payload.tier !== undefined && { tier: action.payload.tier }),
          ...(action.payload.total_spent !== undefined && {
            total_spent: action.payload.total_spent,
          }),
          last_updated: timestamp,
        },
      };

    case 'UPDATE_ACHIEVEMENT':
      if (!action.payload) return state;
      return {
        ...state,
        achievements: {
          ...state.achievements,
          [action.payload.achievement_id]: {
            id: action.payload.achievement_id,
            progress: action.payload.progress,
            unlocked: action.payload.unlocked,
            type: action.payload.achievement_type,
            last_updated: timestamp,
          },
        },
      };

    case 'UPDATE_STREAK':
      if (!action.payload) return state;
      return {
        ...state,
        streaks: {
          ...state.streaks,
          [action.payload.action_type]: {
            action_type: action.payload.action_type,
            current_count: action.payload.current_count,
            last_action_date: action.payload.last_action_date,
            last_updated: timestamp,
          },
        },
      };

    case 'UPDATE_EVENT':
      if (!action.payload) return state;
      return {
        ...state,
        events: {
          ...state.events,
          [action.payload.event_id]: {
            id: action.payload.event_id,
            progress: action.payload.progress,
            completed: action.payload.completed,
            last_updated: timestamp,
          },
        },
      };

    case 'UPDATE_STATS':
      if (!action.payload?.game_type) return state;
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload.game_type]: {
            game_type: action.payload.game_type,
            data: action.payload.stats,
            last_updated: timestamp,
          },
        },
      };

    case 'ADD_REWARD':
      if (!action.payload) return state;
      const rewardId = `${action.payload.reward_type}-${timestamp}`;
      return {
        ...state,
        recent_rewards: [
          {
            id: rewardId,
            reward_type: action.payload.reward_type,
            reward_data: action.payload.reward_data,
            source: action.payload.source,
            timestamp,
          },
          ...state.recent_rewards.slice(0, 9), // 최대 10개 유지
        ],
      };

    case 'UPDATE_PURCHASE': {
      const p = action.payload;
      if (!p) return state;
      // pending 증가/감소 로직 (최소 0 유지)
      let pending = state.purchase.pending_count;
      if (p.status === 'pending') pending += 1;
      if (p.status === 'success' || p.status === 'failed' || p.status === 'idempotent_reuse') {
        pending = Math.max(0, pending - 1);
      }
      // 히스토리 업데이트(최근 20개 유지, receipt_code 기준 업데이트)
      const key = p.receipt_code || `${p.user_id || 'me'}:${p.product_id || ''}`;
      const history = [...state.recent_purchases];
      const idx = history.findIndex((h) => h.id === key);
      const entry = {
        id: key,
        status: p.status,
        product_id: p.product_id,
        amount: typeof p.amount === 'number' ? p.amount : undefined,
        receipt_code: p.receipt_code,
        timestamp,
      } as const;
      if (idx >= 0) {
        history[idx] = { ...history[idx], ...entry, timestamp };
      } else {
        history.unshift(entry);
      }
      const trimmed = history.slice(0, 20);
      return {
        ...state,
        purchase: {
          pending_count: pending,
          last_status: p.status,
          last_product_id: p.product_id,
          last_receipt: p.receipt_code,
          last_updated: timestamp,
        },
        recent_purchases: trimmed,
      };
    }

    case 'CLEAR_OLD_REWARDS':
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      return {
        ...state,
        recent_rewards: state.recent_rewards.filter((reward) => reward.timestamp > oneHourAgo),
      };

    case 'SET_LAST_POLL_TIME':
      return {
        ...state,
        last_poll_time: action.payload,
      };

    case 'INITIALIZE_STATE':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}

/**
 * Context 인터페이스
 */
interface RealtimeSyncContextType {
  state: RealtimeSyncState;

  // WebSocket 연결 관리
  connect: () => Promise<void>;
  disconnect: () => void;

  // 수동 데이터 새로고침
  refreshProfile: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
  refreshStreaks: () => Promise<void>;
  refreshEvents: () => Promise<void>;

  // 최근 보상 관리
  clearOldRewards: () => void;

  // 폴백 폴링 트리거
  triggerFallbackPoll: () => Promise<void>;
}

/**
 * Context 생성
 */
// NOTE: createContext 제네릭 사용 시 빌드 환경 문제로 타입 인식 오류가 발생하므로
// 초기값 any 후 hook 내부에서 런타임 검증 & 캐스팅
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RealtimeSyncContext = createContext(null as any);

/**
 * Provider Props
 */
interface RealtimeSyncProviderProps {
  children?: React.ReactNode;
  apiBaseUrl?: string;
}

/**
 * Provider 컴포넌트
 */
export function RealtimeSyncProvider({ children, apiBaseUrl }: RealtimeSyncProviderProps) {
  const [state, dispatch] = useReducer(syncStateReducer, initialState);
  const { user } = useAuth();
  const { getAccessToken, getValidAccessToken } = useAuthToken();
  const wsClientRef = useRef(null as WSClient | null);
  const fallbackPollingActive = useRef(false);
  const { push } = useToast();
  const lastPurchaseByReceiptRef = useRef(new Map<string, { status: string; at: number }>());

  // Prefer the same origin resolution as unifiedApi to avoid cross-origin/SSR mismatches
  const baseUrl = apiBaseUrl || API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');

  // WebSocket 메시지 핸들러
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('[RealtimeSync] Received message:', message.type, message.data);

    switch (message.type) {
      case 'profile_update':
        dispatch({ type: 'UPDATE_PROFILE', payload: message.data });
        break;

      case 'purchase_update': {
        const data = message.data as SyncEventData['purchase_update'];
        // 사용자 토스트 알림
        const status = data?.status ?? 'pending';
        const product = data?.product_id ? `상품 ${data.product_id}` : '구매';
        let type: string = 'shop';
        let text: string = '';
        // 중복/전이 억제: 동일 receipt_code 기준 1.5초 내 동일 상태 무시, pending→final 병합
        const key = data?.receipt_code || `${data?.user_id || 'me'}:${data?.product_id || ''}`;
        const now = Date.now();
        const last = key ? lastPurchaseByReceiptRef.current.get(key) : undefined;
        if (last && last.status === status && now - last.at < 1500) {
          break; // 동일 상태 단시간 재수신 무시
        }
        // pending 이후 최종 상태 도달 시 최종 상태만 노출
        if (last && last.status === 'pending' && (status === 'success' || status === 'failed')) {
          // 계속 진행 (pending 토스트는 생략하고 최종만 표시)
        }
        lastPurchaseByReceiptRef.current.set(key, { status, at: now });

        if (status === 'success') {
          type = 'success';
          text = `${product} 결제가 완료되었습니다${data?.amount ? ` (금액: ${data.amount})` : ''}.`;
        } else if (status === 'failed') {
          type = 'error';
          text = `${product} 결제가 실패했습니다${data?.reason_code ? ` (${data.reason_code})` : ''}.`;
        } else if (status === 'idempotent_reuse') {
          type = 'system';
          text = `${product} 결제가 이미 처리되었습니다.`;
        } else {
          type = 'shop';
          text = `${product} 결제가 진행 중입니다...`;
        }
        try { push(text, type); } catch {}
  // 전역 상태 업데이트(배지/요약용)
  dispatch({ type: 'UPDATE_PURCHASE', payload: data });
        break;
      }

      case 'achievement_progress':
        dispatch({ type: 'UPDATE_ACHIEVEMENT', payload: message.data });
        break;

      case 'streak_update':
        dispatch({ type: 'UPDATE_STREAK', payload: message.data });
        break;

      case 'event_progress':
        dispatch({ type: 'UPDATE_EVENT', payload: message.data });
        break;

      case 'reward_granted':
        dispatch({ type: 'ADD_REWARD', payload: message.data });
        break;

      case 'stats_update':
        dispatch({ type: 'UPDATE_STATS', payload: message.data });
        break;

      case 'pong':
        // 하트비트 응답 - 특별한 처리 불요
        break;

      default:
        console.warn('[RealtimeSync] Unknown message type:', message.type);
    }
  }, [push]);

  // WebSocket 연결
  const connect = useCallback(async () => {
  const token = getAccessToken() || (await getValidAccessToken());
    if (!token || !user) {
      console.log('[RealtimeSync] Cannot connect - no token or user');
      return;
    }

    if (wsClientRef.current?.isConnected()) {
      console.log('[RealtimeSync] Already connected');
      return;
    }

    dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'connecting' } });

    try {
      const wsClient = createWSClient({
        url: `${baseUrl}/api/realtime/sync`,
        token,
        onConnect: () => {
          console.log('[RealtimeSync] WebSocket connected');
          dispatch({
            type: 'SET_CONNECTION_STATUS',
            payload: { status: 'connected', attempts: 0 },
          });

          // WebSocket 연결 성공 시 폴백 폴링 중지
          stopFallbackPolling();
        },
        onDisconnect: () => {
          console.log('[RealtimeSync] WebSocket disconnected');
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'disconnected' } });

          // WebSocket 연결 해제 시 폴백 폴링 시작
          if (user && !fallbackPollingActive.current) {
            startFallbackPolling();
          }
        },
        onMessage: handleWebSocketMessage,
        onError: (error) => {
          console.error('[RealtimeSync] WebSocket error:', error);
        },
        onReconnecting: (attempt) => {
          console.log('[RealtimeSync] Reconnecting...', attempt);
          dispatch({
            type: 'SET_CONNECTION_STATUS',
            payload: { status: 'reconnecting', attempts: attempt },
          });
        },
      });

      wsClientRef.current = wsClient;
      await wsClient.connect();
    } catch (error) {
      console.error('[RealtimeSync] Connection failed:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'disconnected' } });
    }
  }, [getAccessToken, user, baseUrl, handleWebSocketMessage]);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'disconnected', attempts: 0 } });
  }, []);

  // API 호출 헬퍼
  const apiCall = useCallback(
    async (endpoint: string) => {
      const token = await getValidAccessToken();
      if (!token) throw new Error('No token available');

      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    },
    [getValidAccessToken, baseUrl]
  );

  // 수동 데이터 새로고침 함수들
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiCall('/api/auth/me');
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: {
          user_id: profile.id,
          gold: profile.gold,
          exp: profile.exp,
          tier: profile.tier,
          total_spent: profile.total_spent,
        },
      });
    } catch (error) {
      console.error('[RealtimeSync] Failed to refresh profile:', error);
    }
  }, [apiCall]);

  const refreshAchievements = useCallback(async () => {
    try {
      // TODO: 업적 API 엔드포인트가 구현되면 연결
      console.log('[RealtimeSync] Achievement refresh - TODO');
    } catch (error) {
      console.error('[RealtimeSync] Failed to refresh achievements:', error);
    }
  }, [apiCall]);

  const refreshStreaks = useCallback(async () => {
    try {
      const streakData = await apiCall('/api/streak/status');
      dispatch({
        type: 'UPDATE_STREAK',
        payload: {
          user_id: user?.id || 0,
          action_type: streakData.action_type || 'SLOT_SPIN',
          current_count: streakData.current_count,
          last_action_date: streakData.last_action_date,
        },
      });
    } catch (error) {
      console.error('[RealtimeSync] Failed to refresh streaks:', error);
    }
  }, [apiCall, user]);

  const refreshEvents = useCallback(async () => {
    try {
      const events = await apiCall('/api/events/active');
      // TODO: 이벤트 상태 업데이트 로직
      console.log('[RealtimeSync] Events refresh - TODO:', events);
    } catch (error) {
      console.error('[RealtimeSync] Failed to refresh events:', error);
    }
  }, [apiCall]);

  // 최근 보상 정리
  const clearOldRewards = useCallback(() => {
    dispatch({ type: 'CLEAR_OLD_REWARDS' });
  }, []);

  // 폴백 폴링 (WebSocket 연결 실패시)
  const triggerFallbackPoll = useCallback(async () => {
    console.log('[RealtimeSync] Triggering fallback polling...');

    try {
      await Promise.allSettled([refreshProfile(), refreshStreaks(), refreshEvents()]);

      dispatch({ type: 'SET_LAST_POLL_TIME', payload: new Date().toISOString() });
    } catch (error) {
      console.error('[RealtimeSync] Fallback polling failed:', error);
    }
  }, [refreshProfile, refreshStreaks, refreshEvents]);

  // 폴백 폴링 시작
  const startFallbackPolling = useCallback(() => {
    if (fallbackPollingActive.current) {
      console.log('[RealtimeSync] Fallback polling already active');
      return;
    }

    console.log('[RealtimeSync] Starting fallback polling');
    fallbackPollingActive.current = true;

    const pollingTasks = createSyncPollingTasks(refreshProfile, refreshStreaks, refreshEvents, {
      onError: (error, retryCount) => {
        console.warn(`[RealtimeSync] Polling task failed (retry ${retryCount}):`, error);
      },
      onSuccess: () => {
        dispatch({ type: 'SET_LAST_POLL_TIME', payload: new Date().toISOString() });
      },
      onMaxRetriesReached: () => {
        console.error('[RealtimeSync] Polling task reached max retries, stopping');
      },
    });

    // 폴링 태스크 등록 및 시작
    pollingTasks.forEach((task) => {
      globalFallbackPoller.register(task);
      globalFallbackPoller.start(task.id);
    });
  }, [refreshProfile, refreshStreaks, refreshEvents]);

  // 폴백 폴링 중지
  const stopFallbackPolling = useCallback(() => {
    if (!fallbackPollingActive.current) {
      return;
    }

    console.log('[RealtimeSync] Stopping fallback polling');
    fallbackPollingActive.current = false;

    // 등록된 폴링 태스크 중지 및 제거
    const taskIds = ['sync-profile', 'sync-streaks', 'sync-events'];
    taskIds.forEach((taskId) => {
      globalFallbackPoller.stop(taskId);
      globalFallbackPoller.unregister(taskId);
    });
  }, []);

  // 인증 상태 변경시 연결 관리
  useEffect(() => {
    const token = getAccessToken();
    if (token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
      globalFallbackPoller.dispose();
    };
  }, [getAccessToken, user, connect, disconnect]);

  // 초기화 이벤트 수신: 모듈 레벨에서 발행되는 'cc:realtime:init-streak-refresh'를 받아 1회 스트릭 새로고침
  useEffect(() => {
    const handler = () => {
      // 토큰/유저 조건 만족 시 1회 호출
      const token = getAccessToken();
      if (token && user) {
        refreshStreaks().catch(() => {});
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('cc:realtime:init-streak-refresh', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cc:realtime:init-streak-refresh', handler as EventListener);
      }
    };
  }, [getAccessToken, user, refreshStreaks]);

  // 정리 작업 (오래된 보상 제거)
  useEffect(() => {
    const interval = window.setInterval(
      () => {
        clearOldRewards();
      },
      10 * 60 * 1000
    ); // 10분마다 정리

    return () => window.clearInterval(interval);
  }, [clearOldRewards]);

  // 초기 마운트 시 스트릭 상태 보수적 동기화: streaks가 비어 있고 인증된 경우 1회 호출
  useEffect(() => {
    const token = getAccessToken();
    if (!token || !user) return;
    if (!state.streaks || Object.keys(state.streaks).length === 0) {
      refreshStreaks().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken, user]);

  const contextValue: RealtimeSyncContextType = {
    state,
    connect,
    disconnect,
    refreshProfile,
    refreshAchievements,
    refreshStreaks,
    refreshEvents,
    clearOldRewards,
    triggerFallbackPoll,
  };

  return (
    <RealtimeSyncContext.Provider value={contextValue}>{children}</RealtimeSyncContext.Provider>
  );
}

/**
 * Hook for using realtime sync context
 */
export function useRealtimeSync(): RealtimeSyncContextType {
  const context = useContext(RealtimeSyncContext) as RealtimeSyncContextType | null;
  if (!context) {
    throw new Error('useRealtimeSync must be used within a RealtimeSyncProvider');
  }
  return context;
}

// 초기 마운트 시 1회 스트릭 상태를 보수적으로 동기화해 WS 연결 유무와 무관하게 서버 권위값을 확보
// - 목적: E2E(auth migration)에서 /api/streak/status 호출이 항상 발생하도록 보장
// - 사용: Provider 내부에서 훅이 정의되어 있으므로 파일 로드 후 효과 적용을 위해 아래 훅을 내보내지 않고 부수효과로만 운용
// 주의: React 서버/클라이언트 번들 혼선 방지 위해 window 존재 시에만 동작
(() => {
  if (typeof window !== 'undefined') {
    // 모듈 스코프에서 훅 사용 불가이므로, setTimeout으로 최초 틱에 지연 실행하여 Context 사용 환경에서 안전하게 호출
    // Provider 마운트 후 실행되며, 토큰 존재+사용자 존재 시 한번만 실행한다.
    let ran = false;
    const tryKick = () => {
      try {
        // 동적으로 훅을 가져와 컨텍스트에 접근 (런타임 시점)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('./RealtimeSyncContext');
        if (!mod || typeof mod.useRealtimeSync !== 'function') return;
        const hook = mod.useRealtimeSync as () => RealtimeSyncContextType;
        // 훅은 리액트 함수 컴포넌트 안에서만 호출 가능하므로, 대신 Provider 내부에서 보장된 refresh 함수에 의존
        // 여기서는 직접 호출하지 않고, 아래 setTimeout을 통해 컴포넌트 트리 내에서 한번 더 지연시켜 사용자가 트리거하도록 유도
      } catch {}
    };
    // 첫 페인트 직후 한 틱 지연
    setTimeout(() => {
      if (ran) return;
      ran = true;
      try {
        // 안전한 방식: 커스텀 이벤트로 Provider에 신호를 보내고, Provider는 이를 수신해 refreshStreaks를 1회 호출
        window.dispatchEvent(new CustomEvent('cc:realtime:init-streak-refresh'));
      } catch {}
    }, 0);
  }
})();
