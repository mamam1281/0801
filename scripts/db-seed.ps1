param(
  [string]$DbName = "cc_webapp",
  [string]$User = "cc_user",
  [string]$Password = "cc_password",
  [string]$SqlFile = "${PSScriptRoot}\\..\\database\\seed.sql"
)

$ErrorActionPreference = "Stop"
if (!(Test-Path $SqlFile)) { throw "SQL file not found: $SqlFile" }
Write-Host "Seeding database from $SqlFile ..."
$env:PGPASSWORD = $Password

# Copy the file into container to preserve UTF-8 encoding reliably
docker cp $SqlFile cc_postgres:/tmp/seed.sql
docker exec cc_postgres psql -U $User -d $DbName -v ON_ERROR_STOP=1 -f /tmp/seed.sql
Write-Host "Seed completed."
