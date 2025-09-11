# 🛠️ Casino-Club F2P 어드민 시스템 기술 가이드

## 📋 목차
1. [사용자 관리 CRUD](#사용자-관리-crud)
2. [골드 관리 CRUD](#골드-관리-crud)
3. [API 명세서](#api-명세서)
4. [프론트엔드 컴포넌트](#프론트엔드-컴포넌트)
5. [데이터베이스 스키마](#데이터베이스-스키마)
6. [보안 및 권한](#보안-및-권한)
7. [테스트 가이드](#테스트-가이드)

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
- **기능**: 목록조회, 상세보기, 생성, 수정, 삭제, 검색, 페이징

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
- **기능**: 골드 지급, 멱등성 처리, 영수증 코드 발급

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
```

### **AdminPointsPage.tsx**
```typescript
// 위치: app/admin/points/page.tsx
// 기능: 골드 지급 전용 페이지
// 주요 상태:
- userId: string // 대상 사용자 ID
- amount: string // 지급 수량
- memo: string // 지급 사유
- isSubmitting: boolean // 제출 중 상태
```

### **AdminDashboard.tsx**
```typescript
// 위치: components/AdminDashboard.tsx
// 기능: 어드민 메인 대시보드
// 네비게이션:
- 사용자 관리 버튼 → /admin/users
- 골드 관리 버튼 → /admin/points
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
✅ 사용자 정보 수정
✅ 사용자 삭제
✅ 페이징 기능
```

#### 골드 관리 테스트
```bash
✅ 골드 지급 페이지 접근
✅ 사용자 ID 입력 검증
✅ 골드 수량 입력 검증
✅ 골드 지급 실행
✅ 영수증 코드 확인
✅ 사용자 잔액 업데이트 확인
✅ 멱등성 키 중복 방지
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
- ✅ 골드 지급 CRUD 완전 구현
- ✅ 데이터베이스 스키마 동기화 완료
- ✅ 프론트엔드 UI 완전 작동
- ✅ 보안 및 권한 시스템 구현
- ✅ 멱등성 및 감사 로그 시스템

---

**📅 마지막 업데이트**: 2025-09-11
**🎯 상태**: 완료 - 사용자 및 골드 관리 시스템 완전 구현
