# Casino-Club F2P Enhanced Docker Management Script v3.0
param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$Service = "",

    [switch]$Tools,
    [switch]$Force,
    [switch]$Monitoring
)

$ErrorActionPreference = "Stop"

# Color output function
function Write-ColoredOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-ColoredOutput "🎰 Casino-Club F2P Enhanced Docker Management Tool v3.0" "Cyan"
    Write-ColoredOutput "=" * 60 "Gray"
    Write-ColoredOutput "Usage: .\docker-manage.ps1 <command> [service] [options]" "Yellow"
    Write-ColoredOutput ""
    Write-ColoredOutput "📋 Core Commands:" "Green"
    Write-ColoredOutput "  check        - Check development environment" "White"
    Write-ColoredOutput "  setup        - Initial environment setup" "White"
    Write-ColoredOutput "  setup-frontend - Setup frontend for local development" "White"
    Write-ColoredOutput "  start        - Start services" "White"
    Write-ColoredOutput "  stop         - Stop services" "White"
    Write-ColoredOutput "  restart      - Restart services" "White"
    Write-ColoredOutput "  status       - Show service status" "White"
    Write-ColoredOutput "  monitor      - Real-time performance monitoring" "White"
    Write-ColoredOutput "  logs         - Show service logs" "White"
    Write-ColoredOutput "  shell        - Enter container shell" "White"
    Write-ColoredOutput ""
    Write-ColoredOutput "🗃️ Database Management:" "Green"
    Write-ColoredOutput "  migrate      - Run database migrations" "White"
    Write-ColoredOutput "  seed         - Create test data" "White"
    Write-ColoredOutput "  backup       - Backup database" "White"
    Write-ColoredOutput "  reset-db     - Reset database" "White"
    Write-ColoredOutput ""
    Write-ColoredOutput "🧪 Testing & Build:" "Green"  
    Write-ColoredOutput "  test         - Run tests" "White"
    Write-ColoredOutput "  build        - Build images" "White"
    Write-ColoredOutput "  clean        - Clean environment" "White"
    Write-ColoredOutput "  reset        - Complete reset" "White"
    Write-ColoredOutput ""
    Write-ColoredOutput "🔧 Options:" "Green"
    Write-ColoredOutput "  --tools      - Include dev tools (pgAdmin, Redis Commander, Kafka UI)" "White"
    Write-ColoredOutput "  --monitoring - Include monitoring tools" "White"
    Write-ColoredOutput "  --force      - Force execution" "White"
    Write-ColoredOutput ""
    Write-ColoredOutput "🎯 Services:" "Green"
    Write-ColoredOutput "  backend      - Backend API service" "White"
    Write-ColoredOutput "  frontend     - Frontend web app" "White"
    Write-ColoredOutput "  postgres     - PostgreSQL database" "White"
    Write-ColoredOutput "  redis        - Redis cache" "White"
    Write-ColoredOutput "  kafka        - Kafka message queue" "White"
    Write-ColoredOutput ""
    Write-ColoredOutput "📚 Examples:" "Green"
    Write-ColoredOutput "  .\docker-manage.ps1 check" "Gray"
    Write-ColoredOutput "  .\docker-manage.ps1 start --tools" "Gray"
    Write-ColoredOutput "  .\docker-manage.ps1 logs backend" "Gray"
    Write-ColoredOutput "  .\docker-manage.ps1 shell backend" "Gray"
    Write-ColoredOutput "  .\docker-manage.ps1 test coverage" "Gray"
    Write-ColoredOutput "  .\docker-manage.ps1 monitor" "Gray"
}

function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-ColoredOutput "❌ Docker is not running. Please start Docker Desktop." "Red"
        exit 1
    }
}

function Check-Environment {
    Write-ColoredOutput "🔍 Checking development environment..." "Cyan"
    
    # Docker status check
    Test-DockerRunning
    Write-ColoredOutput "✅ Docker running status: OK" "Green"
    
    # Environment files check
    $envFiles = @(".env.development", "docker-compose.yml", "cc-webapp/frontend/package.json")
    foreach ($file in $envFiles) {
        if (Test-Path $file) {
            Write-ColoredOutput "✅ $file : exists" "Green"
        }
        else {
            Write-ColoredOutput "❌ $file : missing" "Red"
        }
    }
    
    # Frontend dependencies check
    Write-ColoredOutput "🔍 Checking frontend dependencies..." "Yellow"
    if (Test-Path "cc-webapp/frontend/node_modules") {
        Write-ColoredOutput "✅ node_modules: exists" "Green"
    }
    else {
        Write-ColoredOutput "⚠️ node_modules: missing - npm install needed" "Yellow"
    }
    
    Write-ColoredOutput "✅ Environment check complete!" "Green"
}

