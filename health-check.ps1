#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Casino-Club F2P 애플리케이션 헬스체크 스크립트

.DESCRIPTION
    백엔드와 프론트엔드 서비스의 상태를 확인하고 결과를 표시합니다.
    PowerShell 구문 오류 없이 안전하게 HTTP 상태를 확인합니다.

.PARAMETER Backend
    백엔드 URL (기본값: http://localhost:8000)

.PARAMETER Frontend
    프론트엔드 URL (기본값: http://localhost:3000)

.PARAMETER Timeout
    HTTP 요청 타임아웃 (초, 기본값: 10)

.EXAMPLE
    .\health-check.ps1
    기본 설정으로 헬스체크 실행

.EXAMPLE
    .\health-check.ps1 -Backend "http://localhost:8000" -Frontend "http://localhost:3000"
    사용자 정의 URL로 헬스체크 실행
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$Backend = "http://localhost:8000",
    
    [Parameter(Mandatory = $false)]
    [string]$Frontend = "http://localhost:3000",
    
    [Parameter(Mandatory = $false)]
    [int]$Timeout = 10
)

# 색상 정의
$Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url,
        [string]$HealthPath,
        [int]$Timeout
    )
    
    try {
        Write-ColorOutput "🔍 $ServiceName 서비스 확인 중..." $Colors.Info
        
        $fullUrl = "$Url$HealthPath"
        Write-ColorOutput "   URL: $fullUrl" "Gray"
        
        # HTTP 요청 실행
        $response = Invoke-WebRequest -Uri $fullUrl -UseBasicParsing -TimeoutSec $Timeout -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ $ServiceName`: 정상 (HTTP $($response.StatusCode))" $Colors.Success
            
            # 응답 내용이 JSON인 경우 파싱해서 보여주기
            try {
                $content = $response.Content | ConvertFrom-Json
                if ($content.status) {
                    Write-ColorOutput "   상태: $($content.status)" "Gray"
                }
                if ($content.version) {
                    Write-ColorOutput "   버전: $($content.version)" "Gray"
                }
                if ($content.redis_connected -ne $null) {
                    $redisStatus = if ($content.redis_connected) { "연결됨" } else { "연결 안됨" }
                    Write-ColorOutput "   Redis: $redisStatus" "Gray"
                }
            }
            catch {
                Write-ColorOutput "   응답: $($response.Content)" "Gray"
            }
            
            return $true
        }
        else {
            Write-ColorOutput "⚠️ $ServiceName`: 비정상 응답 (HTTP $($response.StatusCode))" $Colors.Warning
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ $ServiceName`: 연결 실패" $Colors.Error
        Write-ColorOutput "   오류: $($_.Exception.Message)" "Gray"
        return $false
    }
}

function Test-DockerServices {
    try {
        Write-ColorOutput "`n🐳 Docker 컨테이너 상태 확인..." $Colors.Info
        
        $dockerPs = docker compose ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput $dockerPs "Gray"
        }
        else {
            Write-ColorOutput "Docker Compose 상태 확인 실패: $dockerPs" $Colors.Warning
        }
    }
    catch {
        Write-ColorOutput "Docker 명령 실행 실패: $($_.Exception.Message)" $Colors.Warning
    }
}

# 메인 실행
Clear-Host
Write-ColorOutput "🎰 Casino-Club F2P 헬스체크 도구" $Colors.Info
Write-ColorOutput "=" * 50 $Colors.Info

# 현재 시간 표시
$currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-ColorOutput "실행 시간: $currentTime`n" "Gray"

# 서비스 헬스체크 실행
$backendHealthy = Test-ServiceHealth -ServiceName "Backend API" -Url $Backend -HealthPath "/health" -Timeout $Timeout
$frontendHealthy = Test-ServiceHealth -ServiceName "Frontend App" -Url $Frontend -HealthPath "/healthz" -Timeout $Timeout

# Docker 컨테이너 상태 확인
Test-DockerServices

# 결과 요약
Write-ColorOutput "`n📊 헬스체크 결과 요약" $Colors.Info
Write-ColorOutput "=" * 30 $Colors.Info

if ($backendHealthy -and $frontendHealthy) {
    Write-ColorOutput "🎉 모든 서비스가 정상 동작 중입니다!" $Colors.Success
}
elseif ($backendHealthy -or $frontendHealthy) {
    Write-ColorOutput "⚠️ 일부 서비스에 문제가 있습니다." $Colors.Warning
}
else {
    Write-ColorOutput "🚨 모든 서비스에 문제가 있습니다." $Colors.Error
}

Write-ColorOutput "`n🔗 서비스 URL:" $Colors.Info
Write-ColorOutput "• 프론트엔드 (웹앱): $Frontend" "Gray"
Write-ColorOutput "• 백엔드 API: $Backend" "Gray"
Write-ColorOutput "• API 문서: $Backend/docs" "Gray"
Write-ColorOutput "• API 정보: $Backend/api" "Gray"

# 문제 해결 가이드
if (-not $backendHealthy -or -not $frontendHealthy) {
    Write-ColorOutput "`n🔧 문제 해결 가이드:" $Colors.Warning
    
    if (-not $backendHealthy) {
        Write-ColorOutput "• 백엔드 문제:" "Gray"
        Write-ColorOutput "  - 컨테이너 로그 확인: docker compose logs backend" "Gray"
        Write-ColorOutput "  - 데이터베이스 연결 확인: docker compose logs postgres" "Gray"
        Write-ColorOutput "  - 백엔드 재시작: docker compose restart backend" "Gray"
    }
    
    if (-not $frontendHealthy) {
        Write-ColorOutput "• 프론트엔드 문제:" "Gray"
        Write-ColorOutput "  - 컨테이너 로그 확인: docker compose logs frontend" "Gray"
        Write-ColorOutput "  - 프론트엔드 재시작: docker compose restart frontend" "Gray"
        Write-ColorOutput "  - 빌드 문제 시: docker compose build frontend" "Gray"
    }
}

Write-ColorOutput "`n헬스체크 완료." "Gray"