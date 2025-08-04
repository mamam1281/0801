# Backend API 중복태그 삭제처리 계획

## 🎯 Phase 1: 백엔드 API 연동상황 (중복태그 삭제처리)

### 현재 상황 분석
- 중복 라우터 등록: `ai_router` 2회 등록
- 파일 버전 혼재: `.broken`, `.clean`, `.simple` 파일들 
- Progressive Expansion 중복: Phase 1-10 별도 등록

### 1단계: 파일 버전 정리
#### 삭제 대상 파일들:
```
routers/admin.py.broken
routers/auth.py.broken  
routers/games.py.broken
routers/users.py.broken
routers/users.py.backup.20250803_101131
```

#### 검토 후 통합할 파일들:
```
main_clean.py vs main.py
main_simple.py vs main.py
routers/admin_clean.py vs routers/admin.py
routers/auth_clean.py vs routers/auth.py
routers/games_clean.py vs routers/games.py
routers/admin_simple.py vs routers/admin.py
```

### 2단계: main.py 중복 제거
#### 중복 라우터 등록 수정:
- `ai_router` 두 번 등록됨 (line 42, 175)
- `quiz.router` vs `quiz_router.router` 중복
- `chat.router` vs `chat_router.router` 중복

#### Progressive Expansion 정리:
- Phase 1-10 별도 등록을 core registration으로 통합

### 3단계: Import 정리
#### 중복 import 제거:
- 같은 모듈이 여러 번 import되는 경우들 정리
- 사용하지 않는 import들 제거

### 4단계: Docker 환경에서 테스트
- `docker-compose up backend` 실행
- API 엔드포인트 동작 확인
- Swagger UI `/docs` 접속 확인

### 5단계: API 문서화 업데이트
- 정리된 엔드포인트들 문서화
- 중복 제거 후 실제 활성화된 API 목록 작성

## 예상 결과
- 깔끔한 라우터 구조
- 중복 없는 API 엔드포인트
- 명확한 파일 구조
- Docker 환경에서 안정적 실행
