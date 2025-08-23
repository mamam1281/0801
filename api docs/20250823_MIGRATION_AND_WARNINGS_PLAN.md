# 2025-08-23 – 파괴적 마이그레이션 & 경고 정리 PR 스캐폴딩

본 문서는 2단계 PR(Shadow→Cutover)와 경고 정리 작업의 구체적 계획을 제공합니다. 모든 작업은 컨테이너 내부에서 수행하며, Alembic 단일 head 유지(현재 head: f79d04ea1016)를 절대 준수합니다.

## PR 1: Shadow 준비 + 더블라이트 + 백필(배치)

목표
- 기존 테이블을 중단 없이 교체할 수 있도록 Shadow 테이블을 생성하고, 데이터 동기화(더블라이트)와 배치 백필을 완료합니다.

절차
1) Alembic rev1 생성(컨테이너 내부)
   - 명령 예시: `alembic revision -m "create <table>_shadow with new schema"`
   - rev1 내용(핵심):
     - `op.create_table('<table>_shadow', ...)` (신규 제약/인덱스 포함)
     - 필요한 인덱스/제약을 선행 생성(op.create_index/op.create_unique_constraint 등)
   - 주의: 자동 생성보다는 수동 정의 권장(불필요한 drop 방지)

2) 더블라이트 스텁
   - DB 트리거 방식(권장): INSERT/UPDATE/DELETE 시 Shadow에 반영하는 트리거/함수 작성.
   - 또는 앱 레벨: 서비스 레이어에서 원본과 Shadow에 동시 쓰기(임시). 성능 영향/예외처리 주의.

3) 백필(배치)
   - 템플릿: `cc-webapp/backend/app/migrations_plan/scripts/backfill_template.sql`
   - 플레이스홀더 치환: `<table>`, `<shadow_table>`, `<pk>`, 컬럼 매핑
   - 청크 반복 실행으로 잠금 최소화. 영향 모니터링 필수.

4) 일관성 검증(병행 테스트)
   - 템플릿: `cc-webapp/backend/app/migrations_plan/scripts/verify_consistency.sql`
   - Row count/SUM 파리티, 핵심 SELECT 결과 비교 쿼리 추가(대상 테이블 맞춤 수정)

5) Cutover 준비 체크리스트
   - 더블라이트 동작 확인(최근 5~10분 row parity 유지)
   - 인덱스/제약 누락 없음
   - 롤백 플랜/백업(pg_dump) 보유

산출물
- Alembic rev1(py)
- 트리거 DDL(또는 앱 레벨 더블라이트 스텁 위치 기록)
- 백필 SQL 스크립트 + 실행 로그
- 일관성 검증 결과 스냅샷

## PR 2: Cutover(RENAME+FK 재연결) + Cleanup + 롤백 가이드

목표
- 짧은 락 구간에서 Shadow를 본 테이블로 승격하고, FK/시퀀스를 재연결합니다. 이후 old_ 테이블을 보관/정리합니다.

절차
1) Alembic rev2: Cutover
   - `ALTER TABLE <table> RENAME TO old_<table>;`
   - `ALTER TABLE <table>_shadow RENAME TO <table>;`
   - FK 재연결, 시퀀스/기본값 이전, 필요한 Rename 후처리
   - 락 타임아웃/저부하 시간대 수행

2) 안정화 관찰(짧은 시간)
   - 에러율/지연/락 이벤트 모니터링, READ/WRITE 기능검증 스모크

3) Alembic rev3: Cleanup
   - 보관 기간 이후 `DROP TABLE old_<table>;` (또는 파티션화된 보관 정책)

4) 롤백 가이드
   - rev2 이전으로 되돌리기: rename 반대로 재적용, 트리거 복원, 원본으로 라우팅
   - 백업 복원 경로/소요 시간 명시

산출물
- Alembic rev2/3(py)
- 실행 로그/모니터링 캡처
- 롤백 절차 문서

## 병행 테스트(최소 세트)
- READ: 핵심 쿼리 3~5개 결과의 전/후 스냅샷 비교(=)
- WRITE: 핵심 경로 1~2개 요청 후 원본/Shadow row 수+합계 일치
- 시간창: 백필 중/후/컷오버 직후 3시점 비교

## 경고 정리 PR 계획

1) Pydantic v2 전환
- BaseModel 내부 `class Config` → `model_config = ConfigDict(...)`
- Query/Path의 `regex` 파라미터 사용 → `pattern`로 변경
- 확인 방법: 검색(`class Config`, `regex=`) → 변경 후 pytest로 경고 소거 검증

2) httpx TestClient/WSGITransport 경고 제거
- httpx 버전 고정(0.27.0) 재확인
- 테스트 클라이언트 초기화: FastAPI `TestClient(app)` 우선, 직접 httpx 사용 시 transport 명시/경고 비노출 구성
- 관련 픽스처 위치: `app/tests/conftest.py` 인접(조정 시 회귀 테스트 필수)

3) OpenAPI operationId 중복 제거
- 라우터 전수 검사 → 중복되는 함수명/operation_id 재명명
- export 후 스냅샷 비교/테스트 추가(중복 미발생 확인)

## 실행 원칙(중요)
- 컨테이너 내부에서만 Alembic/백필/검증 실행
- Alembic 단일 head 유지, 다중 head 발생 시 즉시 merge
- 변경 요약/검증/다음 단계는 `api docs/20250808.md`와 `final.md`에 기록
