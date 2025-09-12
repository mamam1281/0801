# 🛠️ Casino-Club F2P 어드민 시스템 기술 가이드

## 📋 목차
1. [사용자 관리 CRUD](#사용자-관리-crud)
2. [골드 관리 CRUD](#골드-관리-crud)
3. [상점 관리 CRUD (구현 예정)](#상점-관리-crud-구현-예정)
4. [이벤트 관리 CRUD (구현 예정)](#이벤트-관리-crud-구현-예정)
5. [통계 관리 시스템 (구현 예정)](#통계-관리-시스템-구현-예정)
6. [전체 개발 로드맵](#전체-개발-로드맵)
7. [API 명세서](#api-명세서)
8. [프론트엔드 컴포넌트](#프론트엔드-컴포넌트)
9. [데이터베이스 스키마](#데이터베이스-스키마)
10. [보안 및 권한](#보안-및-권한)
11. [테스트 가이드](#테스트-가이드)

---

## 🔐 사용자 관리 CRUD

### ✅ 완료된 기능

#### **CREATE (사용자 생성)**
```bash
POST /api/admin/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "site_id": "newuser123",
  "nickname": "새사용자",
  "phone_number": "01012345678",
  "password": "password123",
  "invite_code": "5858"
}
```

#### **READ (사용자 조회)**
```bash
# 사용자 목록 조회
GET /api/admin/users?limit=20&skip=0&search=user001
Authorization: Bearer {admin_token}

# 개별 사용자 상세 조회
GET /api/admin/users/{user_id}
Authorization: Bearer {admin_token}
```

#### **UPDATE (사용자 수정)**
```bash
PUT /api/admin/users/{user_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "nickname": "수정된닉네임",
  "user_rank": "VIP",
  "is_active": true,
  "is_admin": false
}
```

#### **DELETE (사용자 삭제)**
```bash
DELETE /api/admin/users/{user_id}
Authorization: Bearer {admin_token}
```

### 🎯 프론트엔드 접근
- **경로**: http://localhost:3000/admin/users
- **컴포넌트**: `components/admin/UsersManager.tsx`
- **기능**: 목록조회, 상세보기, 생성, 수정, 삭제, 검색, 페이징, 닉네임 수정, 등급 수정

---

## 💰 골드 관리 CRUD

### ✅ 완료된 기능

#### **CREATE (골드 지급)**
```bash
POST /api/admin/users/{user_id}/gold/grant
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "amount": 1000,
  "reason": "웰컴 보너스",
  "idempotency_key": "unique-key-123"
}
```

#### **READ (골드 잔액 조회)**
```bash
# 사용자 골드 잔액 조회 (사용자 상세에 포함)
GET /api/admin/users/{user_id}
Authorization: Bearer {admin_token}

# 응답에서 cyber_token_balance 필드 확인
```

#### **UPDATE (골드 지급/차감)**
- 지급: 위의 gold/grant API 사용
- 차감: 음수 amount로 지급 (필요시 별도 API 구현 예정)

#### **DELETE (골드 내역 삭제)**
- 현재 직접 삭제 기능 없음 (감사 로그 유지 정책)
- 사용자 삭제 시 관련 골드 내역도 연쇄 삭제

### 🎯 프론트엔드 접근
- **경로**: http://localhost:3000/admin/points
- **컴포넌트**: `app/admin/points/page.tsx`
- **기능**: 골드 지급, 멱등성 처리, 영수증 코드 발급, 전역동기화 연동

---

## 📡 API 명세서

### 🔑 인증
```bash
# 어드민 로그인
POST /api/auth/admin/login
Content-Type: application/json

{
  "site_id": "admin",
  "password": "123456"
}

# 응답
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "site_id": "admin",
    "is_admin": true
  }
}
```

### 👥 사용자 관리 API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|-------|------------|------|------|
| GET | `/api/admin/users` | 사용자 목록 조회 | 어드민 |
| GET | `/api/admin/users/{user_id}` | 사용자 상세 조회 | 어드민 |
| POST | `/api/admin/users` | 사용자 생성 | 어드민 |
| PUT | `/api/admin/users/{user_id}` | 사용자 수정 | 어드민 |
| DELETE | `/api/admin/users/{user_id}` | 사용자 삭제 | 어드민 |

### 💰 골드 관리 API

| 메서드 | 엔드포인트 | 설명 | 권한 |
|-------|------------|------|------|
| POST | `/api/admin/users/{user_id}/gold/grant` | 골드 지급 | 어드민 |

---

## 🎨 프론트엔드 컴포넌트

### **UsersManager.tsx**
```typescript
// 위치: components/admin/UsersManager.tsx
// 기능: 사용자 CRUD 전체 기능
// 주요 상태:
- items: UserSummary[] // 사용자 목록
- selected: UserDetail | null // 선택된 사용자
- search: string // 검색어
- loading: boolean // 로딩 상태
- nicknameInput: string // 닉네임 수정 입력
- rankInput: string // 등급 수정 입력
// 새 기능:
- updateNickname() // 닉네임 수정 함수
- updateRank() // 등급 수정 함수
```

### **AdminPointsPage.tsx**
```typescript
// 위치: app/admin/points/page.tsx
// 기능: 골드 지급 전용 페이지 (명칭 통일: 포인트→골드)
// 주요 상태:
- userId: string // 대상 사용자 ID
- amount: string // 지급 수량
- memo: string // 지급 사유
- isSubmitting: boolean // 제출 중 상태
// 개선사항:
- 디버깅 로그 추가
- withReconcile을 통한 전역동기화 연동
- 골드 명칭 통일 완료
```

### **AdminDashboard.tsx**
```typescript
// 위치: components/AdminDashboard.tsx
// 기능: 어드민 메인 대시보드 (명칭 통일 완료)
// 네비게이션:
- 사용자 관리 버튼 → /admin/users
- 골드 관리 버튼 → /admin/points (포인트→골드 명칭 변경)
```

---

## 🗄️ 데이터베이스 스키마

### **users 테이블**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    cyber_token_balance INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
```

### **security_events 테이블** (수정 완료)
```sql
CREATE TABLE security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_suspicious BOOLEAN DEFAULT FALSE
);
```

### **admin_audit_logs 테이블**
```sql
CREATE TABLE admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    target_user_id INTEGER REFERENCES users(id),
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔒 보안 및 권한

### **JWT 토큰 기반 인증**
- 어드민 로그인 시 JWT 토큰 발급
- 모든 어드민 API 요청 시 Bearer 토큰 필요
- 토큰에 `is_admin: true` 클레임 포함

### **권한 검사**
```python
# 백엔드 권한 데코레이터
@router.get("/admin/users")
async def get_users(current_user: User = Depends(get_current_admin_user)):
    # is_admin=True 사용자만 접근 가능
    pass
```

### **프론트엔드 가드**
```typescript
// 비관리자 접근 차단
{authChecked && !me?.is_admin && (
    <div className="admin-guard-banner">
        관리자 전용 페이지입니다. 접근 권한이 없습니다.
    </div>
)}
```

### **멱등성 처리**
- 골드 지급 시 `idempotency_key` 사용
- Redis를 통한 중복 요청 방지
- 영수증 코드로 지급 내역 추적

---

## 🧪 테스트 가이드

### **수동 테스트 체크리스트**

#### 사용자 관리 테스트
```bash
✅ 어드민 로그인 (admin / 123456)
✅ 사용자 목록 조회
✅ 사용자 검색 기능
✅ 새 사용자 생성
✅ 사용자 정보 수정 (닉네임, 등급)
✅ 사용자 삭제
✅ 페이징 기능
✅ 닉네임 실시간 수정
✅ 등급 실시간 수정
```

#### 골드 관리 테스트
```bash
✅ 골드 지급 페이지 접근
✅ 사용자 ID 입력 검증 (숫자 ID와 site_id 모두 지원)
✅ 골드 수량 입력 검증
✅ 골드 지급 실행
✅ 영수증 코드 확인
✅ 사용자 잔액 업데이트 확인
✅ 멱등성 키 중복 방지
✅ site_id 검색 문제 해결 완료
✅ 프로덕션 준비 완료 (디버깅 로그 정리)
```

### **API 테스트 스크립트**
```powershell
# 사용자 CRUD 전체 테스트
.\admin-crud-test.ps1

# 골드 지급 테스트
.\gold-grant-test.ps1
```

### **자동화 테스트**
```bash
# 백엔드 테스트
docker-compose exec backend pytest app/tests/test_admin_*.py -v

# 프론트엔드 E2E 테스트
npm run test:e2e -- --grep "admin"
```

---

## 🔧 트러블슈팅

### **자주 발생하는 문제**

#### 1. "security_events.event_data does not exist" 오류
**해결책**: 데이터베이스 스키마 업데이트
```sql
ALTER TABLE security_events 
ADD COLUMN IF NOT EXISTS event_data TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE;
```

#### 2. 골드 지급 실패
**원인**: 잘못된 사용자 ID 또는 권한 부족
**해결책**: 
- 사용자 ID 존재 여부 확인
- 어드민 토큰 유효성 확인
- 네트워크 연결 상태 확인

#### 3. 프론트엔드 접근 권한 오류
**원인**: 비관리자 계정으로 접근
**해결책**: admin 계정으로 로그인 후 접근

---

## 📊 사용 현황

### **기본 계정 정보**
- **관리자**: admin / 123456
- **테스트 유저**: user001~004 / 123455

### **접속 경로**
- **어드민 대시보드**: http://localhost:3000/admin
- **사용자 관리**: http://localhost:3000/admin (사용자 관리 버튼)
- **골드 관리**: http://localhost:3000/admin/points

### **현재 상태**
- ✅ 사용자 CRUD 완전 구현
- ✅ 골드 지급 CRUD 완전 구현 (site_id 지원 포함)
- ✅ 데이터베이스 스키마 동기화 완료
- ✅ 프론트엔드 UI 완전 작동
- ✅ 보안 및 권한 시스템 구현
- ✅ 멱등성 및 감사 로그 시스템
- ✅ 닉네임 수정 기능 추가
- ✅ 등급 수정 기능 추가
- ✅ site_id 검색 문제 해결 완료
- ✅ 프로덕션 준비 완료 (디버깅 로그 정리)
- � 상점 관리 시스템 (미구현)
- 🚧 이벤트 관리 시스템 (미구현)
- 🚧 통계 관리 시스템 (미구현)

---

## 🏪 상점 관리 CRUD (구현 예정)

### **📋 기능 요구사항**

#### **상품 관리**
- 상품 생성/수정/삭제
- 상품 카테고리 관리 (코인팩, 아이템, 한정상품)
- 가격 설정 (일반가, 할인가, VIP가)
- 상품 활성화/비활성화
- 재고 관리 (무제한/제한)

#### **한정 상품 관리**
- 시간 제한 상품 (시작/종료 시간)
- 수량 제한 상품
- VIP 전용 상품
- 일일/주간 한정 상품

#### **할인 및 프로모션**
- 퍼센트 할인
- 고정 금액 할인
- N+1 이벤트
- 첫구매 보너스

### **🎯 구현 계획**

#### **Phase 1: 기본 상품 CRUD**
```typescript
// 백엔드 API 설계
POST /api/admin/shop/products     // 상품 생성
GET  /api/admin/shop/products     // 상품 목록
GET  /api/admin/shop/products/{id} // 상품 상세
PUT  /api/admin/shop/products/{id} // 상품 수정
DELETE /api/admin/shop/products/{id} // 상품 삭제
```

#### **Phase 2: 프론트엔드 UI**
```typescript
// 컴포넌트 구조
components/admin/shop/
├── ProductsManager.tsx      // 상품 목록 관리
├── ProductForm.tsx          // 상품 생성/수정 폼
├── CategoryManager.tsx      // 카테고리 관리
└── PriceEditor.tsx         // 가격 설정 UI
```

#### **Phase 3: 고급 기능**
- 대량 가격 수정
- 상품 복사 기능
- 판매 통계 연동
- 이미지 업로드

---

## 🎊 이벤트 관리 CRUD (구현 예정)

### **📋 기능 요구사항**

#### **이벤트 생성**
- 이벤트 타입 (로그인 보너스, 미션 이벤트, 가챠 이벤트)
- 기간 설정 (시작/종료 시간)
- 대상 사용자 (전체/VIP/신규)
- 보상 설정

#### **미션 이벤트**
- 일일 미션
- 누적 미션
- 단계별 보상
- 진행률 추적

#### **특별 이벤트**
- 더블 골드 이벤트
- 무료 가챠 이벤트
- 한정 시간 할인

### **🎯 구현 계획**

#### **Phase 1: 이벤트 기본 CRUD**
```typescript
// 백엔드 API 설계
POST /api/admin/events        // 이벤트 생성
GET  /api/admin/events        // 이벤트 목록
PUT  /api/admin/events/{id}   // 이벤트 수정
DELETE /api/admin/events/{id} // 이벤트 삭제
POST /api/admin/events/{id}/activate // 이벤트 활성화
```

#### **Phase 2: 미션 시스템**
```typescript
// 미션 관리 API
POST /api/admin/missions      // 미션 생성
GET  /api/admin/missions      // 미션 목록
GET  /api/admin/missions/{id}/progress // 진행률 조회
```

#### **Phase 3: 자동화 시스템**
- 스케줄러 연동
- 자동 시작/종료
- 알림 발송
- 성과 분석

---

## 📊 통계 관리 시스템 (구현 예정)

### **📋 기능 요구사항**

#### **사용자 통계**
- 일간/주간/월간 활성 사용자
- 신규 가입자 추이
- 이탈률 분석
- 등급별 분포

#### **매출 통계**
- 일매출/월매출
- 상품별 판매량
- ARPU/ARPPU
- 결제 수단별 분석

#### **게임 통계**
- 플레이 시간
- 게임별 인기도
- 승률 통계
- 골드 사용 패턴

### **🎯 구현 계획**

#### **Phase 1: 기본 대시보드**
```typescript
// 통계 API 설계
GET /api/admin/stats/users    // 사용자 통계
GET /api/admin/stats/revenue  // 매출 통계
GET /api/admin/stats/games    // 게임 통계
```

#### **Phase 2: 시각화**
```typescript
// 차트 컴포넌트
components/admin/stats/
├── UserStatsChart.tsx       // 사용자 통계 차트
├── RevenueChart.tsx         // 매출 차트
├── GameStatsChart.tsx       // 게임 통계 차트
└── StatsDashboard.tsx       // 통합 대시보드
```

#### **Phase 3: 고급 분석**
- 코호트 분석
- 리텐션 분석
- A/B 테스트 결과
- 예측 모델링

---

## 🗺️ 전체 개발 로드맵

### **🎯 Phase 1: 상점 관리 시스템 (우선순위: 높음)**
**예상 소요시간**: 1-2주

#### **Week 1: 백엔드 구현**
1. **데이터베이스 설계**
   ```sql
   -- 상품 테이블
   CREATE TABLE shop_products (
       id SERIAL PRIMARY KEY,
       name VARCHAR(200) NOT NULL,
       description TEXT,
       category VARCHAR(50),
       price_regular INTEGER NOT NULL,
       price_vip INTEGER,
       is_active BOOLEAN DEFAULT TRUE,
       stock_limit INTEGER, -- NULL = 무제한
       created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- 구매 내역 테이블  
   CREATE TABLE shop_purchases (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id),
       product_id INTEGER REFERENCES shop_products(id),
       amount_paid INTEGER,
       created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **API 엔드포인트 구현**
   - `app/routers/admin_shop.py` 생성
   - CRUD 로직 구현
   - 권한 검사 추가

#### **Week 2: 프론트엔드 구현**
1. **컴포넌트 개발**
   - 상품 목록 UI
   - 상품 생성/수정 폼
   - 카테고리 관리

2. **페이지 연동**
   - `/admin/shop` 페이지 생성
   - 네비게이션 메뉴 추가

### **🎯 Phase 2: 이벤트 관리 시스템 (우선순위: 중간)**
**예상 소요시간**: 2-3주

#### **Week 1-2: 기본 이벤트 시스템**
1. **데이터베이스 설계**
   ```sql
   CREATE TABLE events (
       id SERIAL PRIMARY KEY,
       name VARCHAR(200) NOT NULL,
       event_type VARCHAR(50),
       start_time TIMESTAMP,
       end_time TIMESTAMP,
       is_active BOOLEAN DEFAULT FALSE,
       config JSONB -- 이벤트별 설정
   );
   ```

2. **API 구현**
   - 이벤트 CRUD
   - 활성화/비활성화
   - 스케줄링 연동

#### **Week 3: 미션 시스템**
1. **미션 테이블 설계**
2. **진행률 추적 시스템**
3. **보상 지급 자동화**

### **🎯 Phase 3: 통계 관리 시스템 (우선순위: 낮음)**
**예상 소요시간**: 2-3주

#### **Week 1: 데이터 수집**
1. **이벤트 로깅 시스템**
2. **집계 테이블 설계**
3. **배치 작업 스케줄러**

#### **Week 2-3: 대시보드 구현**
1. **차트 라이브러리 연동**
2. **실시간 데이터 업데이트**
3. **필터링 및 검색**

---

## 🚀 다음 단계 실행 가이드

### **즉시 시작 가능한 작업들**

#### **1. 상점 관리 시스템 킷 준비**
```bash
# 1. 데이터베이스 마이그레이션 생성
cd cc-webapp/backend
docker-compose exec backend alembic revision --autogenerate -m "add_shop_management_tables"

# 2. 백엔드 라우터 파일 생성
touch app/routers/admin_shop.py
touch app/services/shop_service.py
touch app/schemas/shop.py

# 3. 프론트엔드 컴포넌트 디렉토리 생성
mkdir -p cc-webapp/frontend/components/admin/shop
touch cc-webapp/frontend/components/admin/shop/ProductsManager.tsx
touch cc-webapp/frontend/app/admin/shop/page.tsx
```

#### **2. 기본 구조 생성**
```typescript
// 상품 스키마 정의
interface ShopProduct {
  id: number;
  name: string;
  description?: string;
  category: 'coins' | 'items' | 'limited';
  price_regular: number;
  price_vip?: number;
  is_active: boolean;
  stock_limit?: number;
  created_at: string;
}
```

#### **3. 개발 우선순위**
1. **최우선**: 상품 목록 조회/생성 (기본 CRUD)
2. **차순위**: 가격 설정 및 카테고리 관리
3. **향후**: 한정상품, 할인 시스템

### **효율적인 개발을 위한 팁**

#### **기존 코드 활용**
- 사용자 관리의 `UsersManager.tsx` 컴포넌트 구조 재사용
- 골드 지급의 API 호출 패턴 참고
- 동일한 인증/권한 시스템 활용

#### **점진적 개발**
- MVP(최소 기능) 먼저 구현
- 고급 기능은 단계적 추가
- 각 단계마다 테스트 및 검증

#### **문서화 습관**
- API 명세서 실시간 업데이트
- 컴포넌트 JSDoc 작성
- 데이터베이스 스키마 변경 기록

---

**� 마지막 업데이트**: 2025-09-13
**🎯 상태**: 기본 시스템 완료, 확장 시스템 구현 대기

### **최근 변경사항 (2025-09-13)**
- ✅ 골드 지급 site_id 검색 문제 완전 해결
- ✅ 프로덕션 준비 완료 (디버깅 로그 정리)
- ✅ 상점/이벤트/통계 관리 로드맵 추가
- 📋 다음 개발 우선순위: 상점 관리 시스템
- �️ 전체 개발 일정 및 가이드 수립
