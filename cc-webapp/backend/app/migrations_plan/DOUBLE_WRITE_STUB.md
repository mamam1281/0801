# 더블라이트(앱 레벨) 스텁 가이드

트리거를 사용하지 못하는 경우, 서비스 레이어에서 원본과 Shadow에 동시 쓰기를 수행합니다.

포인트
- 실패 시 재시도/멱등 보장: 원본 성공, Shadow 실패 시 재시도 큐 또는 보정 잡 필요.
- 트랜잭션 범위: 동일 트랜잭션 내에서 두 테이블에 쓰면 락이 길어질 수 있으므로 주의.
- 권장: 가능하면 DB 트리거 사용. 앱 레벨은 임시 방편.

예시(ShopTransaction 생성 경로):
- 기존 INSERT 후, 추가로 `INSERT INTO shop_transactions_shadow (...) VALUES (...)`를 동일 파라미터로 수행.
- integrity_hash/idempotency_key를 동일하게 유지하여 검증/중복 방지 용이.