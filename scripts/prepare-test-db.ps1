<#
.SYNOPSIS
    Creates the budgettracker_test database (if missing) and applies all
    Prisma migrations to it. Run from apps/api.

.EXAMPLE
    ..\scripts\prepare-test-db.ps1
#>

$ErrorActionPreference = "Stop"

$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
if (-not (Test-Path $psql)) {
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $cmd) { throw "psql not found. Set the `$psql path at the top of this script or add psql to PATH." }
    $psql = $cmd.Source
}

$user = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
$password = if ($env:PGPASSWORD) { $env:PGPASSWORD } else { "postgres" }
$testDb = "budgettracker_test"

Write-Host "Creating database '$testDb' (if missing)..." -ForegroundColor Cyan
$env:PGPASSWORD = $password
& $psql -U $user -h localhost -w -t -c "SELECT 1 FROM pg_database WHERE datname='$testDb';" | Out-Null
$exists = & $psql -U $user -h localhost -w -t -A -c "SELECT 1 FROM pg_database WHERE datname='$testDb';"
if ($exists -ne "1") {
    & $psql -U $user -h localhost -w -c "CREATE DATABASE $testDb;"
    Write-Host "Created $testDb" -ForegroundColor Green
} else {
    Write-Host "$testDb already exists" -ForegroundColor DarkGray
}

Write-Host "Applying Prisma migrations..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgresql://$user`:$password@localhost:5432/$testDb"
npx prisma migrate deploy
Write-Host "Done. Test database '$testDb' is migrated." -ForegroundColor Green