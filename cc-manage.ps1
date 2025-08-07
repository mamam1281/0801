#!/usr/bin/env pwsh

param (
    [string]$Command,
    [string]$Service
)

function Start-Environment {
    Write-Host "Starting Casino-Club F2P environment..." -ForegroundColor Cyan
    docker-compose -f docker-compose.basic.yml up -d
    Write-Host "Environment started!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "Backend API: http://localhost:8000" -ForegroundColor Yellow
    Write-Host "Database: localhost:5432 (User: cc_user, Password: cc_password, DB: cc_webapp)" -ForegroundColor Yellow
}

function Stop-Environment {
    Write-Host "Stopping Casino-Club F2P environment..." -ForegroundColor Cyan
    docker-compose -f docker-compose.basic.yml down
    Write-Host "Environment stopped!" -ForegroundColor Green
}

function Show-Logs {
    if ($Service) {
        Write-Host "Showing logs for $Service..." -ForegroundColor Cyan
        docker-compose -f docker-compose.basic.yml logs -f $Service
    } else {
        Write-Host "Showing all logs..." -ForegroundColor Cyan
        docker-compose -f docker-compose.basic.yml logs -f
    }
}

function Show-Status {
    Write-Host "Checking environment status..." -ForegroundColor Cyan
    docker-compose -f docker-compose.basic.yml ps
}

function Enter-Container {
    if (-not $Service) {
        Write-Host "Error: Service name is required" -ForegroundColor Red
        Write-Host "Usage: ./cc-manage.ps1 shell <service_name> (db, api, or web)" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Entering $Service container..." -ForegroundColor Cyan
    if ($Service -eq "db") {
        docker-compose -f docker-compose.basic.yml exec db psql -U cc_user -d cc_webapp
    } elseif ($Service -eq "api" -or $Service -eq "web") {
        docker-compose -f docker-compose.basic.yml exec $Service /bin/sh
    } else {
        Write-Host "Error: Unknown service '$Service'" -ForegroundColor Red
        Write-Host "Available services: db, api, web" -ForegroundColor Yellow
        exit 1
    }
}

function Show-Help {
    Write-Host "Casino-Club F2P Management Script" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor DarkGray
    Write-Host "Usage: ./cc-manage.ps1 <command> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  start       Start the environment" -ForegroundColor White
    Write-Host "  stop        Stop the environment" -ForegroundColor White
    Write-Host "  logs        Show logs (all services or specific service)" -ForegroundColor White
    Write-Host "  status      Show container status" -ForegroundColor White
    Write-Host "  shell       Enter shell in a container" -ForegroundColor White
    Write-Host "  help        Show this help" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  ./cc-manage.ps1 start" -ForegroundColor White
    Write-Host "  ./cc-manage.ps1 logs api" -ForegroundColor White
    Write-Host "  ./cc-manage.ps1 shell db" -ForegroundColor White
}

# Main script execution
switch ($Command) {
    "start" { Start-Environment }
    "stop" { Stop-Environment }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "shell" { Enter-Container }
    "help" { Show-Help }
    default { Show-Help }
}
