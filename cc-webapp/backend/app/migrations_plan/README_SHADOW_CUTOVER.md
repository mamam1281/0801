# Alembic 파괴적 변경 안전 전략(Shadow → Backfill → Cutover → Cleanup)

본 문서는 파괴적 스키마 변경을 안전하게 수행하기 위한 단계와 체크리스트를 제시합니다.

## 단계 요약
1) Shadow 생성: 기존 스키마 + 신규 제약/컬럼을 포함한 Shadow 테이블 생성(Alembic rev1).
2) 더블라이트: 애플리케이션 또는 DB 트리거로 원본/Shadow 동시 쓰기 준비.
3) 백필: 배치로 원본 데이터를 Shadow로 점진 복사(작은 청크, 인덱스/제약 선행).
4) Cutover: 짧은 락에서 RENAME(Shadow→본 이름), FK 재연결, 시퀀스 이전(Alembic rev2).
5) Cleanup: old_ 보관 테이블 제거(Alembic rev3), 롤백 시나리오 준비.

## 운영 체크리스트
- 백업: pg_dump 스냅샷 확보, 롤백 스크립트 준비.
- 트래픽: 저부하 시간대 수행, 락 타임아웃 구성.
- 모니터링: 에러율/지연, DB 락/Deadlock, 애플리케이션 오류 대시보드 주시.

## 테스트(병행)
- READ 전/후 스냅샷 비교(핵심 쿼리 3~5개), 차이 0 보장.
- WRITE 이중기록 무결성(핵심 경로 1~2개), Shadow/원본 row 수·합계 일치.

## Alembic 분리 PR 가이드
- PR 1: rev1(Shadow+인덱스/제약) + 더블라이트 스텁 + 백필 스크립트 추가.
- PR 2: rev2(Cutover rename+FK 재연결) + rev3(Cleanup) + 롤백 가이드.