function Setup-Environment {
    Write-ColoredOutput "🚀 Setting up Casino-Club F2P environment..." "Cyan"
    
    # Docker status check
    Test-DockerRunning
    
    # Create required directories
    $directories = @(
        "logs/backend",
        "logs/frontend", 
        "logs/postgres",
        "logs/celery",
        "data/init",
        "data/backup"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-ColoredOutput "📁 Created directory: $dir" "Green"
        }
    }
    
    # Check environment file
    if (!(Test-Path ".env.development")) {
        Write-ColoredOutput "⚠️ .env.development file missing. Creating sample file." "Yellow"
        # Environment file creation logic needed
    }
    
    Write-ColoredOutput "✅ Environment setup complete!" "Green"
}

function Start-Services {
    Write-ColoredOutput "🚀 Starting services..." "Cyan"
    
    Test-DockerRunning
    
    $composeArgs = @("up", "-d", "--build")
    
    if ($Tools) {
        $composeArgs += "--profile"
        $composeArgs += "tools"
        Write-ColoredOutput "🛠️ Starting with development tools..." "Yellow"
    }
    
    try {
        & docker-compose @composeArgs
        Write-ColoredOutput "✅ Services started successfully!" "Green"
        Show-ServiceStatus
    }
    catch {
        Write-ColoredOutput "❌ Failed to start services: $($_.Exception.Message)" "Red"
        exit 1
    }
}

function Stop-Services {
    Write-ColoredOutput "🛑 Stopping services..." "Cyan"
    
    try {
        docker-compose down
        Write-ColoredOutput "✅ Services stopped successfully!" "Green"
    }
    catch {
        Write-ColoredOutput "❌ Failed to stop services: $($_.Exception.Message)" "Red"
    }
}

function Restart-Services {
    Write-ColoredOutput "🔄 Restarting services..." "Cyan"
    Stop-Services
    Start-Sleep 2
    Start-Services
}

function Show-ServiceStatus {
    Write-ColoredOutput "📊 Service Status:" "Cyan"
    docker-compose ps
    
    Write-ColoredOutput "`n🌐 Service URLs:" "Cyan"
    Write-ColoredOutput "  Frontend:    http://localhost:3000" "Green"
    Write-ColoredOutput "  Backend API: http://localhost:8000" "Green"
    Write-ColoredOutput "  API Docs:    http://localhost:8000/docs" "Green"
    
    if ($Tools) {
        Write-ColoredOutput "  pgAdmin:     http://localhost:5050" "Yellow"
        Write-ColoredOutput "  Redis UI:    http://localhost:8081" "Yellow"
    }
}

function Show-Performance {
    Write-ColoredOutput "📊 Real-time performance monitoring..." "Cyan"
    Write-ColoredOutput "Press Ctrl+C to exit" "Yellow"
    docker stats
}

function Show-Logs {
    if ($Service) {
        Write-ColoredOutput "📋 $Service logs:" "Cyan"
        docker-compose logs -f $Service
    }
    else {
        Write-ColoredOutput "📋 All service logs:" "Cyan"
        docker-compose logs -f
    }
}

function Enter-Container {
    if (!$Service) {
        Write-ColoredOutput "❌ Please specify a service. Example: .\docker-manage.ps1 shell backend" "Red"
        return
    }
    
    Write-ColoredOutput "🚪 Entering $Service container..." "Cyan"
    
    switch ($Service.ToLower()) {
        "backend" { docker-compose exec backend bash }
        "frontend" { docker-compose exec frontend sh }
        "postgres" { docker-compose exec postgres psql -U cc_user -d cc_webapp }
        "redis" { docker-compose exec redis redis-cli }
        default {
            Write-ColoredOutput "❌ Unsupported service: $Service" "Red"
            Write-ColoredOutput "Supported services: backend, frontend, postgres, redis" "Yellow"
        }
    }
}

function Run-Migration {
    Write-ColoredOutput "🗃️ Running database migrations..." "Cyan"
    docker-compose exec backend python -m alembic upgrade head
    Write-ColoredOutput "✅ Migration complete!" "Green"
}

function Seed-TestData {
    Write-ColoredOutput "🌱 Creating test data..." "Cyan"
    docker-compose exec backend python db_auto_init.py
    Write-ColoredOutput "✅ Test data created!" "Green"
}

function Backup-Database {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "data/backup/cc_webapp_$timestamp.sql"
    
    Write-ColoredOutput "💾 Creating database backup..." "Cyan"
    docker-compose exec postgres pg_dump -U cc_user cc_webapp > $backupFile
    Write-ColoredOutput "✅ Backup complete: $backupFile" "Green"
}

