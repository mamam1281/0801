# 라우팅 시스템 통일 스크립트
# 목적: Next.js 프로젝트의 App Router와 Pages Router 충돌 해결

# PowerShell 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 1. 환경 설정
$projectRoot = "c:\Users\bdbd\0000\cc-webapp\frontend"
$backupDir = "$projectRoot\backup-pages-router"
$reportPath = "c:\Users\bdbd\0000\FRONTEND_ANALYSIS_REPORT.md"

# 2. Pages Router 파일 백업 및 삭제 확인
Write-Host "1. Pages Router 파일 백업 및 삭제 상태 확인..." -ForegroundColor Cyan

if (Test-Path "$projectRoot\pages") {
    Write-Host "   - 경고: pages 디렉토리가 아직 존재합니다. 다시 삭제합니다." -ForegroundColor Yellow
    # 백업 확인
    if (-not (Test-Path $backupDir)) {
        New-Item -Path $backupDir -ItemType Directory | Out-Null
        Write-Host "   - 백업 디렉토리 생성됨: $backupDir" -ForegroundColor Green
    }
    
    # 백업 복사
    Copy-Item -Path "$projectRoot\pages\*" -Destination $backupDir -Recurse -Force
    Write-Host "   - pages 디렉토리 내용이 백업됨" -ForegroundColor Green
    
    # pages 디렉토리 삭제
    Remove-Item -Path "$projectRoot\pages" -Recurse -Force
    Write-Host "   - pages 디렉토리가 성공적으로 제거됨" -ForegroundColor Green
} else {
    Write-Host "   - 확인: pages 디렉토리가 이미 제거되었습니다." -ForegroundColor Green
}

# 3. App Router 구성 확인
Write-Host "2. App Router 구성 확인..." -ForegroundColor Cyan

if (Test-Path "$projectRoot\app\layout.tsx") {
    Write-Host "   - 확인: app/layout.tsx 파일이 존재합니다." -ForegroundColor Green
} else {
    Write-Host "   - 경고: app/layout.tsx 파일이 없습니다!" -ForegroundColor Red
}

if (Test-Path "$projectRoot\app\page.tsx") {
    Write-Host "   - 확인: app/page.tsx 파일이 존재합니다." -ForegroundColor Green
} else {
    Write-Host "   - 경고: app/page.tsx 파일이 없습니다!" -ForegroundColor Red
}

# 4. 백업 파일 정리
Write-Host "3. 백업 파일 정리..." -ForegroundColor Cyan
$backupFiles = Get-ChildItem -Path $projectRoot -Include "*.bak" -Recurse
if ($backupFiles.Count -gt 0) {
    Write-Host "   - 발견된 .bak 파일 수: $($backupFiles.Count)" -ForegroundColor Yellow
    Write-Host "   - 해당 파일들은 나중에 정리해야 합니다." -ForegroundColor Yellow
} else {
    Write-Host "   - .bak 파일이 발견되지 않았습니다." -ForegroundColor Green
}

# 5. 최종 확인
Write-Host "`n라우팅 시스템 통일 완료!" -ForegroundColor Green
Write-Host "Next.js App Router가 이제 유일한 라우팅 시스템입니다." -ForegroundColor Green
Write-Host "이 변경 사항은 앱의 성능을 향상시키고 혼란을 줄이는 데 도움이 됩니다." -ForegroundColor Green
