#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Casino-Club F2P 빠른 헬스체크 도구

.DESCRIPTION
    사용자가 PowerShell 명령어에서 구문 오류 없이 간단하게 백엔드와 프론트엔드 상태를 확인할 수 있는 도구입니다.
    원래 문제가 되었던 복잡한 PowerShell 명령어를 대체합니다.

.EXAMPLE
    .\quick-health.ps1
    백엔드와 프론트엔드 상태를 간단히 확인

.EXAMPLE
    .\quick-health.ps1 -Verbose
    자세한 정보와 함께 상태 확인
#>

param(
    [switch]$Verbose
)

# 간단한 HTTP 상태 확인 함수
function Test-QuickHealth {
    param(
        [string]$ServiceName,
        [string]$Url
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200) {
            Write-Host "$ServiceName=/health=$statusCode" -ForegroundColor Green
            
            if ($Verbose) {
                Write-Host "  Content: $($response.Content)" -ForegroundColor Gray
            }
            
            return $true
        }
        else {
            Write-Host "$ServiceName=/health=$statusCode" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "$ServiceName=/health=ERROR" -ForegroundColor Red
        
        if ($Verbose) {
            Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        }
        
        return $false
    }
}

# 메인 실행
if ($Verbose) {
    Write-Host "🎰 Casino-Club F2P 빠른 헬스체크" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
}

# 헬스체크 실행 (원래 문제가 된 명령어 형태와 유사한 출력)
$backendResult = Test-QuickHealth -ServiceName "backend" -Url "http://localhost:8000/health"
$frontendResult = Test-QuickHealth -ServiceName "frontend" -Url "http://localhost:3000/healthz"

if ($Verbose) {
    Write-Host ""
    
    if ($backendResult -and $frontendResult) {
        Write-Host "✅ 모든 서비스 정상" -ForegroundColor Green
    }
    elseif ($backendResult -or $frontendResult) {
        Write-Host "⚠️ 일부 서비스 문제" -ForegroundColor Yellow
    }
    else {
        Write-Host "❌ 모든 서비스 문제" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "자세한 분석이 필요한 경우:" -ForegroundColor Gray
    Write-Host "  .\health-check.ps1" -ForegroundColor Gray
    Write-Host "또는" -ForegroundColor Gray
    Write-Host "  .\health-check.sh" -ForegroundColor Gray
}