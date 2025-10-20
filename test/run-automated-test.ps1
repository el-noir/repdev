# Automated Test for Network Configuration
Write-Host "=== RepDev Network Configuration Test ===" -ForegroundColor Cyan

# Clean up previous tests
$testDir = "d:\Projects\Startup\repdev\test\test-automated"
if (Test-Path $testDir) {
    Remove-Item -Recurse -Force $testDir
}

# Create test directory
New-Item -ItemType Directory -Path $testDir | Out-Null
Set-Location $testDir

Write-Host "`n1. Testing: repdev init (no preset) - Should FAIL" -ForegroundColor Yellow
repdev init
Write-Host ""

Write-Host "2. Testing: repdev init --list" -ForegroundColor Yellow
repdev init --list
Write-Host ""

Write-Host "3. Testing: repdev init -p network-demo (preset with networks)" -ForegroundColor Yellow
repdev init -p network-demo --force
Write-Host ""

if (Test-Path "repdev.yml") {
    Write-Host "4. Checking generated YAML for networks..." -ForegroundColor Yellow
    $yaml = Get-Content repdev.yml -Raw
    
    if ($yaml -match "networks:") {
        Write-Host "   ✅ Networks section found!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Networks section NOT found!" -ForegroundColor Red
    }
    
    Write-Host "`n5. Validating template..." -ForegroundColor Yellow
    repdev validate
    Write-Host ""
    
    Write-Host "6. Generated repdev.yml preview:" -ForegroundColor Yellow
    Write-Host "---" -ForegroundColor Gray
    Get-Content repdev.yml | Select-Object -First 50
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host "`nTo test interactive prompts manually:" -ForegroundColor Cyan
Write-Host "  cd $testDir" -ForegroundColor White
Write-Host "  Remove-Item repdev.yml" -ForegroundColor White
Write-Host "  repdev init -p mern" -ForegroundColor White
Write-Host "  # Then answer the prompts interactively" -ForegroundColor Gray

Set-Location "d:\Projects\Startup\repdev"
