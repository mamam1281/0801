import axios from 'axios';

export interface SlotSpinRequest {
  user_id: string;
  bet_amount: number;
  lines: number;
  vip_mode: boolean;
}

export interface SlotSpinResponse {
  spin_id: string;
  result: number[][];
  win_lines: number[];
  win_amount: number;
  multiplier: number;
  remaining_spins: number;
  streak_count: number;
  special_event: string | null;
}

/**
 * 슬롯 머신 스핀 API 호출
 * @param params 스핀 요청 파라미터
 * @returns 스핀 결과
 */
export const spinSlotMachine = async (params: SlotSpinRequest): Promise<SlotSpinResponse> => {
  try {
    const response = await axios.post<SlotSpinResponse>('/api/actions/SLOT_SPIN', params);
    return response.data;
  } catch (error) {
    console.error('슬롯 머신 스핀 요청 실패:', error);
    throw error;
  }
};

/**
 * 사용자 게임 제한 조회 API 호출
 * @param userId 사용자 ID
 * @returns 게임 제한 정보
 */
export const getUserGameLimits = async (userId: string): Promise<any> => {
  try {
    const response = await axios.get(`/api/user/game-limits?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('게임 제한 조회 요청 실패:', error);
    throw error;
  }
};
