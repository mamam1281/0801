# 📋 파일 정리 계획서

## 🔍 분석 대상 파일들

### 📁 루트 디렉토리 파일들
1. **run_server.py** - 백엔드 서버 실행 스크립트
2. **verify_api_integration.py** - API 통합 검증 스크립트  
3. **update_database_config.py** - 데이터베이스 설정 업데이트

### 📁 백엔드 디렉토리 파일들
4. **add_game_tables.py** - 게임 테이블 생성 (PostgreSQL)
5. **add_prize_roulette_tables.py** - 룰렛 게임 테이블 생성
6. **add_rank_column.py** - rank 컬럼 추가 (SQLite 전용)

## 📊 분석 결과

### ✅ 계속 사용할 파일들

#### 1. run_server.py 
- **현재 상태**: 루트 디렉토리
- **평가**: 유용한 개발 도구
- **조치**: `scripts/` 폴더로 이동 + 최신화 필요
- **이유**: PostgreSQL 연결, 최신 Docker 환경 반영 필요

#### 2. add_game_tables.py
- **현재 상태**: 백엔드 디렉토리  
- **평가**: 현재 Repository 패턴에 필요
- **조치**: `database/migrations/` 폴더로 이동 + 최신화
- **이유**: 게임 관련 테이블이 Repository 패턴에서 필요

#### 3. add_prize_roulette_tables.py
- **현재 상태**: 백엔드 디렉토리
- **평가**: 프론트엔드 룰렛 컴포넌트와 연동 필요
- **조치**: `database/migrations/` 폴더로 이동 + 최신화
- **이유**: 룰렛 게임 기능 구현에 필수

### 🗃️ 아카이브할 파일들

#### 4. verify_api_integration.py
- **현재 상태**: 루트 디렉토리
- **평가**: 과거 auth 시스템 검증용, 현재 불필요
- **조치**: `archive/scripts/` 폴더로 이동
- **이유**: 현재 Repository 패턴으로 구조 변경됨

#### 5. update_database_config.py  
- **현재 상태**: 루트 디렉토리
- **평가**: 일회성 마이그레이션 스크립트
- **조치**: `archive/migrations/` 폴더로 이동
- **이유**: 이미 PostgreSQL 전환 완료

#### 6. add_rank_column.py
- **현재 상태**: 백엔드 디렉토리
- **평가**: SQLite 전용, PostgreSQL에서 불필요
- **조치**: `archive/sqlite_legacy/` 폴더로 이동
- **이유**: PostgreSQL에서는 이미 rank 컬럼 존재

## 🎯 실행 계획

### Phase 1: 디렉토리 구조 생성
```
scripts/                    # 개발 도구
database/
  migrations/               # 활성 마이그레이션
archive/
  scripts/                  # 레거시 스크립트
  migrations/               # 완료된 마이그레이션  
  sqlite_legacy/            # SQLite 시대 파일들
```

### Phase 2: 파일 이동 및 업데이트
1. **run_server.py** → `scripts/run_server.py` + Docker 호환성 업데이트
2. **add_game_tables.py** → `database/migrations/` + Repository 패턴 호환
3. **add_prize_roulette_tables.py** → `database/migrations/` + 최신 스키마 반영

### Phase 3: 아카이브 처리
1. **verify_api_integration.py** → `archive/scripts/`
2. **update_database_config.py** → `archive/migrations/`  
3. **add_rank_column.py** → `archive/sqlite_legacy/`

### Phase 4: 최신화 작업
- PostgreSQL + Docker 환경 반영
- Repository 패턴 통합
- 현재 프로젝트 구조에 맞는 수정

## 💡 최종 목표

✅ **정리된 프로젝트 구조**
- 현재 사용하는 파일들은 적절한 위치에 배치
- 레거시 파일들은 체계적으로 아카이브
- 모든 스크립트가 현재 환경에서 정상 작동

✅ **개발 효율성 향상**  
- 필요한 도구들은 쉽게 접근 가능
- 불필요한 파일로 인한 혼란 제거
- 명확한 디렉토리 구조

---
*Repository 패턴 구축과 연계하여 체계적인 프로젝트 정리 수행*