function Reset-Database {
    Write-ColoredOutput "🗃️ Resetting database..." "Red"
    docker-compose exec postgres psql -U cc_user -c "DROP DATABASE IF EXISTS cc_webapp;"
    docker-compose exec postgres psql -U cc_user -c "CREATE DATABASE cc_webapp;"
    Run-Migration
    Seed-TestData
    Write-ColoredOutput "✅ Database reset complete!" "Green"
}

function Run-Tests {
    Write-ColoredOutput "🧪 Running tests..." "Cyan"
    
    if ($Service -eq "coverage") {
        Write-ColoredOutput "📊 Running backend tests with coverage..." "Yellow"
        docker-compose exec backend pytest --cov=app --cov-report=html --cov-report=term
    }
    elseif ($Service -eq "frontend") {
        Write-ColoredOutput "🖥️ Running frontend tests..." "Yellow"
        docker-compose exec frontend npm test
    }
    elseif ($Service -eq "backend") {
        Write-ColoredOutput "⚙️ Running backend tests..." "Yellow"
        docker-compose exec backend pytest -v
    }
    else {
        Write-ColoredOutput "🧪 Running all tests..." "Yellow"
        docker-compose exec backend pytest -v
        docker-compose exec frontend npm test -- --passWithNoTests
    }
    
    Write-ColoredOutput "✅ Tests complete!" "Green"
}

function Build-Images {
    Write-ColoredOutput "🏗️ Building Docker images..." "Cyan"
    
    if ($Service) {
        Write-ColoredOutput "🎯 Building $Service service..." "Yellow"
        docker-compose build --no-cache $Service
    }
    else {
        Write-ColoredOutput "🎯 Building all services..." "Yellow"
        docker-compose build --no-cache
    }
    
    Write-ColoredOutput "✅ Build complete!" "Green"
}

function Clean-Environment {
    Write-ColoredOutput "🧹 Cleaning environment..." "Cyan"
    
    if ($Service -eq "volumes") {
        Write-ColoredOutput "📦 Cleaning volumes..." "Yellow"
        docker-compose down --volumes
        docker volume prune -f
    }
    elseif ($Service -eq "containers") {
        Write-ColoredOutput "📦 Cleaning containers..." "Yellow"
        docker-compose down --remove-orphans
        docker container prune -f
    }
    else {
        Write-ColoredOutput "🗑️ General cleanup..." "Yellow"
        docker-compose down
        docker system prune -f --volumes
    }
    
    Write-ColoredOutput "✅ Cleanup complete!" "Green"
}

function Reset-Environment {
    if (!$Force) {
        $confirm = Read-Host "⚠️ All data will be deleted. Continue? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-ColoredOutput "❌ Cancelled." "Yellow"
            return
        }
    }
    
    Write-ColoredOutput "🧹 Starting complete reset..." "Red"
    
    # Stop and remove containers
    docker-compose down --volumes --remove-orphans
    
    # Clean images
    docker system prune -f
    
    # Clean log files
    if (Test-Path "logs") {
        Remove-Item -Path "logs\*" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-ColoredOutput "✅ Complete reset finished!" "Green"
    Write-ColoredOutput "Restart with: .\docker-manage.ps1 setup" "Yellow"
}

