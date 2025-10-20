# Test script for network configuration
Write-Host "Testing RepDev Init with Network Configuration..." -ForegroundColor Cyan

# Clean up
if (Test-Path "test-network-init") {
    Remove-Item -Recurse -Force "test-network-init"
}

# Create test directory
New-Item -ItemType Directory -Path "test-network-init" | Out-Null
Set-Location "test-network-init"

Write-Host "`n=== Test 1: Init without preset (should fail) ===" -ForegroundColor Yellow
repdev init

Write-Host "`n=== Test 2: List presets ===" -ForegroundColor Yellow
repdev init --list

Write-Host "`n=== Test 3: Init with preset (will prompt for network config) ===" -ForegroundColor Yellow
Write-Host "Note: This will require interactive input" -ForegroundColor Green
Write-Host "Try answering:" -ForegroundColor Green
Write-Host "  - Backend directory: ./backend" -ForegroundColor Green
Write-Host "  - Frontend directory: ./frontend" -ForegroundColor Green
Write-Host "  - Backend port: 3000" -ForegroundColor Green
Write-Host "  - Frontend port: 5173" -ForegroundColor Green
Write-Host "  - Package manager: npm" -ForegroundColor Green
Write-Host "  - Custom networks: Yes" -ForegroundColor Green
Write-Host "  - Network mode: Custom networks" -ForegroundColor Green
Write-Host "  - Network names: frontend,backend,database" -ForegroundColor Green
Write-Host "  - Static IP: Yes" -ForegroundColor Green
Write-Host "  - Subnet: 172.25.0.0/16" -ForegroundColor Green

# Clean up
Set-Location ..
