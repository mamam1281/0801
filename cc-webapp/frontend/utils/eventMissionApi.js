// eventMissionApi.js - API 클라이언트 이벤트 및 미션 모듈
import apiRequest from './apiClient';

/**
 * 이벤트 및 미션 관련 API 함수
 */
export const eventMissionApi = {
  // 이벤트 관련 API
  events: {
    // 모든 활성 이벤트 조회
    getAll: async () => {
      return await apiRequest('/api/events/');
    },
    
    // 이벤트 상세 조회
    getById: async (eventId) => {
      return await apiRequest(`/api/events/${eventId}`);
    },
    
    // 이벤트 참여
    join: async (eventId) => {
      return await apiRequest('/api/events/join', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId })
      });
    },
    
    // 이벤트 진행 상황 업데이트
    updateProgress: async (eventId, progress) => {
      return await apiRequest(`/api/events/progress/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({ progress })
      });
    },
    
    // 이벤트 보상 수령
    claimRewards: async (eventId) => {
      return await apiRequest(`/api/events/claim/${eventId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
    }
  },
  
  // 미션 관련 API
  missions: {
    // 일일 미션 조회
    getDaily: async () => {
      return await apiRequest('/api/events/missions/daily');
    },
    
    // 주간 미션 조회
    getWeekly: async () => {
      return await apiRequest('/api/events/missions/weekly');
    },
    
    // 모든 미션 조회
    getAll: async () => {
      return await apiRequest('/api/events/missions/all');
    },
    
    // 미션 진행 상황 업데이트
    updateProgress: async (missionId, progressIncrement = 1) => {
      return await apiRequest('/api/events/missions/progress', {
        method: 'PUT',
        body: JSON.stringify({ 
          mission_id: missionId,
          progress_increment: progressIncrement
        })
      });
    },
    
    // 미션 보상 수령
    claimRewards: async (missionId) => {
      return await apiRequest(`/api/events/missions/claim/${missionId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
    }
  }
};