# Function to setup frontend for local development (Tailwind CSS v4 compatible)
function Setup-FrontendLocal {
    Write-ColoredOutput "🚀 Setting up frontend for local development with Tailwind CSS v4..." "Cyan"
    
    # Ensure frontend directory exists
    $frontendDir = "cc-webapp/frontend"
    if (!(Test-Path $frontendDir)) {
        Write-ColoredOutput "❌ Frontend directory not found: $frontendDir" "Red"
        exit 1
    }
    
    # Create .vscode settings directory for Tailwind CSS v4
    $vscodeDir = "$frontendDir/.vscode"
    if (!(Test-Path $vscodeDir)) {
        New-Item -ItemType Directory -Path $vscodeDir -Force | Out-Null
        Write-ColoredOutput "📁 Created VS Code settings directory" "Green"
    }
    
    # Create VS Code settings.json
    $settingsFile = "$vscodeDir/settings.json"
    $settingsContent = @"
{
  "tailwindCSS.experimental.configFile": null,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "css.validate": false,
  "postcss.validate": false,
  "typescript.preferences.includePackageJsonAutoImports": "off"
}
"@
    Set-Content -Path $settingsFile -Value $settingsContent
    Write-ColoredOutput "✅ Created VS Code settings for Tailwind CSS v4" "Green"
    
    # Check for and delete prohibited files
    $prohibitedFiles = @(
        "$frontendDir/tailwind.config.js",
        "$frontendDir/tailwind.config.ts", 
        "$frontendDir/postcss.config.js",
        "$frontendDir/postcss.config.ts"
    )
    
    foreach ($file in $prohibitedFiles) {
        if (Test-Path $file) {
            Remove-Item -Path $file -Force
            Write-ColoredOutput "🗑️ Removed prohibited file: $file" "Yellow"
        }
    }
    
    # Update globals.css
    $globalsFile = "$frontendDir/styles/globals.css"
    if (!(Test-Path $globalsFile)) {
        # Create styles directory if it doesn't exist
        if (!(Test-Path "$frontendDir/styles")) {
            New-Item -ItemType Directory -Path "$frontendDir/styles" -Force | Out-Null
        }
        
        $globalsContent = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --neon-cyan: #00FFFF;
  --neon-pink: #FF00FF;
  --casino-gold: #FFD700;
  --background: #0a0a0f;
}

@theme inline {
  --color-neon-cyan: var(--neon-cyan);
  --color-neon-pink: var(--neon-pink);
  --color-casino-gold: var(--casino-gold);
  --color-background: var(--background);
}
"@
        Set-Content -Path $globalsFile -Value $globalsContent
        Write-ColoredOutput "✅ Created globals.css with Tailwind CSS v4 configuration" "Green"
    } else {
        # Backup the existing file
        Copy-Item -Path $globalsFile -Destination "$globalsFile.bak"
        Write-ColoredOutput "📋 Backed up existing globals.css" "Yellow"
        
        # Update globals.css to use @theme inline
        $content = Get-Content -Path $globalsFile -Raw
        if ($content -notmatch "@theme\s+inline") {
            $updatedContent = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --neon-cyan: #00FFFF;
  --neon-pink: #FF00FF;
  --casino-gold: #FFD700;
  --background: #0a0a0f;
}

@theme inline {
  --color-neon-cyan: var(--neon-cyan);
  --color-neon-pink: var(--neon-pink);
  --color-casino-gold: var(--casino-gold);
  --color-background: var(--background);
}
"@
            Set-Content -Path $globalsFile -Value $updatedContent
            Write-ColoredOutput "✅ Updated globals.css with Tailwind CSS v4 configuration" "Green"
        } else {
            Write-ColoredOutput "✅ globals.css already has @theme inline directive" "Green"
        }
    }
    
    # Create utils.ts with cn function if it doesn't exist
    $utilsFile = "$frontendDir/components/ui/utils.ts"
    if (!(Test-Path $utilsFile)) {
        # Create components/ui directory if it doesn't exist
        if (!(Test-Path "$frontendDir/components/ui")) {
            New-Item -ItemType Directory -Path "$frontendDir/components/ui" -Force | Out-Null
        }
        
        $utilsContent = @"
import { twMerge } from 'tailwind-merge'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
"@
        Set-Content -Path $utilsFile -Value $utilsContent
        Write-ColoredOutput "✅ Created utils.ts with cn function for Tailwind CSS v4" "Green"
    }
    
    # Install required npm packages for Tailwind CSS v4
    Push-Location $frontendDir
    Write-ColoredOutput "📦 Installing required npm packages..." "Yellow"
    npm install tailwindcss clsx tailwind-merge
    Pop-Location
    
    Write-ColoredOutput "`n🎉 Frontend setup complete for local development with Tailwind CSS v4!" "Green"
    Write-ColoredOutput "🔖 Key points to remember:" "Cyan"
    Write-ColoredOutput "  1. No tailwind.config.js or postcss.config.js files allowed" "Yellow"
    Write-ColoredOutput "  2. Use relative imports, not @/ imports" "Yellow"
    Write-ColoredOutput "  3. Use cn() function from ./components/ui/utils.ts for class names" "Yellow"
    Write-ColoredOutput "  4. CSS variables and theme defined in globals.css" "Yellow"
    Write-ColoredOutput "`n🚀 Next steps:" "Cyan"
    Write-ColoredOutput "  1. cd cc-webapp/frontend" "White"
    Write-ColoredOutput "  2. npm run dev" "White"
}

# Main execution logic
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "check" { Check-Environment }
    "setup" { Setup-Environment }
    "setup-frontend" { Setup-FrontendLocal }
    "start" { Start-Services }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "status" { Show-ServiceStatus }
    "monitor" { Show-Performance }
    "logs" { Show-Logs }
    "shell" { Enter-Container }
    "migrate" { Run-Migration }
    "seed" { Seed-TestData }
    "backup" { Backup-Database }
    "reset-db" { Reset-Database }
    "test" { Run-Tests }
    "build" { Build-Images }
    "clean" { Clean-Environment }
    "reset" { Reset-Environment }
    default {
        Write-ColoredOutput "❌ Unknown command: $Command" "Red"
        Show-Help
        exit 1
    }
}
