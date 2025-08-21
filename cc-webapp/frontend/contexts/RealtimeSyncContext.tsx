'use client';

import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
import { WSClient, createWSClient, WebSocketMessage, SyncEventData } from '../utils/wsClient';
import { useAuth } from '../hooks/useAuth';

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
  achievements: Record<number, {
    id: number;
    progress: number;
    unlocked: boolean;
    type?: string;
    last_updated?: string;
  }>;
  
  // 스트릭 상태  
  streaks: Record<string, {
    action_type: string;
    current_count: number;
    last_action_date: string;
    last_updated?: string;
  }>;
  
  // 이벤트 진행도
  events: Record<number, {
    id: number;
    progress: Record<string, any>;
    completed: boolean;
    last_updated?: string;
  }>;
  
  // 게임 통계
  stats: Record<string, {
    game_type: string;
    data: Record<string, any>;
    last_updated?: string;
  }>;
  
  // 최근 보상 내역 (UI 알림용)
  recent_rewards: Array<{
    id: string;
    reward_type: string;
    reward_data: Record<string, any>;
    source: string;
    timestamp: string;
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
  | { type: 'SET_CONNECTION_STATUS'; payload: { status: RealtimeSyncState['connection']['status']; attempts?: number } }
  | { type: 'UPDATE_PROFILE'; payload: SyncEventData['profile_update'] }
  | { type: 'UPDATE_ACHIEVEMENT'; payload: SyncEventData['achievement_progress'] }
  | { type: 'UPDATE_STREAK'; payload: SyncEventData['streak_update'] }
  | { type: 'UPDATE_EVENT'; payload: SyncEventData['event_progress'] }
  | { type: 'UPDATE_STATS'; payload: SyncEventData['stats_update'] }
  | { type: 'ADD_REWARD'; payload: SyncEventData['reward_granted'] }
  | { type: 'CLEAR_OLD_REWARDS' }
  | { type: 'SET_LAST_POLL_TIME'; payload: string }
  | { type: 'INITIALIZE_STATE'; payload: Partial<RealtimeSyncState> };

/**
 * 초기 상태
 */
const initialState: RealtimeSyncState = {
  profile: {
    gold: 0,
    exp: 0,
    tier: 'STANDARD',
    total_spent: 0
  },
  achievements: {},
  streaks: {},
  events: {},
  stats: {},
  recent_rewards: [],
  connection: {
    status: 'disconnected',
    reconnect_attempts: 0
  }
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
          last_connected: action.payload.status === 'connected' ? timestamp : state.connection.last_connected
        }
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
          ...(action.payload.total_spent !== undefined && { total_spent: action.payload.total_spent }),
          last_updated: timestamp
        }
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
            last_updated: timestamp
          }
        }
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
            last_updated: timestamp
          }
        }
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
            last_updated: timestamp
          }
        }
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
            last_updated: timestamp
          }
        }
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
            timestamp
          },
          ...state.recent_rewards.slice(0, 9) // 최대 10개 유지
        ]
      };
      
    case 'CLEAR_OLD_REWARDS':
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      return {
        ...state,
        recent_rewards: state.recent_rewards.filter(reward => reward.timestamp > oneHourAgo)
      };
      
    case 'SET_LAST_POLL_TIME':
      return {
        ...state,
        last_poll_time: action.payload
      };
      
    case 'INITIALIZE_STATE':
      return {
        ...state,
        ...action.payload
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
const RealtimeSyncContext = createContext<RealtimeSyncContextType | null>(null);

/**
 * Provider Props
 */
interface RealtimeSyncProviderProps {
  children: React.ReactNode;
  apiBaseUrl?: string;
}

/**
 * Provider 컴포넌트
 */
export function RealtimeSyncProvider({ children, apiBaseUrl }: RealtimeSyncProviderProps) {
  const [state, dispatch] = useReducer(syncStateReducer, initialState);
  const { token, user } = useAuth();
  const wsClientRef = useRef<WSClient | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  
  const baseUrl = apiBaseUrl || (typeof window !== 'undefined' ? 
    process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000' : 
    'http://localhost:8000');

  // WebSocket 메시지 핸들러
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('[RealtimeSync] Received message:', message.type, message.data);
    
    switch (message.type) {
      case 'profile_update':
        dispatch({ type: 'UPDATE_PROFILE', payload: message.data });
        break;
        
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
  }, []);

  // WebSocket 연결
  const connect = useCallback(async () => {
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
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'connected', attempts: 0 } });
        },
        onDisconnect: () => {
          console.log('[RealtimeSync] WebSocket disconnected');
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'disconnected' } });
        },
        onMessage: handleWebSocketMessage,
        onError: (error) => {
          console.error('[RealtimeSync] WebSocket error:', error);
        },
        onReconnecting: (attempt) => {
          console.log('[RealtimeSync] Reconnecting...', attempt);
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'reconnecting', attempts: attempt } });
        }
      });

      wsClientRef.current = wsClient;
      await wsClient.connect();
      
    } catch (error) {
      console.error('[RealtimeSync] Connection failed:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'disconnected' } });
    }
  }, [token, user, baseUrl, handleWebSocketMessage]);

  // WebSocket 연결 해제
  const disconnect = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: { status: 'disconnected', attempts: 0 } });
  }, []);

  // API 호출 헬퍼
  const apiCall = useCallback(async (endpoint: string) => {
    if (!token) throw new Error('No token available');
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }, [token, baseUrl]);

  // 수동 데이터 새로고침 함수들
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiCall('/api/users/me');
      dispatch({ 
        type: 'UPDATE_PROFILE', 
        payload: { 
          user_id: profile.id,
          gold: profile.gold,
          exp: profile.exp, 
          tier: profile.tier,
          total_spent: profile.total_spent
        } 
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
          last_action_date: streakData.last_action_date
        }
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
      await Promise.allSettled([
        refreshProfile(),
        refreshStreaks(),
        refreshEvents()
      ]);
      
      dispatch({ type: 'SET_LAST_POLL_TIME', payload: new Date().toISOString() });
      
    } catch (error) {
      console.error('[RealtimeSync] Fallback polling failed:', error);
    }
  }, [refreshProfile, refreshStreaks, refreshEvents]);

  // 인증 상태 변경시 연결 관리
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect]);

  // 정리 작업 (오래된 보상 제거)
  useEffect(() => {
    const interval = window.setInterval(() => {
      clearOldRewards();
    }, 10 * 60 * 1000); // 10분마다 정리

    return () => window.clearInterval(interval);
  }, [clearOldRewards]);

  const contextValue: RealtimeSyncContextType = {
    state,
    connect,
    disconnect,
    refreshProfile,
    refreshAchievements,
    refreshStreaks,
    refreshEvents,
    clearOldRewards,
    triggerFallbackPoll
  };

  return (
    <RealtimeSyncContext.Provider value={contextValue}>
      {children}
    </RealtimeSyncContext.Provider>
  );
}

/**
 * Hook for using realtime sync context
 */
export function useRealtimeSync(): RealtimeSyncContextType {
  const context = useContext(RealtimeSyncContext);
  if (!context) {
    throw new Error('useRealtimeSync must be used within a RealtimeSyncProvider');
  }
  return context;
}
