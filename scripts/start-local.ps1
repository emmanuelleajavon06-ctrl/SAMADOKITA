# SamaDokita — Démarrage stack locale Windows
# Usage : .\scripts\start-local.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "=== SamaDokita — Démarrage ===" -ForegroundColor Cyan

# 1. PostgreSQL
Write-Host "[1/5] PostgreSQL..." -ForegroundColor Yellow
$pg = Get-Process postgres -ErrorAction SilentlyContinue
if (-not $pg) {
    Start-Process -FilePath "C:\samadokita\pg\bin\pg_ctl.exe" -ArgumentList '-D','C:\samadokita\pgdata','-l','C:\samadokita\pg.log','start' -WindowStyle Hidden
    Start-Sleep -Seconds 4
}
Write-Host "  OK" -ForegroundColor Green

# 2. Redis
Write-Host "[2/5] Redis..." -ForegroundColor Yellow
$redisProc = Get-Process redis-server -ErrorAction SilentlyContinue
if (-not $redisProc) {
    Start-Process -FilePath "C:\samadokita\redis\redis-server.exe" -ArgumentList '--port','6379' -WindowStyle Hidden
    Start-Sleep -Seconds 2
}
Write-Host "  OK" -ForegroundColor Green

# 3. SeaweedFS S3
Write-Host "[3/5] SeaweedFS S3..." -ForegroundColor Yellow
$weedProc = Get-Process weed -ErrorAction SilentlyContinue
if (-not $weedProc) {
    Start-Process -FilePath "C:\samadokita\seaweed\weed.exe" -ArgumentList 'server','-dir=C:\samadokita\seaweed-data','-s3=true','-s3.port=9000','-s3.config=C:\samadokita\s3-config.json','-volume.max=10','-ip=localhost' -WindowStyle Hidden
    Start-Sleep -Seconds 8
}
Write-Host "  OK" -ForegroundColor Green

# 4. Backend
Write-Host "[4/5] Backend (NestJS)..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$backend = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "nest" }
Set-Location "$root\backend"
Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WindowStyle Hidden -RedirectStandardOutput "$root\backend.log" -RedirectStandardError "$root\backend.err"
Start-Sleep -Seconds 5
Write-Host "  OK" -ForegroundColor Green

# 5. Frontend
Write-Host "[5/5] Frontend (Next.js)..." -ForegroundColor Yellow
Set-Location "$root\frontend"
Start-Process -FilePath "node" -ArgumentList "node_modules\next\dist\bin\next","start" -WindowStyle Hidden -RedirectStandardOutput "$root\frontend.log" -RedirectStandardError "$root\frontend.err"
Start-Sleep -Seconds 5
Write-Host "  OK" -ForegroundColor Green

Write-Host ""
Write-Host "=== SamaDokita prête ===" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "  API Docs : http://localhost:3001/api/docs" -ForegroundColor White
