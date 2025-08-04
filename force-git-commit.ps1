#!/usr/bin/env pwsh
# Casino-Club F2P - Force Git Commit Script
# Created: 2025-08-04

Write-Host "🚀 강제 Git 커밋 스크립트 시작..." -ForegroundColor Cyan

# 현재 디렉토리
$repoRoot = "c:\Users\bdbd\0000"

# 새 파일 및 모든 변경사항 추가
Write-Host "`n1️⃣ 모든 파일 추적 및 변경사항 스테이징 중..." -ForegroundColor Yellow
git add -A

# 커밋 메시지 생성
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$commitMessage = "feat: Integrate frontend code with complete functionality and design (#$timestamp)"

# 커밋 실행
Write-Host "`n2️⃣ 변경사항 커밋 중..." -ForegroundColor Yellow
Write-Host "커밋 메시지: $commitMessage" -ForegroundColor White
git commit -m $commitMessage

# 원격 저장소로 푸시 (선택 사항)
Write-Host "`n3️⃣ 원격 저장소로 푸시하시겠습니까? (Y/N)" -ForegroundColor Yellow
$pushResponse = Read-Host
if ($pushResponse -eq "Y" -or $pushResponse -eq "y") {
    Write-Host "원격 저장소로 푸시 중..." -ForegroundColor Yellow
    git push origin main
    Write-Host "푸시 완료!" -ForegroundColor Green
}

Write-Host "`n✅ Git 작업 완료!" -ForegroundColor Green
