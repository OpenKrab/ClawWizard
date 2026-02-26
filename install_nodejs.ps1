$NodeVersion = "v22.13.1" # Latest LTS as of now
$InstallerUrl = "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-x64.msi"
$InstallerPath = "$env:TEMP\node-installer.msi"

Write-Host "🦞 ClawWizard Environment Setup" -ForegroundColor Cyan
Write-Host "----------------------------------"

# 1. Check if Node.js is already installed
try {
    $currentVersion = node -v
    Write-Host "✅ Node.js is already installed ($currentVersion)" -ForegroundColor Green
    exit
} catch {
    Write-Host "❌ Node.js not found. Starting automatic installation..." -ForegroundColor Yellow
}

# 2. Download Installer
Write-Host "🌐 Downloading Node.js $NodeVersion..." -ForegroundColor White
Invoke-WebRequest -Uri $InstallerUrl -OutFile $InstallerPath

# 3. Run Installer
Write-Host "📦 Installing Node.js... (A setup window might appear briefly)" -ForegroundColor White
Start-Process msiexec.exe -ArgumentList "/i `"$InstallerPath`" /qn /norestart" -Wait

# 4. Cleanup
Remove-Item $InstallerPath
Write-Host "✨ Node.js has been installed successfully!" -ForegroundColor Green
Write-Host "⚠️ IMPORTANT: Please CLOSE this window and OPEN a new one for changes to take effect." -ForegroundColor Cyan
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
