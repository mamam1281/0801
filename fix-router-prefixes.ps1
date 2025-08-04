# 라우터 Prefix 자동 수정 스크립트

$routerConfigs = @(
    @{file="missions.py"; prefix="/api/missions"; tag="Missions"},
    @{file="quiz.py"; prefix="/api/quiz"; tag="Quiz"},
    @{file="dashboard.py"; prefix="/api/dashboard"; tag="Dashboard"},
    @{file="rps.py"; prefix="/api/games/rps"; tag="Rock Paper Scissors"},
    @{file="doc_titles.py"; prefix="/api/doc-titles"; tag="Document Titles"},
    @{file="tracking.py"; prefix="/api/tracking"; tag="Tracking"},
    @{file="unlock.py"; prefix="/api/unlock"; tag="Unlock"},
    @{file="notifications.py"; prefix="/ws"; tag="Real-time Notifications"},
    @{file="chat.py"; prefix="/api/chat"; tag="Chat"}
)

$basePath = "c:\Users\bdbd\0000\cc-webapp\backend\app\routers"

foreach ($config in $routerConfigs) {
    $filePath = Join-Path $basePath $config.file
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $oldPattern = "router = APIRouter\(\)"
        $newPattern = "router = APIRouter(prefix=`"$($config.prefix)`", tags=[`"$($config.tag)`"])"
        
        if ($content -match $oldPattern) {
            $content = $content -replace $oldPattern, $newPattern
            Set-Content $filePath $content -NoNewline
            Write-Host "✅ Updated $($config.file) with prefix $($config.prefix)"
        } else {
            Write-Host "⚠️ Pattern not found in $($config.file)"
        }
    } else {
        Write-Host "❌ File not found: $($config.file)"
    }
}
