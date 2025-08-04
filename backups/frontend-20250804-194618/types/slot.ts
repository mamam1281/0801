// 슬롯 머신 관련 타입 정의

// 슬롯 머신 스핀 응답 인터페이스
export interface SlotSpinResponse {
  result: string;        // 'win', 'lose', 'jackpot'
  tokens_change: number; // 보상 또는 차감된 토큰 수 (음수면 차감, 양수면 보상)
  balance: number;       // 업데이트 후 잔액
  streak: number;        // 연속 패배 횟수
  animation: string;     // 'win', 'lose', 'jackpot', 'force_win', 'near_miss' 등의 애니메이션 타입
}

// 슬롯 머신 스핀 요청 인터페이스 (필요한 경우)
export interface SlotSpinRequest {
  bet_amount?: number;  // 베팅 금액 (기본값이 있으므로 선택적)
}
