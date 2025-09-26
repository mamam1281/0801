#!/usr/bin/env pwsh
# 단계별 시스템 복구 스크립트

param(
    [string]$Phase = "diagnose",
    [switch]$Force
)

Write-Host "🎯 Casino-Club F2P 전역동기화 복구 스크립트" -ForegroundColor Cyan
Write-Host "현재 Phase: $Phase" -ForegroundColor Yellow

function Test-SystemHealth {
    Write-Host "`n🔍 시스템 상태 진단..." -ForegroundColor Green
    
    # Docker 상태 체크
    $containers = docker-compose ps --format json | ConvertFrom-Json
    $healthyCount = ($containers | Where-Object { $_.State -eq "running" }).Count
    Write-Host "Docker 컨테이너: $healthyCount/9 실행중" -ForegroundColor White
    
    # API 헬스체크
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
        Write-Host "백엔드: ✅ $($health.status)" -ForegroundColor Green
    }
    catch {
        Write-Host "백엔드: ❌ 접근 불가" -ForegroundColor Red
    }
    
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        Write-Host "프론트엔드: ✅ 응답 코드 $($frontend.StatusCode)" -ForegroundColor Green
    }
    catch {
        Write-Host "프론트엔드: ❌ 접근 불가" -ForegroundColor Red
    }
}

function Start-Phase1-Isolation {
    Write-Host "`n🔬 Phase 1: 격리된 시스템 테스트" -ForegroundColor Green
    
    # 테스트 페이지 열기
    Start-Process "file:///$(Get-Location)/debug_system_isolation.html"
    
    Write-Host "✅ 격리 테스트 페이지가 열렸습니다." -ForegroundColor Green
    Write-Host "브라우저에서 다음을 순서대로 테스트하세요:" -ForegroundColor Yellow
    Write-Host "1. 상점 카탈로그 조회 (인증 불필요)" -ForegroundColor White
    Write-Host "2. 회원가입/로그인" -ForegroundColor White
    Write-Host "3. 잔액 조회" -ForegroundColor White
    Write-Host "4. 이벤트 목록" -ForegroundColor White
    Write-Host "5. 어드민 로그인 및 관리 기능" -ForegroundColor White
    
    Read-Host "`n각 테스트가 완료되면 Enter를 눌러주세요"
}

function Start-Phase2-Simplification {
    Write-Host "`n🔄 Phase 2: 동기화 단순화" -ForegroundColor Green
    
    Write-Host "WebSocket 이벤트 단순화 적용중..." -ForegroundColor Yellow
    
    # WebSocket 클라이언트 백업 및 단순화
    $wsClientPath = "cc-webapp/frontend/utils/wsClient.ts"
    if (Test-Path $wsClientPath) {
        Copy-Item $wsClientPath "$wsClientPath.backup" -Force
        Write-Host "✅ WebSocket 클라이언트 백업 완료" -ForegroundColor Green
    }
    
    # 동기화 간격 조정
    $syncHookPath = "cc-webapp/frontend/hooks/useGlobalSync.ts"
    if (Test-Path $syncHookPath) {
        Copy-Item $syncHookPath "$syncHookPath.backup" -Force
        Write-Host "✅ GlobalSync 훅 백업 완료" -ForegroundColor Green
    }
    
    Write-Host "🎯 다음 단계: 코드 수정 필요" -ForegroundColor Yellow
    Write-Host "1. WebSocket 이벤트 타입 축소 (3개만 유지)" -ForegroundColor White
    Write-Host "2. API 응답 형태 일관성 확보" -ForegroundColor White
    Write-Host "3. 동기화 간격 조정" -ForegroundColor White
}

function Start-Phase3-Integration {
    Write-Host "`n🔗 Phase 3: 통합 테스트" -ForegroundColor Green
    
    # E2E 테스트 실행
    Write-Host "E2E 테스트 실행중..." -ForegroundColor Yellow
    
    # 컨테이너 환경에서 Playwright 실행
    docker-compose -f docker-compose.yml -f docker-compose.playwright.yml up --build --exit-code-from playwright playwright
    
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host "✅ E2E 테스트 통과" -ForegroundColor Green
    }
    else {
        Write-Host "❌ E2E 테스트 실패 (코드: $exitCode)" -ForegroundColor Red
    }
}

function Show-RecommendedActions {
    Write-Host "`n💡 권장 다음 단계:" -ForegroundColor Cyan
    Write-Host "1. 격리 테스트에서 발견된 문제 해결" -ForegroundColor White
    Write-Host "2. 단순화 계획 (SYNC_SIMPLIFICATION_PLAN.md) 검토" -ForegroundColor White
    Write-Host "3. 코드 수정 후 점진적 통합" -ForegroundColor White
    Write-Host "4. 전역동기화_솔루션.md 체크리스트 재개" -ForegroundColor White
    
    Write-Host "`n🚀 실행 명령어:" -ForegroundColor Green
    Write-Host "Phase 1: .\debug-sync-recovery.ps1 -Phase isolation" -ForegroundColor Yellow
    Write-Host "Phase 2: .\debug-sync-recovery.ps1 -Phase simplification" -ForegroundColor Yellow  
    Write-Host "Phase 3: .\debug-sync-recovery.ps1 -Phase integration" -ForegroundColor Yellow
}

# 메인 실행 로직
switch ($Phase.ToLower()) {
    "diagnose" { 
        Test-SystemHealth
        Show-RecommendedActions
    }
    "isolation" { 
        Test-SystemHealth
        Start-Phase1-Isolation 
    }
    "simplification" { 
        Start-Phase2-Simplification 
    }
    "integration" { 
        Start-Phase3-Integration 
    }
    default { 
        Write-Host "❌ 알 수 없는 Phase: $Phase" -ForegroundColor Red
        Write-Host "사용 가능한 Phase: diagnose, isolation, simplification, integration" -ForegroundColor Yellow
        Show-RecommendedActions
    }
}

Write-Host "`n🎯 복구 스크립트 완료" -ForegroundColor Cyan