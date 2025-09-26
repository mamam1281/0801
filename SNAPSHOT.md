# 시스템 스냅샷 (2025-09-18)

## 도메인 상태 개요
| 도메인 | 상태 | 핵심 포인트 | 위험/리스크 |
|--------|------|-------------|-------------|
| 이벤트(Event Lifecycle) | 진행중(⚠ drift) | Public/Admin 분리 + 강제지급 UI 완료 | 스키마 단일화(EventUnified 백엔드 미적용) |
| 인증/세션 | 부분완료 | refresh 자동연장 토스트(5분 디바운스) | 세션 만료/실패 케이스 사용자 알림 부족 |
| 상점/경제 | 안정 | 500 원인 제거(모델-컬럼 주석) | 향후 컬럼 재도입 시 Alembic 누락 위험 |
| 게임통계 | 안정(✅ 서버권위) | MERGE 제거, SET 패턴 | 승/패 세부 통계 확장 미도입 |
| 테스트 | 부분 | 이벤트 E2E 초안 / 관리자 events tests 통과 | Playwright 전체 회귀 세트 부재 |
| OpenAPI/타이핑 | 진행 | 재수출 완료 snapshot 확보 | diff 자동화/프론트 타입 재검증 미완 |
| 모니터링/옵저버빌리티 | 미도입 | 계획만 존재 | Sentry/Prometheus 비활성 |

## Top 7일(단기) Focus
1. OpenAPI diff 문서화 + 프론트 타입/어댑터 재검증
2. Pydantic v2 경고 제거(protected_namespaces 등) → 테스트 워닝 정리
3. EventUnified 백엔드 스키마 통합(관리/퍼블릭 모델 수렴) 설계 초안
4. E2E: daily reward + shop purchase 최소 2개 추가
5. 강제지급 감사 로깅(중복 호출, 멱등키 활용)
6. refresh 실패 경로 UX(재로그인 유도 배너)
7. SNAPSHOT 자동화(pre-commit hook 또는 CI job)

## Top 30일(중기) Roadmap
1. 개인화 추천(세그먼트 → 게임/보상 노출 가중치)
2. ClickHouse 퍼널 적재(이벤트 참여/보상 소비 흐름)
3. 보상 정책 멱등성/중복 차단 Redis Key 전략 표준화
4. Observability: Sentry + Prometheus + Grafana 대시보드 최소셋
5. 게임 세부 승/패/페이아웃 통계 확장(API & Store)
6. 상점 voucher 재도입 Alembic 마이그레이션(검증 포함)
7. 다중 환경 배포 프로필(prod/stage) 스키마 drift 알림

## 주요 리스크 & 대응
| 리스크 | 영향 | 대응 전략 |
|--------|------|-----------|
| 이벤트 스키마 이원화 | 프론트/백엔드 drift → 버그 | 단일 Pydantic 모델 + adapter 삭제 단계 | 
| refresh 실패 UX 부재 | 사용자가 갑작스런 로그아웃 인지 못함 | 실패 분기 배너 + 재시도 버튼 | 
| OpenAPI diff 수동 추적 | 타입 누락/회귀 | CI에서 export 후 git diff 코멘트 자동화 | 
| 경고(12+) 누적 | 품질저하 / 중요 로그 희석 | 워닝 카테고리 분류 → 단계적 제거 | 
| 테스트 커버리지 낮음 | 회귀 탐지 실패 | 핵심 유저 플로우 E2E incremental 추가 | 
| 모니터링 부재 | 장애 탐지 지연 | 최소 SLO 메트릭 정의 후 계측 | 
| Alembic 재도입 실수 | 다중 head 위험 | pre-commit guard: `alembic heads` ≠1 실패 | 

## 오늘(2025-09-18) 완료 요약
- 강제지급 UI + 토스트/로딩/입력 검증
- refresh 성공 알림(디바운스) 구현
- 이벤트 라이프사이클 Playwright 스펙 초안
- OpenAPI 재수출(snapshots 생성)
- 문서 구조 분할 체계 선언(SNAPSHOT + logs)

### 관련 상세 문서
- 강제지급/운영 절차 세부: `개선안2.md` 내 "2025-09-18 Admin Events & Force Claim 운영 가이드" 섹션 참조

## Pending / Next
- OpenAPI diff 요약 삽입 → adapter 영향 점검
- logs/2025-09/2025-09-18.md populate (세부 기록)
- protected_namespaces 경고 제거 패치 준비

---
(이 파일은 매일 prepend 하던 개선안2.md 상단 스냅샷을 분리한 메인 상태 파일입니다.)
