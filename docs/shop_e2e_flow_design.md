# 상점 거래 E2E 플로우 설계

## 개요
상점 시스템의 전체 거래 플로우를 검증하는 포괄적인 E2E 테스트 설계

## Phase 1: 구매 플로우 (Purchase Flow)

### 1.1 사전 준비
```javascript
// 테스트 사용자 생성 및 초기 토큰 부여
const testUser = {
  nickname: `shop_test_${Date.now()}`,
  invite_code: '5858',
  initial_tokens: 10000
};

// 테스트용 상품 생성 (관리자)
const testProducts = [
  { product_id: 'test_item_1', name: '테스트 아이템 1', price: 1000 },
  { product_id: 'test_voucher_1', name: '테스트 교환권', price: 2000 },
  { product_id: 'test_limited_1', name: '한정 패키지', price: 5000, stock: 10 }
];
```

### 1.2 상품 목록 조회 및 가격 확인
```http
GET /api/shop/catalog
GET /api/shop/products
GET /api/shop/limited-packages

# 예상 응답 검증
- 활성 상품만 노출
- 가격/할인 정보 정확성
- 재고 정보 (한정 상품)
```

### 1.3 일반 아이템 구매
```http
POST /api/shop/buy
{
  "user_id": {{user_id}},
  "product_id": "test_item_1",
  "amount": 1000,
  "quantity": 1,
  "kind": "item",
  "payment_method": "tokens",
  "idempotency_key": "{{unique_key}}"
}

# 검증 포인트
✓ 토큰 잔액 차감 (10000 → 9000)
✓ ShopTransaction 레코드 생성
✓ UserAction 로그 기록 (BUY_PACKAGE)
✓ 영수증 코드 발급
✓ 멱등성 키 저장
```

### 1.4 멱등성 테스트
```http
# 동일한 요청 재전송
POST /api/shop/buy (동일 idempotency_key)

# 검증 포인트
✓ 중복 거래 차단
✓ 동일한 영수증 코드 반환
✓ 잔액 중복 차감 방지
```

## Phase 2: 교환권/아이템 사용 플로우 (Usage Flow)

### 2.1 구매한 아이템 조회
```http
GET /api/users/{{user_id}}/purchases
GET /api/shop/transactions?user_id={{user_id}}

# 검증 포인트
✓ 구매 내역 정확 표시
✓ 사용 가능한 아이템 구분
✓ 교환권 유효기간 확인
```

### 2.2 교환권 사용
```http
POST /api/shop/vouchers/{{voucher_id}}/use
{
  "user_id": {{user_id}},
  "external_service": "daily_comp",
  "external_request_id": "{{unique_request}}"
}

# 검증 포인트
✓ VoucherUsage 레코드 생성 (status: used)
✓ 외부 서비스 연동 정보 저장
✓ 사용 시간 기록 (used_at)
✓ 중복 사용 방지
```

### 2.3 아이템 활용 (게임 내)
```http
POST /api/actions/use-item
{
  "user_id": {{user_id}},
  "item_id": "test_item_1",
  "action_type": "CONSUME_ITEM"
}

# 검증 포인트
✓ UserAction 로그 기록
✓ 아이템 사용 횟수 증가
✓ 게임 효과 적용 확인
```

## Phase 3: 거래 히스토리 및 잔액 동기화 (History & Sync)

### 3.1 거래 내역 조회
```http
GET /api/shop/transactions?user_id={{user_id}}&limit=50
GET /api/users/{{user_id}}/action-history?action_type=BUY_PACKAGE

# 검증 포인트
✓ ShopTransaction과 UserAction 일치성
✓ 시간순 정렬
✓ 페이지네이션 동작
✓ 거래 상태별 필터링
```

### 3.2 잔액 일치성 검증
```sql
-- DB 직접 검증 쿼리
SELECT 
  u.id,
  u.cyber_token_balance as current_balance,
  (
    SELECT COALESCE(SUM(amount), 0) 
    FROM shop_transactions st 
    WHERE st.user_id = u.id 
    AND st.status = 'success'
    AND st.kind = 'item'
  ) as total_spent,
  (
    SELECT COALESCE(SUM(amount), 0)
    FROM shop_transactions st
    WHERE st.user_id = u.id
    AND st.status = 'success' 
    AND st.kind = 'gold'
  ) as total_purchased
FROM users u 
WHERE u.id = {{user_id}};

# 검증 공식
initial_balance + total_purchased - total_spent = current_balance
```

### 3.3 실시간 동기화 검증
```javascript
// WebSocket 연결하여 실시간 업데이트 확인
const ws = new WebSocket('ws://localhost:8000/ws');

// 구매 후 즉시 잔액 변경 이벤트 수신 확인
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'balance_update') {
    expect(data.new_balance).toBe(expectedBalance);
  }
};
```

## Phase 4: 관리자 기능 검증 (Admin Features)

