# Casino-Club F2P 헬스체크 도구 사용 가이드

이 레포지토리에는 PowerShell 명령어 구문 오류 문제를 해결하기 위한 여러 헬스체크 도구가 포함되어 있습니다.

## 🚨 기존 문제

기존에 사용하던 복잡한 PowerShell 명령어:
```powershell
powershell -NoProfile -Command "$e1=(Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/health).StatusCode; Write-Host \"backend:/health=$e1\"; $e2=(Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/healthz).StatusCode; Write-Host \"frontend:/healthz=$e2\""
```

이 명령어는 다음과 같은 문제들이 있었습니다:
- 복잡한 이스케이프 문자로 인한 구문 오류
- 긴 명령어로 인한 가독성 문제
- 오류 처리 부족
- 플랫폼 호환성 문제

## ✅ 해결책

### 1. 빠른 헬스체크 (PowerShell)
원래 명령어와 유사한 간단한 출력:
```powershell
.\quick-health.ps1
```

자세한 정보와 함께:
```powershell
.\quick-health.ps1 -Verbose
```

### 2. 상세 헬스체크 (PowerShell)
완전한 기능을 가진 헬스체크 도구:
```powershell
.\health-check.ps1
```

사용자 정의 URL로:
```powershell
.\health-check.ps1 -Backend "http://localhost:8000" -Frontend "http://localhost:3000"
```

### 3. 크로스 플랫폼 헬스체크 (Bash)
Linux/macOS 또는 PowerShell이 없는 환경에서:
```bash
./health-check.sh
```

환경 변수로 설정:
```bash
BACKEND_URL=http://api.example.com ./health-check.sh
```

## 🔧 기능

### 공통 기능
- ✅ HTTP 상태 코드 확인
- ✅ 오류 처리 및 타임아웃 관리
- ✅ 색상 출력으로 가독성 향상
- ✅ Docker 컨테이너 상태 확인
- ✅ 문제 해결 가이드 제공

### PowerShell 도구 (`health-check.ps1`)
- ✅ JSON 응답 파싱 및 표시
- ✅ 매개변수 지원
- ✅ 도움말 기능
- ✅ 상세한 오류 메시지

### Bash 도구 (`health-check.sh`)
- ✅ 크로스 플랫폼 호환성
- ✅ JSON 파싱 (jq 사용)
- ✅ 명령행 옵션 지원
- ✅ 환경 변수 지원

### 빠른 도구 (`quick-health.ps1`)
- ✅ 원래 명령어와 유사한 출력 형식
- ✅ 간단하고 빠른 실행
- ✅ Verbose 모드 지원

## 📖 사용 예제

### 기본 사용
```powershell
# 가장 간단한 방법
.\quick-health.ps1

# 출력 예:
# backend=/health=200
# frontend=/health=200
```

### 상세 분석
```powershell
# 상세한 정보와 함께
.\health-check.ps1

# 출력 예:
# 🎰 Casino-Club F2P 헬스체크 도구
# ==================================================
# 실행 시간: 2025-09-02 13:31:06
# 
# 🔍 Backend API 서비스 확인 중...
#    URL: http://localhost:8000/health
# ✅ Backend API: 정상 (HTTP 200)
#    상태: healthy
#    버전: 1.0.0
#    Redis: 연결됨
# ...
```

### 문제 해결
서비스에 문제가 있는 경우, 도구들이 자동으로 문제 해결 가이드를 제공합니다:

```
🔧 문제 해결 가이드:
• 백엔드 문제:
  - 컨테이너 로그 확인: docker compose logs backend
  - 데이터베이스 연결 확인: docker compose logs postgres
  - 백엔드 재시작: docker compose restart backend
```

## 🎯 권장 사항

1. **일상적인 확인**: `.\quick-health.ps1` 사용
2. **문제 진단**: `.\health-check.ps1` 사용  
3. **Linux/macOS**: `./health-check.sh` 사용
4. **CI/CD 파이프라인**: `./health-check.sh` 스크립트 형태로 통합

## 🔄 마이그레이션

기존 복잡한 PowerShell 명령어를 사용하던 곳에서는:

**Before:**
```powershell
powershell -NoProfile -Command "$e1=(Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/health).StatusCode; Write-Host \"backend:/health=$e1\"; $e2=(Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/healthz).StatusCode; Write-Host \"frontend:/healthz=$e2\""
```

**After:**
```powershell
.\quick-health.ps1
```

이렇게 하면 구문 오류 없이 동일한 기능을 더 안정적으로 사용할 수 있습니다.