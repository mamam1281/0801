# 상점 테스트 자동화 확장 가이드

## 📊 현재 테스트 상태 분석

### ✅ 검증 완료 항목
- **기본 구매 플로우**: 100% 성공 (골드 차감, 거래 기록 생성)
- **멱등성 보장**: 100% 성공 (중복 거래 방지, 영수증 일치성)
- **오류 처리**: 100% 성공 (잔액 부족 시 차단)
- **전체 성공률**: 75% (3/4 통과)

### ⚠️ 개선 필요 항목
- **잔액 일치성**: 기존 거래 내역과 초기 설정 간 불일치 해결

## 🎯 추가 E2E 자동화 시나리오 제안

### 1. pytest 통합 테스트 확장

#### A. 상점 거래 통합 테스트 (`tests/test_shop_integration.py`)

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, ShopTransaction, ShopProduct

client = TestClient(app)

class TestShopIntegration:
    """상점 시스템 통합 테스트"""
    
    @pytest.fixture
    def authenticated_user(self, db_session):
        """인증된 테스트 사용자"""
        user = User(
            site_id="shop_test_user", 
            nickname="shop_tester",
            gold_balance=50000,
            password_hash="test123"
        )
        db_session.add(user)
        db_session.commit()
        
        # 로그인 토큰 획득
        response = client.post("/api/auth/login", json={
            "site_id": "shop_test_user",
            "password": "test123"
        })
        token = response.json()["access_token"]
        
        return {
            "user": user,
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"}
        }
    
    @pytest.fixture
    def test_products(self, db_session):
        """테스트용 상품들"""
        products = [
            ShopProduct(product_id="test_cheap", name="저렴한 아이템", price=1000),
            ShopProduct(product_id="test_expensive", name="비싼 아이템", price=30000),
            ShopProduct(product_id="test_limited", name="한정 아이템", price=5000)
        ]
        for product in products:
            db_session.add(product)
        db_session.commit()
        return products
    
    def test_complete_purchase_flow(self, authenticated_user, test_products):
        """완전한 구매 플로우 테스트"""
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # 1. 상품 목록 조회
        response = client.get("/api/shop/products")
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 3
        
        # 2. 구매 실행
        purchase_data = {
            "user_id": user.id,
            "product_id": "test_cheap",
            "amount": 1000,
            "quantity": 1,
            "kind": "item",
            "payment_method": "gold"
        }
        
        response = client.post("/api/shop/buy", headers=headers, json=purchase_data)
        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        
        # 3. 잔액 검증
        user_response = client.get("/api/auth/me", headers=headers)
        updated_user = user_response.json()
        assert updated_user["gold_balance"] == 49000  # 50000 - 1000
        
        # 4. 거래 내역 확인
        tx_response = client.get(f"/api/shop/transactions?user_id={user.id}", headers=headers)
        transactions = tx_response.json()
        assert len(transactions) >= 1
        assert transactions[0]["product_id"] == "test_cheap"
        assert transactions[0]["amount"] == 1000
    
    def test_concurrent_purchase_idempotency(self, authenticated_user, test_products):
        """동시 구매 멱등성 테스트"""
        import threading
        import time
        
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        results = []
        idempotency_key = "concurrent_test_key"
        
        def make_purchase():
            purchase_data = {
                "user_id": user.id,
                "product_id": "test_limited",
                "amount": 5000,
                "quantity": 1,
                "kind": "item",
                "payment_method": "gold",
                "idempotency_key": idempotency_key
            }
            response = client.post("/api/shop/buy", headers=headers, json=purchase_data)
            results.append(response.json())
        
        # 동시에 5개 구매 요청
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_purchase)
            threads.append(thread)
        
        for thread in threads:
            thread.start()
        
        for thread in threads:
            thread.join()
        
        # 검증: 모든 요청이 동일한 영수증 코드를 가져야 함
        receipt_codes = [r.get("receipt_code") for r in results if r.get("success")]
        unique_receipts = set(receipt_codes)
        assert len(unique_receipts) == 1, "멱등성 실패: 다른 영수증 코드 생성됨"
    
    def test_purchase_insufficient_balance(self, authenticated_user, test_products):
        """잔액 부족 구매 테스트"""
        headers = authenticated_user["headers"]
        user = authenticated_user["user"]
        
        # 잔액보다 비싼 상품 구매 시도
        purchase_data = {
            "user_id": user.id,
            "product_id": "test_expensive",
            "amount": 100000,  # 잔액 초과
            "quantity": 1,
            "kind": "item",
            "payment_method": "gold"
        }
        
        response = client.post("/api/shop/buy", headers=headers, json=purchase_data)
        result = response.json()
        
        assert result["success"] is False
        assert "부족" in result["message"]
        
        # 잔액이 변하지 않았는지 확인
        user_response = client.get("/api/auth/me", headers=headers)
        updated_user = user_response.json()
        assert updated_user["gold_balance"] == 50000  # 원래 잔액 유지
