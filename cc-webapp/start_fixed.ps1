# PowerShell script to start the backend with the fixed main file
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath
Set-Location $scriptDir

Write-Host "Starting backend server with fixed main file..."
Set-Location -Path ".\backend"
uvicorn app.main_fixed:app --host 0.0.0.0 --port 8000 --reload
