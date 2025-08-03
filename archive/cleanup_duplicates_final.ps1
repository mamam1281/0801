# 🧹 Casino-Club F2P: 최종 중복 파일 정리 스크립트
# 날짜: 2025-08-02
# 목적: bf130afe 병합 후 남은 중복 파일들 정리

Write-Host "🧹 Casino-Club F2P 중복 파일 정리 시작..." -ForegroundColor Cyan

# 1. .bak 파일들 정리
Write-Host "📁 .bak 파일들 삭제 중..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Recurse -Filter "*.bak" | ForEach-Object {
    Write-Host "🗑️  삭제: $($_.FullName)" -ForegroundColor Red
    Remove-Item $_.FullName -Force
}

# 2. 테스트용 .db 파일들 정리 (중요 DB는 보존)
Write-Host "📁 불필요한 .db 파일들 삭제 중..." -ForegroundColor Yellow
$testDbFiles = @(
    "test_*.db",
    "auth.db",
    "fallback.db"
)

foreach ($pattern in $testDbFiles) {
    Get-ChildItem -Path "." -Recurse -Filter $pattern | ForEach-Object {
        # 중요한 개발 DB는 제외
        if ($_.Name -ne "dev.db" -and $_.Directory.Name -ne "data") {
            Write-Host "🗑️  삭제: $($_.FullName)" -ForegroundColor Red
            Remove-Item $_.FullName -Force
        }
    }
}

# 3. 임시 파일들 정리
Write-Host "📁 임시 파일들 삭제 중..." -ForegroundColor Yellow
$tempPatterns = @(
    "*.tmp",
    "*.temp",
    "*_temp.*",
    "*_backup.*",
    "*.log"
)

foreach ($pattern in $tempPatterns) {
    Get-ChildItem -Path "." -Recurse -Filter $pattern | ForEach-Object {
        Write-Host "🗑️  삭제: $($_.FullName)" -ForegroundColor Red
        Remove-Item $_.FullName -Force
    }
}

# 4. 빈 디렉토리 정리
Write-Host "📁 빈 디렉토리 정리 중..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Recurse -Directory | Where-Object {
    (Get-ChildItem $_.FullName -Force | Measure-Object).Count -eq 0
} | ForEach-Object {
    Write-Host "🗑️  빈 디렉토리 삭제: $($_.FullName)" -ForegroundColor Red
    Remove-Item $_.FullName -Force
}

# 5. __pycache__ 디렉토리 정리
Write-Host "📁 Python 캐시 디렉토리 정리 중..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Recurse -Directory -Name "__pycache__" | ForEach-Object {
    $fullPath = Join-Path (Get-Location) $_
    Write-Host "🗑️  삭제: $fullPath" -ForegroundColor Red
    Remove-Item $fullPath -Recurse -Force
}

# 6. .pytest_cache 정리
Write-Host "📁 Pytest 캐시 정리 중..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Recurse -Directory -Name ".pytest_cache" | ForEach-Object {
    $fullPath = Join-Path (Get-Location) $_
    Write-Host "🗑️  삭제: $fullPath" -ForegroundColor Red
    Remove-Item $fullPath -Recurse -Force
}

# 7. Node.js 캐시 정리 (node_modules 제외)
Write-Host "📁 Node.js 캐시 정리 중..." -ForegroundColor Yellow
$nodePatterns = @(
    ".next",
    "dist",
    "build"
)

foreach ($pattern in $nodePatterns) {
    Get-ChildItem -Path "." -Recurse -Directory -Name $pattern | ForEach-Object {
        $fullPath = Join-Path (Get-Location) $_
        # node_modules 내부는 제외
        if ($fullPath -notlike "*node_modules*") {
            Write-Host "🗑️  삭제: $fullPath" -ForegroundColor Red
            Remove-Item $fullPath -Recurse -Force
        }
    }
}

Write-Host "✅ 중복 파일 정리 완료!" -ForegroundColor Green
Write-Host "📊 정리 결과를 확인하려면 'git status'를 실행하세요." -ForegroundColor Cyan