```

#### B. 상점 관리자 기능 테스트 (`tests/test_shop_admin.py`)

```python
class TestShopAdmin:
    """상점 관리자 기능 테스트"""
    
    @pytest.fixture
    def admin_user(self, db_session):
        """관리자 사용자"""
        admin = User(
            site_id="shop_admin",
            nickname="admin",
            is_admin=True,
            password_hash="admin123"
        )
        db_session.add(admin)
        db_session.commit()
        
        response = client.post("/api/auth/login", json={
            "site_id": "shop_admin",
            "password": "admin123"
        })
        token = response.json()["access_token"]
        
        return {
            "user": admin,
            "headers": {"Authorization": f"Bearer {token}"}
        }
    
    def test_product_crud_lifecycle(self, admin_user):
        """상품 CRUD 전체 생명주기 테스트"""
        headers = admin_user["headers"]
        
        # 1. 상품 생성
        product_data = {
            "product_id": "admin_test_product",
            "name": "관리자 테스트 상품",
            "price": 15000,
            "description": "자동화 테스트용 상품"
        }
        
        response = client.post("/api/shop/admin/products", headers=headers, json=product_data)
        assert response.status_code == 200
        
        # 2. 상품 조회 확인
        response = client.get("/api/shop/admin/products", headers=headers)
        products = response.json()
        created_product = next((p for p in products if p["product_id"] == "admin_test_product"), None)
        assert created_product is not None
        assert created_product["name"] == "관리자 테스트 상품"
        
        # 3. 상품 수정
        update_data = {
            "name": "수정된 상품명",
            "price": 20000
        }
        
        response = client.put("/api/shop/admin/products/admin_test_product", 
                            headers=headers, json=update_data)
        assert response.status_code == 200
        
        # 4. 소프트 삭제
        response = client.delete("/api/shop/admin/products/admin_test_product", headers=headers)
        assert response.status_code == 200
        
        # 5. 일반 목록에서 제외 확인
        response = client.get("/api/shop/products")
        public_products = response.json()
        deleted_product = next((p for p in public_products if p["product_id"] == "admin_test_product"), None)
        assert deleted_product is None
        
        # 6. 삭제된 항목 포함 목록에서 확인
        response = client.get("/api/shop/admin/products?include_deleted=true", headers=headers)
        all_products = response.json()
        deleted_product = next((p for p in all_products if p["product_id"] == "admin_test_product"), None)
        assert deleted_product is not None
        assert deleted_product["deleted_at"] is not None
        
        # 7. 복구
        response = client.post("/api/shop/admin/products/admin_test_product/restore", headers=headers)
        assert response.status_code == 200
        
        # 8. 복구 확인
        response = client.get("/api/shop/products")
        restored_products = response.json()
        restored_product = next((p for p in restored_products if p["product_id"] == "admin_test_product"), None)
        assert restored_product is not None
```

### 2. Playwright E2E 테스트 확장

#### A. 상점 전체 플로우 E2E (`tests/e2e/shop_complete_flow.spec.ts`)

```typescript
import { test, expect, request } from '@playwright/test';

