#!/usr/bin/env pwsh
# Casino-Club F2P Frontend Integration and Git Commit Script
# Created: 2025-08-04

param(
    [string]$CommitMessage = "feat: Integrate complete frontend with all design effects",
    [switch]$SkipBackup = $false,
    [switch]$AutoCommit = $true
)

# Generate timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Set paths
$sourceDir = "c:\Users\bdbd\0000\archive\frontend-backup-20250803-114502"
$targetDir = "c:\Users\bdbd\0000\cc-webapp\frontend"
$backupDir = "c:\Users\bdbd\0000\backups\frontend-$timestamp"

# Set log file
$logFile = "c:\Users\bdbd\0000\frontend-merge-$timestamp.log"

function Write-Log {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [string]$LogLevel = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$LogLevel] $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

# Start
Write-Log "Starting frontend code integration and git commit process" "START"

# 1. Create backup directory (if not skipped)
if (-not $SkipBackup) {
    if (Test-Path $backupDir) {
        Write-Log "Backup directory already exists: $backupDir" "INFO"
    }
    else {
        Write-Log "Creating backup directory: $backupDir" "INFO"
        New-Item -ItemType Directory -Path $backupDir -Force
    }
    
    # 2. Preserve Docker config files
    $dockerFiles = @(
        "Dockerfile",
        "Dockerfile.dev",
        ".dockerignore"
    )

    foreach ($file in $dockerFiles) {
        if (Test-Path "$targetDir\$file") {
            Copy-Item -Path "$targetDir\$file" -Destination "$backupDir\$file"
            Write-Log "Docker config file backed up: $file" "INFO"
        }
    }

    # 3. Preserve environment config files
    $configFiles = @(
        "next.config.js",
        "postcss.config.js",
        "tailwind.config.mjs",
        ".env",
        ".env.local",
        ".env.development",
        ".env.production"
    )

    foreach ($file in $configFiles) {
        if (Test-Path "$targetDir\$file") {
            Copy-Item -Path "$targetDir\$file" -Destination "$backupDir\$file"
            Write-Log "Environment config file backed up: $file" "INFO"
        }
    }
}

# 4. Copy code (excluding Docker-related files)
$dirsToSync = @(
    "app",
    "components",
    "contexts",
    "hooks",
    "public",
    "styles",
    "types",
    "utils"
)

foreach ($dir in $dirsToSync) {
    if (Test-Path "$sourceDir\$dir") {
        # Backup and remove existing content if target directory already exists
        if (Test-Path "$targetDir\$dir") {
            if (-not $SkipBackup) {
                Write-Log "Backing up existing contents of $dir directory..." "INFO"
                Copy-Item -Path "$targetDir\$dir" -Destination "$backupDir\" -Recurse
            }
            Remove-Item -Path "$targetDir\$dir" -Recurse -Force
        }
        
        # Copy from source to target
        Write-Log "Copying $dir directory..." "INFO"
        Copy-Item -Path "$sourceDir\$dir" -Destination "$targetDir\" -Recurse
    }
}

# 5. Integrate package.json (merge dependencies)
Write-Log "Integrating package.json..." "INFO"
if ((Test-Path "$sourceDir\package.json") -and (Test-Path "$targetDir\package.json")) {
    if (-not $SkipBackup) {
        Copy-Item -Path "$targetDir\package.json" -Destination "$backupDir\package.json"
    }
    Copy-Item -Path "$sourceDir\package.json" -Destination "$targetDir\package.json"
    Write-Log "package.json updated" "INFO"
}

# 6. Restore Docker config files
if (-not $SkipBackup) {
    foreach ($file in $dockerFiles) {
        if (Test-Path "$backupDir\$file") {
            Copy-Item -Path "$backupDir\$file" -Destination "$targetDir\$file" -Force
            Write-Log "Docker config file restored: $file" "INFO"
        }
    }
}

Write-Log "Code copy complete" "INFO"

# 7. Ensure proper Next.js & Tailwind configuration
Write-Log "Ensuring proper Next.js & Tailwind configuration..." "INFO"

# Fix postcss.config.js if needed
$postcssPath = "$targetDir\postcss.config.js"
if (Test-Path $postcssPath) {
    $postcssContent = Get-Content $postcssPath -Raw
    if (-not $postcssContent.Contains("@tailwindcss/postcss")) {
        $newPostcssContent = @"
// postcss.config.js - Tailwind CSS v4 configuration
module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
"@
        $newPostcssContent | Out-File -FilePath $postcssPath -Encoding UTF8
        Write-Log "Updated postcss.config.js for Tailwind v4 compatibility" "INFO"
    }
}

# 8. Fix app/page.tsx if needed
$pagePath = "$targetDir\app\page.tsx"
if (-not (Test-Path $pagePath)) {
    if (Test-Path "$targetDir\app\page.tsx.bak") {
        Rename-Item -Path "$targetDir\app\page.tsx.bak" -NewName "page.tsx"
        Write-Log "Restored page.tsx from backup" "INFO"
    } else {
        $pageContent = @"
'use client';

import App from '../App';

export default function Page() {
  return <App />;
}
"@
        $pageContent | Out-File -FilePath $pagePath -Encoding UTF8
        Write-Log "Created app/page.tsx" "INFO"
    }
}

# 9. Git operations
if ($AutoCommit) {
    # Check if git is installed
    try {
        $gitVersion = git --version
        Write-Log "Git detected: $gitVersion" "INFO"

        # Get current directory
        $currentDir = Get-Location
        
        # Navigate to project root
        Set-Location -Path "c:\Users\bdbd\0000"
        
        # Check git status
        $gitStatus = git status --porcelain
        if ($gitStatus) {
            # Add frontend changes
            Write-Log "Adding frontend changes to git..." "INFO"
            git add cc-webapp/frontend
            
            # Commit changes
            Write-Log "Committing frontend changes..." "INFO"
            git commit -m "$CommitMessage"
            
            $commitHash = git rev-parse HEAD
            Write-Log "✅ Changes committed successfully! Commit hash: $commitHash" "SUCCESS"
            
            # Provide push command
            Write-Log "To push changes to remote repository, run: git push origin main" "INFO"
        } else {
            Write-Log "No changes detected in git" "WARN"
        }
        
        # Return to original directory
        Set-Location -Path $currentDir
    }
    catch {
        Write-Log "⚠️ Git operations failed: $_" "ERROR"
        Write-Log "Please commit changes manually" "WARN"
    }
}

Write-Log "Frontend integration complete!" "DONE"
Write-Log "Run 'cd $targetDir && npm install && npm run dev' to start the development server" "INFO"
Write-Log "Log file saved at: $logFile" "INFO"

# Return success
return $true
