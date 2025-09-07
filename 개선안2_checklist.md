---
### 수정가이드 체크리스트 (2025-09-07 22:10)

#### ✅ 완료된 작업
1. useGlobalStore 전체 코드 grep 및 import/export 구조 점검 ✅
2. 글로벌 유저 상태 관리 훅 통일 적용(SSR/CSR 포함) ✅
3. 스트릭 시스템 Next Reward Type 기능 완전 제거 ✅
4. 스트릭 보상 공식 1일 시작으로 변경 (Gold = 800 + streak*200) ✅
5. 백엔드 API 응답 간소화 (`next_reward` 필드 제거) ✅
6. 프론트엔드 UI에서 "다음 보상" 섹션 제거 ✅
7. pytest 테스트 검증 완료 (3/3 통과) ✅
8. 게임 통계 필드 추가 (total_games_played, total_wins, total_losses, win_rate) ✅
9. 시드 계정 6개 완전 초기화 (모든 활동 기록 삭제) ✅
10. users 테이블에 daily_streak, experience_points 필드 추가 ✅

#### ⬜ 향후 작업 계획
11. /signup 경로 복구 ⬜
12. 로그인 성공 시 글로벌 상태 즉시 갱신 테스트 ⬜
13. Redis 캐시 초기화 (스트릭 락, 잔액 등) ⬜

#### 🎯 시드 계정 초기화 완료 요약
- **문제**: 시드 계정들이 각기 다른 골드/스트릭 값, 게임 통계 필드 부재
- **해결**: 완전 초기화 + 게임 통계 시스템 구축
- **검증**: 6개 계정 모두 골드 1000, 모든 통계 0으로 초기화 확인

#### 📊 추가된 게임 통계 필드
- `total_games_played`: 총 게임 참여횟수
- `total_wins`: 총 승리횟수  
- `total_losses`: 총 패배횟수
- `win_rate`: 승률 (DECIMAL 5,4)
- `daily_streak`: 일일 연속 플레이
- `experience_points`: 경험치 시스템
---
