# setup-local-dev.ps1
# Casino-Club F2P Local Development Setup Script
# This script sets up local development environment without Docker

param (
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$All = $true
)

$ErrorActionPreference = "Stop"
$ScriptRoot = $PSScriptItem.Directory.FullName
$CcWebappDir = Join-Path $ScriptRoot "cc-webapp"
$FrontendDir = Join-Path $CcWebappDir "frontend"
$BackendDir = Join-Path $CcWebappDir "backend"
$DataDir = Join-Path $ScriptRoot "data"
$LogsDir = Join-Path $ScriptRoot "logs"

# Helper functions
function Write-Step {
    param ([string]$Message)
    Write-Host "🚀 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param ([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param ([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param ([string]$Message)
    Write-Host "ℹ️ $Message" -ForegroundColor Yellow
}

function Test-Command {
    param ([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# Create directories if they don't exist
function Create-DirectoryIfNotExists {
    param ([string]$Path, [string]$Description = "Directory")
    
    if (-Not (Test-Path $Path)) {
        Write-Step "Creating $Description..."
        New-Item -Path $Path -ItemType Directory -Force | Out-Null
        Write-Success "$Description created at $Path"
    }
}

# Set up frontend development environment
function Setup-Frontend {
    Write-Step "Setting up Frontend Development Environment..."

    # Check for Node.js
    if (-Not (Test-Command "node")) {
        Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    }

    # Check Node.js version
    $nodeVersion = (node -v).Replace("v", "")
    if ([version]$nodeVersion -lt [version]"18.0.0") {
        Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
        exit 1
    }
    Write-Success "Node.js $nodeVersion detected"

    # Check for npm
    if (-Not (Test-Command "npm")) {
        Write-Error "npm is not installed. Please install npm and try again."
        exit 1
    }
    Write-Success "npm $(npm -v) detected"

    # Navigate to frontend directory and install dependencies
    Push-Location $FrontendDir
    try {
        Write-Step "Installing frontend dependencies..."
        npm ci
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install frontend dependencies"
            exit 1
        }
        
        Write-Success "Frontend dependencies installed"
        
        # Create local environment file if it doesn't exist
        $envLocalPath = Join-Path $FrontendDir ".env.local"
        if (-Not (Test-Path $envLocalPath)) {
            Write-Step "Creating frontend .env.local file..."
            @"
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
"@ | Out-File -FilePath $envLocalPath -Encoding utf8
            Write-Success "Frontend .env.local file created"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Frontend development environment setup complete!"
}

# Set up backend development environment
function Setup-Backend {
    Write-Step "Setting up Backend Development Environment..."

    # Check for Python
    if (-Not (Test-Command "python")) {
        Write-Error "Python is not installed. Please install Python 3.10+ and try again."
        exit 1
    }

    # Check Python version
    $pythonVersion = (python --version 2>&1).ToString().Split(" ")[1]
    if ([version]$pythonVersion -lt [version]"3.10.0") {
        Write-Error "Python 3.10+ is required. Current version: $pythonVersion"
        exit 1
    }
    Write-Success "Python $pythonVersion detected"

    # Check for pip
    if (-Not (Test-Command "pip")) {
        Write-Error "pip is not installed. Please install pip and try again."
        exit 1
    }
    Write-Success "pip detected"

    # Create Python virtual environment
    $venvPath = Join-Path $BackendDir ".venv"
    if (-Not (Test-Path $venvPath)) {
        Write-Step "Creating Python virtual environment..."
        python -m venv $venvPath
        Write-Success "Python virtual environment created at $venvPath"
    }

    # Activate virtual environment and install dependencies
    $activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
    if (-Not (Test-Path $activateScript)) {
        Write-Error "Virtual environment activation script not found at $activateScript"
        exit 1
    }

    Write-Step "Activating virtual environment and installing dependencies..."
    & $activateScript
    
    # Install dependencies
    Push-Location $BackendDir
    try {
        pip install -r requirements.txt
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install backend dependencies"
            exit 1
        }
        
        Write-Success "Backend dependencies installed"
        
        # Create .env file if it doesn't exist
        $envPath = Join-Path $BackendDir ".env"
        if (-Not (Test-Path $envPath)) {
            Write-Step "Creating backend .env file..."
            @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cc_webapp
DB_USER=cc_user
DB_PASSWORD=cc_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
DEBUG=true
APP_ENV=development
LOG_LEVEL=DEBUG
JWT_SECRET_KEY=dev-secret-key-for-local-development
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Cyber Token Configuration
INITIAL_CYBER_TOKENS=200

# Corporate Site Configuration
CORPORATE_SITE_URL=http://localhost:8080
CORPORATE_API_KEY=test-api-key
"@ | Out-File -FilePath $envPath -Encoding utf8
            Write-Success "Backend .env file created"
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Success "Backend development environment setup complete!"
}

# Main execution
Write-Host "🎰 Casino-Club F2P Local Development Setup" -ForegroundColor Magenta
Write-Host "=======================================`n" -ForegroundColor Magenta

# Create required directories
Create-DirectoryIfNotExists -Path $CcWebappDir -Description "cc-webapp directory"
Create-DirectoryIfNotExists -Path $FrontendDir -Description "frontend directory"
Create-DirectoryIfNotExists -Path $BackendDir -Description "backend directory"
Create-DirectoryIfNotExists -Path $DataDir -Description "data directory"
Create-DirectoryIfNotExists -Path $LogsDir -Description "logs directory"

# Run setup based on parameters
if ($Frontend -or $All) {
    Setup-Frontend
}

if ($Backend -or $All) {
    Setup-Backend
}

Write-Host "`n🎮 Setup Complete! 🎮" -ForegroundColor Magenta
Write-Info "To start the frontend server: cd cc-webapp/frontend && npm run dev"
Write-Info "To start the backend server: cd cc-webapp/backend && python -m uvicorn app.main:app --reload --port 8000"
Write-Info "Access the application at: http://localhost:3000"
Write-Info "Access the API documentation at: http://localhost:8000/docs"
