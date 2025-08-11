# Kafka end-to-end smoke test for local dev
# Usage: .\diagnose-kafka.ps1
param(
    [string]$BackendBase = "http://127.0.0.1:8001",
    [string]$Topic = "cc_test",
    [int]$PeekMax = 200,
    [switch]$FromBeginning
)

$ErrorActionPreference = 'Stop'
$marker = "e2e-$([guid]::NewGuid())"
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

Write-Host "Backend=$BackendBase Topic=$Topic Marker=$marker"

$health = Invoke-RestMethod -Uri "$BackendBase/health"
$ready = Invoke-RestMethod -Uri "$BackendBase/api/kafka/_debug/ready"

$bodyObj = @{ topic = $Topic; payload = @{ marker = $marker; ts = $ts } }
$bodyJson = $bodyObj | ConvertTo-Json -Depth 5
$produce = Invoke-RestMethod -Method Post -ContentType 'application/json' -Body $bodyJson -Uri "$BackendBase/api/kafka/produce"

Start-Sleep -Seconds 2
$fromBeginningFlag = if ($FromBeginning) { 1 } else { 0 }
$peek = Invoke-RestMethod -Uri "$BackendBase/api/kafka/debug/peek?topic=$Topic&max_messages=$PeekMax&from_beginning=$fromBeginningFlag"
$peekJson = $peek | ConvertTo-Json -Depth 10

Write-Host "health=$($health.status) ready=$($ready.ready) produce=$($produce.status)"
if ($peekJson -like "*${marker}*") {
    Write-Host "peek contains marker: OK" -ForegroundColor Green
    exit 0
} else {
    Write-Host "peek missing marker" -ForegroundColor Yellow
    $peekJson
    exit 1
}