### 4.1 상품 관리 CRUD
```http
# 상품 생성
POST /api/shop/admin/products
{
  "product_id": "admin_test_item",
  "name": "관리자 테스트 상품",
  "price": 3000,
  "description": "E2E 테스트용"
}

# 상품 수정
PUT /api/shop/admin/products/admin_test_item
{
  "price": 2500,
  "name": "수정된 테스트 상품"
}

# 소프트 삭제
DELETE /api/shop/admin/products/admin_test_item

# 복구
POST /api/shop/admin/products/admin_test_item/restore
```

### 4.2 거래 조회 및 관리
```http
GET /api/shop/admin/transactions?user_id={{user_id}}
GET /api/shop/admin/transactions?status=failed
GET /api/shop/admin/transactions?start={{date}}&end={{date}}

# 환불 처리 (향후 구현)
POST /api/shop/admin/transactions/{{tx_id}}/refund
```

### 4.3 감사 로그 확인
```sql
-- 관리자 작업 감사 로그 검증
SELECT * FROM admin_audit_logs 
WHERE actor_user_id = {{admin_user_id}}
AND action IN ('CREATE_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT')
ORDER BY created_at DESC;
```

## Phase 5: 에러 처리 및 예외 상황 (Error Handling)

### 5.1 잔액 부족 시나리오
```http
POST /api/shop/buy
{
  "user_id": {{user_id}},
  "product_id": "expensive_item",
  "amount": 999999,  # 잔액 초과
  "kind": "item"
}

# 예상 응답
{
  "success": false,
  "message": "토큰이 부족합니다.",
  "reason_code": "INSUFFICIENT_BALANCE"
}
```

### 5.2 재고 부족 (한정 상품)
```http
# 재고보다 많은 수량 구매 시도
POST /api/shop/buy (quantity > stock_remaining)

# 예상 응답
{
  "success": false,
  "message": "재고가 부족합니다.",
  "reason_code": "OUT_OF_STOCK"
}
```

### 5.3 개인 구매 한도 초과
```http
# per_user_limit 초과 시도
POST /api/shop/buy (이미 한도만큼 구매한 상품)

# 예상 응답
{
  "success": false,
  "message": "개인 구매 한도를 초과했습니다.",
  "reason_code": "USER_LIMIT_EXCEEDED"
}
```

## Phase 6: 성능 및 동시성 테스트 (Performance & Concurrency)

### 6.1 동시 구매 요청
```javascript
// 여러 사용자가 동시에 한정 상품 구매
const promises = Array.from({length: 10}, (_, i) => 
  buyLimitedProduct(userIds[i], 'limited_item_1')
);

const results = await Promise.all(promises);

// 검증: 재고만큼만 성공, 나머지는 실패
const successCount = results.filter(r => r.success).length;
expect(successCount).toBe(expectedStock);
```

### 6.2 멱등성 동시 테스트
```javascript
// 동일 사용자가 같은 멱등성 키로 동시 요청
const sameKeyPromises = Array.from({length: 5}, () =>
  buyWithIdempotencyKey(userId, 'same_key_123')
);

const sameKeyResults = await Promise.all(sameKeyPromises);

// 검증: 모두 동일한 영수증 코드, 한 번만 차감
const uniqueReceiptCodes = new Set(
  sameKeyResults.map(r => r.receipt_code)
);
expect(uniqueReceiptCodes.size).toBe(1);
```

## 검증 체크리스트

### ✅ 기능적 검증
- [ ] 상품 목록 정확 조회
- [ ] 구매 프로세스 완료
- [ ] 잔액 정확 차감/반영
- [ ] 거래 내역 기록
- [ ] 멱등성 보장
- [ ] 교환권/아이템 사용
- [ ] 관리자 CRUD 동작

### ✅ 데이터 무결성 검증
- [ ] ShopTransaction ↔ UserAction 일치
- [ ] 잔액 계산 정확성
- [ ] 재고 관리 정확성
- [ ] 감사 로그 완전성

### ✅ 보안 검증
- [ ] 권한 기반 접근 제어
- [ ] 멱등성 키 유니크성
- [ ] 영수증 서명 검증
- [ ] SQL 인젝션 방지

### ✅ 성능 검증
- [ ] 동시 요청 처리
- [ ] 데이터베이스 락 경합
- [ ] 응답 시간 측정
- [ ] 메모리 사용량 모니터링

## 자동화 구현 계획

### 1. pytest 통합 테스트
```python
# tests/test_shop_e2e_flow.py
class TestShopE2EFlow:
    def test_complete_purchase_flow(self, test_user, test_products):
        # Phase 1-6 전체 시나리오 구현
        pass
    
    def test_concurrent_limited_purchase(self, multiple_users):
        # 동시성 테스트
        pass
```

### 2. Playwright E2E 확장
```typescript
// tests/e2e/shop_complete_flow.spec.ts
test('Complete shop transaction flow', async ({ page }) => {
  // UI 레벨에서 전체 플로우 검증
});
```

### 3. 성능 벤치마크
```python
# tests/performance/shop_load_test.py
def test_shop_load_capacity():
    # 부하 테스트 시나리오
    pass
```

이 설계를 기반으로 실제 구현 및 테스트를 진행하겠습니다.