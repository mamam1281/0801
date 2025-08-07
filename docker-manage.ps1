param(
    [string]$Command = "help"
)

function Show-Help {
    Write-Host @"
Casino-Club F2P Docker Management Script

Commands:
  start       Start the development environment
  stop        Stop all containers
  restart     Restart all containers
  status      Show container status
  logs        Show container logs
  shell       Open a shell in a container
  clean       Clean up containers and volumes
  test        Run integration tests
  help        Show this help message

Usage:
  ./docker-manage.ps1 [command]
"@
}

function Run-Tests {
    docker-compose exec -T backend pytest tests/test_auth_integration.py -v
}

function Start-Environment {
    docker-compose -f docker-compose.yml -f docker-compose.override.dev.yml up -d
}

function Stop-Environment {
    docker-compose down
}

function Show-Status {
    docker-compose ps
}

function Show-Logs {
    docker-compose logs -f
}

function Clean-Environment {
    docker-compose down -v
    docker system prune -f
}

switch ($Command) {
    "start" { Start-Environment }
    "stop" { Stop-Environment }
    "restart" { 
        Stop-Environment
        Start-Environment 
    }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "clean" { Clean-Environment }
    "test" { Run-Tests }
    default { Show-Help }
}
