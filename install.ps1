# ClawWizard Installation Script for Windows PowerShell

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=================================="
Write-Host "   ClawWizard Installation"
Write-Host "=================================="
Write-Host ""

# Clone or enter ClawWizard directory
$StartDir = $PWD.Path
$ClawDir  = Join-Path $StartDir "ClawWizard"

if (Test-Path (Join-Path $PWD.Path "package.json")) {
    Write-Host "[OK] Already inside ClawWizard directory."
    Write-Host ""
} elseif (Test-Path $ClawDir) {
    Write-Host "[->] Entering existing ClawWizard directory..."
    Set-Location $ClawDir
    Write-Host "[OK] Entered: $ClawDir"
    Write-Host ""
} else {
    Write-Host "[->] Cloning ClawWizard repository..."
    git clone https://github.com/OpenKrab/ClawWizard.git ClawWizard
    if ($LASTEXITCODE -eq 0) {
        Set-Location $ClawDir
        Write-Host "[OK] Cloned to: $ClawDir"
    } else {
        Write-Host "[ERR] Clone failed."
        exit 1
    }
    Write-Host ""
}

Write-Host "Working directory: $($PWD.Path)"
Write-Host ""

# Node.js
Write-Host "Checking Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERR] Node.js not found."
    $r = Read-Host "Install via Chocolatey? (y/n)"
    if ($r -in 'y','Y') {
        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Write-Host "[->] Installing Chocolatey..."
            Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        }
        choco install nodejs -y
        $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "[OK] Node.js installed."
    } else {
        Write-Host "Please install from https://nodejs.org/ then rerun."
        exit 1
    }
} else {
    Write-Host "[OK] Node.js $(node -v)"
}

# npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERR] npm not found. Reinstall Node.js from https://nodejs.org/"
    exit 1
}
Write-Host "[OK] npm $(npm -v)"
Write-Host ""

# PATH check
Write-Host "Checking npm global PATH..."
$NpmGlobal = (npm prefix -g).Trim()
if (($env:Path -split ";") -contains $NpmGlobal) {
    Write-Host "[OK] PATH includes $NpmGlobal"
} else {
    Write-Host "[WARN] $NpmGlobal not in PATH"
    $r = Read-Host "Fix automatically? (y/n)"
    if ($r -in 'y','Y') {
        $UserPath = [Environment]::GetEnvironmentVariable("Path","User")
        [Environment]::SetEnvironmentVariable("Path","$NpmGlobal;$UserPath","User")
        $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "[OK] PATH updated - restart terminal to take effect."
    }
}
Write-Host ""

# Install deps
Write-Host "Installing dependencies..."
$env:npm_config_progress = "false"
npm install --no-fund --no-audit --loglevel=error
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Dependencies installed."
} else {
    Write-Host "[WARN] npm install exit $LASTEXITCODE"
}
Write-Host ""

# Build
Write-Host "Building ClawWizard..."
npm run build --if-present
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Build complete."
} else {
    Write-Host "[WARN] Build had issues - you can still run 'npm run dev'."
}
Write-Host ""

# OpenClaw
Write-Host "=================================="
Write-Host "   OpenClaw Gateway (optional)"
Write-Host "=================================="
Write-Host ""
$r = Read-Host "Install OpenClaw Gateway? (y/n)"
if ($r -in 'y','Y') {
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1)))
    Write-Host "[OK] OpenClaw installed."
} else {
    Write-Host "[SKIP] To install later:"
    Write-Host "  & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1)))"
}
Write-Host ""

# Done
Write-Host "=================================="
Write-Host "   Installation Complete!"
Write-Host "=================================="
Write-Host ""
Write-Host "Commands:"
Write-Host "  npm run dev           - Start dev server (http://localhost:5173)"
Write-Host "  npm run build         - Build for production"
Write-Host "  npm run preview       - Preview production build"
Write-Host "  npm run models:export - Export models"
Write-Host ""

$r = Read-Host "Start dev server now? (y/n)"
if ($r -in 'y','Y') {
    Write-Host ""
    Write-Host "Starting... (Ctrl+C to stop)"
    npm run dev
} else {
    Write-Host "Run 'npm run dev' when ready."
}