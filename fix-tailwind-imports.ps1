# Script to fix import paths in frontend code
param(
    [Parameter(Position = 0)]
    [string]$frontendDir = "cc-webapp/frontend"
)

$ErrorActionPreference = "Stop"

function Write-ColoredOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-ColoredOutput "🔧 Fixing import paths for Tailwind CSS v4 compatibility..." "Cyan"

# Check if the frontend directory exists
if (!(Test-Path $frontendDir)) {
    Write-ColoredOutput "❌ Frontend directory not found: $frontendDir" "Red"
    exit 1
}

# Get all TypeScript and JavaScript files
$files = Get-ChildItem -Path $frontendDir -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -File

$fileCount = 0
$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    $fileCount++
    
    # Fix import paths with version numbers (e.g., class-variance-authority@0.7.1)
    if ($content -match "from ['`"]([^'`"]+)@\d+\.\d+\.\d+['`"]") {
        $newContent = $content -replace "from ['`"]([^'`"]+)@\d+\.\d+\.\d+['`"]", "from '`$1'"
        if ($newContent -ne $content) {
            Set-Content -Path $file.FullName -Value $newContent
            $modified = $true
        }
    }
    
    # Fix import paths with absolute paths (@/)
    if ($content -match "from ['`"]@/") {
        $relPath = Get-Item $file.FullName | Resolve-Path -Relative
        $depth = ($relPath -split "\\").Count - 2
        $basePath = "../" * $depth

        $newContent = $content -replace "from ['`"]@/", "from '$basePath"
        if ($newContent -ne $content) {
            Set-Content -Path $file.FullName -Value $newContent
            $modified = $true
        }
    }

    # Fix clsx import to use the cn function
    if ($content -match "import\s+clsx\s+from\s+['`"]clsx['`"]" -and !($content -match "import.*cn.*from")) {
        $newContent = $content -replace "(import\s+clsx\s+from\s+['`"]clsx['`"])", "`$1`nimport { cn } from './components/ui/utils'"
        if ($newContent -ne $content) {
            Set-Content -Path $file.FullName -Value $newContent
            $modified = $true
        }
    }
    
    # Replace clsx() calls with cn()
    if ($content -match "clsx\(") {
        $newContent = $content -replace "clsx\(", "cn("
        if ($newContent -ne $content) {
            Set-Content -Path $file.FullName -Value $newContent
            $modified = $true
        }
    }

    if ($modified) {
        $fixedCount++
        Write-ColoredOutput "✅ Fixed: $($file.FullName)" "Green"
    }
}

Write-ColoredOutput "🎉 Import path fixing complete!" "Cyan"
Write-ColoredOutput "📊 Statistics:" "Yellow"
Write-ColoredOutput "  - Files scanned: $fileCount" "White"
Write-ColoredOutput "  - Files fixed: $fixedCount" "White"

if ($fixedCount -gt 0) {
    Write-ColoredOutput "`n⚠️ Please verify the changes in the modified files." "Yellow"
}

Write-ColoredOutput "`n🚀 Next steps:" "Cyan"
Write-ColoredOutput "  1. Run '.\docker-manage.ps1 setup-frontend' if you haven't already" "White"
Write-ColoredOutput "  2. cd cc-webapp/frontend" "White"
Write-ColoredOutput "  3. npm run dev" "White"