test.describe('Shop Complete Flow E2E', () => {
  let apiContext: any;
  let userToken: string;
  let userId: number;

  test.beforeAll(async () => {
    apiContext = await request.newContext();
    
    // 테스트 사용자 생성
    const registerResponse = await apiContext.post('/api/auth/register', {
      data: {
        invite_code: '5858',
        nickname: `shop_e2e_${Date.now()}`,
        password: 'test1234'
      }
    });
    
    const registerData = await registerResponse.json();
    userToken = registerData.access_token;
    userId = registerData.user.id;
    
    // 충분한 골드 부여 (DB 직접 조작)
    await apiContext.post('/api/admin/users/add-gold', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { user_id: userId, amount: 100000 }
    });
  });

  test('Complete purchase flow in UI', async ({ page }) => {
    // 1. 로그인
    await page.goto('/login');
    await page.fill('[data-testid="site-id"]', 'shop_e2e_user');
    await page.fill('[data-testid="password"]', 'test1234');
    await page.click('[data-testid="login-button"]');
    
    // 2. 상점 페이지 이동
    await page.goto('/shop');
    await expect(page.locator('[data-testid="shop-products"]')).toBeVisible();
    
    // 3. 상품 선택 및 구매
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    await firstProduct.click();
    
    await page.click('[data-testid="buy-button"]');
    await page.click('[data-testid="confirm-purchase"]');
    
    // 4. 구매 성공 확인
    await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
    
    // 5. 잔액 업데이트 확인
    const balanceElement = page.locator('[data-testid="gold-balance"]');
    await expect(balanceElement).not.toHaveText('100000');
    
    // 6. 거래 내역 확인
    await page.goto('/profile/transactions');
    await expect(page.locator('[data-testid="transaction-item"]').first()).toBeVisible();
  });

  test('Purchase with insufficient balance error handling', async ({ page }) => {
    // 잔액을 0으로 설정
    await apiContext.post('/api/admin/users/set-gold', {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { user_id: userId, amount: 0 }
    });
    
    await page.goto('/shop');
    
    const expensiveProduct = page.locator('[data-testid="product-item"]').first();
    await expensiveProduct.click();
    await page.click('[data-testid="buy-button"]');
    
    // 오류 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toContainText('잔액이 부족');
    await expect(page.locator('[data-testid="purchase-success"]')).not.toBeVisible();
  });

  test('Real-time balance update during purchase', async ({ page, context }) => {
    // WebSocket 연결 모니터링
    const messages: any[] = [];
    
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        if (event.payload) {
          try {
            const data = JSON.parse(event.payload.toString());
            messages.push(data);
          } catch (e) {
            // JSON이 아닌 메시지 무시
          }
        }
      });
    });
    
    await page.goto('/shop');
    
    // 구매 실행
    const product = page.locator('[data-testid="product-item"]').first();
    await product.click();
    await page.click('[data-testid="buy-button"]');
    await page.click('[data-testid="confirm-purchase"]');
    
    // WebSocket 메시지에서 잔액 업데이트 확인
    await page.waitForTimeout(2000);
    
    const balanceUpdateMessage = messages.find(msg => 
      msg.type === 'balance_update' && msg.user_id === userId
    );
    
    expect(balanceUpdateMessage).toBeTruthy();
    expect(balanceUpdateMessage.new_balance).toBeLessThan(100000);
  });
});
```

#### B. 관리자 상점 관리 E2E (`tests/e2e/admin_shop_management.spec.ts`)

```typescript
test.describe('Admin Shop Management E2E', () => {
  test('Admin product management workflow', async ({ page }) => {
    // 관리자 로그인
    await page.goto('/admin/login');
    await page.fill('[data-testid="admin-id"]', 'admin');
    await page.fill('[data-testid="admin-password"]', 'admin123');
    await page.click('[data-testid="admin-login"]');
    
    // 상점 관리 페이지
    await page.goto('/admin/shop');
    
    // 새 상품 추가
    await page.click('[data-testid="add-product-button"]');
    await page.fill('[data-testid="product-id"]', 'e2e_test_product');
    await page.fill('[data-testid="product-name"]', 'E2E 테스트 상품');
    await page.fill('[data-testid="product-price"]', '15000');
    await page.click('[data-testid="save-product"]');
    
    // 상품 목록에서 확인
    await expect(page.locator('[data-testid="product-list"]')).toContainText('E2E 테스트 상품');
    
    // 상품 수정
    await page.click('[data-testid="edit-product-e2e_test_product"]');
    await page.fill('[data-testid="product-name"]', '수정된 테스트 상품');
    await page.click('[data-testid="update-product"]');
    
    // 소프트 삭제
    await page.click('[data-testid="delete-product-e2e_test_product"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // 삭제 확인
    await expect(page.locator('[data-testid="product-list"]')).not.toContainText('수정된 테스트 상품');
    
    // 삭제된 항목 보기
    await page.check('[data-testid="show-deleted"]');
    await expect(page.locator('[data-testid="deleted-products"]')).toContainText('수정된 테스트 상품');
  });
});
```

### 3. 성능 및 부하 테스트

#### A. 동시성 테스트 (`tests/performance/shop_concurrency_test.py`)

```python
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor

class ShopConcurrencyTest:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
    
    async def test_concurrent_purchases(self, user_count: int = 10, product_id: str = "test_product"):
        """동시 구매 테스트"""
        async with aiohttp.ClientSession() as session:
            tasks = []
            
            for i in range(user_count):
                task = self.make_purchase_request(session, f"user_{i}", product_id)
                tasks.append(task)
            
            start_time = time.time()
            results = await asyncio.gather(*tasks, return_exceptions=True)
            end_time = time.time()
            
            successful_purchases = sum(1 for r in results if isinstance(r, dict) and r.get('success'))
            
            print(f"동시 구매 테스트 결과:")
            print(f"총 요청: {user_count}")
            print(f"성공한 구매: {successful_purchases}")
            print(f"실행 시간: {end_time - start_time:.2f}초")
            print(f"초당 처리량: {user_count / (end_time - start_time):.2f} req/sec")
    
    async def make_purchase_request(self, session, user_id: str, product_id: str):
        """개별 구매 요청"""
        data = {
            "user_id": user_id,
            "product_id": product_id,
            "amount": 1000,
            "quantity": 1,
            "kind": "item"
        }
        
        try:
            async with session.post(f"{self.base_url}/api/shop/buy", json=data) as response:
                return await response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

# 실행 예시
if __name__ == "__main__":
    test = ShopConcurrencyTest()
    asyncio.run(test.test_concurrent_purchases(50))
```

### 4. 자동화 실행 스크립트

#### A. 통합 테스트 실행 스크립트 (`scripts/run_shop_tests.sh`)

```bash
#!/bin/bash

echo "=== 상점 시스템 통합 테스트 실행 ==="

# 1. pytest 단위/통합 테스트
echo "1. pytest 테스트 실행..."
python -m pytest tests/test_shop_*.py -v --tb=short

# 2. E2E 테스트 (Playwright)
echo "2. Playwright E2E 테스트 실행..."
npx playwright test tests/e2e/shop_*.spec.ts

# 3. 성능 테스트
echo "3. 성능 테스트 실행..."
python tests/performance/shop_concurrency_test.py

# 4. 커스텀 통합 테스트
echo "4. 커스텀 통합 테스트 실행..."
python test_shop_comprehensive.py

echo "=== 모든 테스트 완료 ==="
```

#### B. CI/CD 파이프라인 설정 (`.github/workflows/shop_tests.yml`)

```yaml
name: Shop System Tests

on:
  push:
    paths:
      - 'cc-webapp/backend/app/routers/shop.py'
      - 'cc-webapp/backend/app/services/shop_service.py'
      - 'cc-webapp/backend/app/models/shop_models.py'
  pull_request:
    paths:
      - 'cc-webapp/backend/app/routers/shop.py'
      - 'cc-webapp/backend/app/services/shop_service.py'
      - 'cc-webapp/backend/app/models/shop_models.py'

jobs:
  shop-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: cc_password
          POSTGRES_USER: cc_user
          POSTGRES_DB: cc_webapp
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-asyncio
    
    - name: Run Shop Integration Tests
      run: |
        python -m pytest tests/test_shop_integration.py -v
    
    - name: Run Shop Admin Tests
      run: |
        python -m pytest tests/test_shop_admin.py -v
    
    - name: Setup Node.js for E2E
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Playwright
      run: |
        npm install @playwright/test
        npx playwright install
    
    - name: Run E2E Tests
      run: |
        npx playwright test tests/e2e/shop_*.spec.ts
```

## 🎯 구현 우선순위

### Phase 1: 즉시 구현 (High Priority)
1. **pytest 통합 테스트**: 기존 테스트 구조에 맞춰 추가
2. **기본 E2E 플로우**: Playwright로 UI 레벨 검증
3. **관리자 CRUD 테스트**: 기존 admin_shop_crud.spec.ts 확장

### Phase 2: 중기 구현 (Medium Priority)
1. **동시성 테스트**: 멱등성 검증 강화
2. **성능 벤치마크**: 부하 테스트 및 병목 지점 식별
3. **실시간 동기화**: WebSocket 이벤트 검증

### Phase 3: 장기 구현 (Long-term)
1. **완전 자동화 파이프라인**: CI/CD 통합
2. **모니터링 대시보드**: 테스트 결과 시각화
3. **A/B 테스트 프레임워크**: 상점 기능 실험

## 📈 성공 지표

- **테스트 커버리지**: 90% 이상
- **E2E 성공률**: 95% 이상  
- **성능 기준**: 100 RPS 이상 처리
- **응답 시간**: 평균 200ms 이하
- **동시성 정확성**: 멱등성 100% 보장

이 가이드를 통해 상점 시스템의 테스트 자동화를 체계적으로 확장할 수 있습니다.