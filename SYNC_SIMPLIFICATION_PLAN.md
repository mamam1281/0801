# 🔄 전역동기화 단순화 전략

## 현재 문제점
- 너무 많은 WebSocket 이벤트 타입 (purchase_update, profile_update, event_progress, etc.)
- 다중 API 엔드포인트 간 상태 불일치
- 옵티미스틱 업데이트와 서버 권위 상태 간 충돌

## 단순화 방안

### 1. 핵심 이벤트만 유지
```typescript
// 기존: 8+ 이벤트 타입
// 단순화: 3개 핵심 이벤트만
interface SimplifiedSyncEvent {
  type: 'balance_update' | 'purchase_complete' | 'reward_granted';
  user_id: number;
  data: any;
}
```

### 2. 단일 진실의 소스 (Single Source of Truth)
- **잔액**: `/api/users/balance` 만이 권위
- **구매 상태**: `shop_transactions` 테이블만이 권위  
- **이벤트 진행**: `event_participations` 테이블만이 권위

### 3. 동기화 간격 조정
```typescript
// 기존: 실시간 (과도한 네트워크 트래픽)
// 단순화: 스마트 폴링
const SYNC_INTERVALS = {
  balance: 30_000,    // 30초
  events: 60_000,     // 1분
  purchases: 10_000   // 10초 (중요한 것만 빠르게)
};
```

## 구현 순서

### Step 1: WebSocket 이벤트 단순화
1. `cc-webapp/frontend/utils/wsClient.ts` 이벤트 타입 축소
2. `cc-webapp/backend/app/websockets/` 발송 로직 단순화

### Step 2: API 응답 일관성 확보
1. 모든 구매 API는 `{ success, new_balance, receipt_code }` 형태로 통일
2. 모든 이벤트 API는 `{ success, progress, rewards }` 형태로 통일

### Step 3: 프론트엔드 상태 관리 정리
1. `useGlobalSync` 훅을 핵심 동기화만 담당하도록 축소
2. 컴포넌트별 로컬 상태와 글로벌 상태 분리 명확화

## 테스트 플랜
1. 격리된 시스템 테스트 (debug_system_isolation.html)
2. 단순화된 동기화 테스트 
3. 어드민-유저 통합 플로우 테스트