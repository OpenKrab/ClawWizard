# ClawWizard Installation Script for Windows PowerShell

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=================================="
Write-Host "   ClawWizard Installation"
Write-Host "=================================="
Write-Host ""

# ── Version check helper ──────────────────────────────────────────────────────
function Get-VersionOrEmpty($cmd) {
    try { & $cmd --version 2>$null } catch { "" }
}

# ── Dependency check summary ──────────────────────────────────────────────────
Write-Host "Checking installed tools..."

$GitVer   = Get-VersionOrEmpty "git"
$NodeVer  = if (Get-Command node -ErrorAction SilentlyContinue) { node -v } else { "" }
$NpmVer   = if (Get-Command npm  -ErrorAction SilentlyContinue) { npm -v  } else { "" }
$ChocoVer = if (Get-Command choco -ErrorAction SilentlyContinue) { choco -v } else { "" }

Write-Host "  git     : $(if ($GitVer)   { $GitVer }   else { 'NOT FOUND' })"
Write-Host "  node    : $(if ($NodeVer)  { $NodeVer }  else { 'NOT FOUND' })"
Write-Host "  npm     : $(if ($NpmVer)   { $NpmVer }   else { 'NOT FOUND' })"
Write-Host "  choco   : $(if ($ChocoVer) { $ChocoVer } else { 'NOT FOUND' })"
Write-Host ""

# ── git check ────────────────────────────────────────────────────────────────
if (-not $GitVer) {
    Write-Host "[ERR] git is required. Install from https://git-scm.com/"
    exit 1
}

# ── Clone or enter ClawWizard directory ──────────────────────────────────────
$ClawDir = Join-Path $PWD.Path "ClawWizard"

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

# ── Node.js ───────────────────────────────────────────────────────────────────
if ($NodeVer) {
    Write-Host "[SKIP] Node.js already installed ($NodeVer)"
} else {
    Write-Host "[->] Node.js not found — installing automatically..."
    if (-not $ChocoVer) {
        Write-Host "[->] Installing Chocolatey..."
        Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
    }
    Write-Host "[->] Installing Node.js..."
    choco install nodejs -y
    $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
    $NodeVer = node -v
    Write-Host "[OK] Node.js installed: $NodeVer"
}

# ── npm ───────────────────────────────────────────────────────────────────────
if ($NpmVer) {
    Write-Host "[SKIP] npm already installed ($NpmVer)"
} else {
    Write-Host "[ERR] npm not found. Reinstall Node.js from https://nodejs.org/"
    exit 1
}
Write-Host ""

# ── PATH check ───────────────────────────────────────────────────────────────
Write-Host "Checking npm global PATH..."
$NpmGlobal = (npm prefix -g).Trim()
if (($env:Path -split ";") -contains $NpmGlobal) {
    Write-Host "[OK] PATH includes $NpmGlobal"
} else {
    Write-Host "[->] $NpmGlobal not in PATH — fixing automatically..."
    $UserPath = [Environment]::GetEnvironmentVariable("Path","User")
    [Environment]::SetEnvironmentVariable("Path","$NpmGlobal;$UserPath","User")
    $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "[OK] PATH updated - restart terminal to take effect."
}
Write-Host ""

# ── node_modules already exists? ─────────────────────────────────────────────
if (Test-Path "node_modules") {
    Write-Host "[SKIP] node_modules already exists - skipping npm install"
    Write-Host "       (run 'npm install' manually to update dependencies)"
} else {
    Write-Host "Installing dependencies..."
    $env:npm_config_progress = "false"
    npm install --no-fund --no-audit --loglevel=error
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Dependencies installed."
    } else {
        Write-Host "[WARN] npm install exit $LASTEXITCODE"
    }
}
Write-Host ""

# ── Build ─────────────────────────────────────────────────────────────────────
if (Test-Path "dist") {
    Write-Host "[SKIP] dist/ folder already exists - skipping build"
    Write-Host "       (run 'npm run build' manually to rebuild)"
} else {
    Write-Host "Building ClawWizard..."
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Build complete."
    } else {
        Write-Host "[WARN] Build had issues - you can still run 'npm run dev'."
    }
}
Write-Host ""

# ── OpenClaw ─────────────────────────────────────────────────────────────────
$OpenClawVer = if (Get-Command openclaw -ErrorAction SilentlyContinue) { openclaw --version 2>$null } else { "" }

Write-Host "=================================="
Write-Host "   OpenClaw Gateway"
Write-Host "=================================="
Write-Host ""

if ($OpenClawVer) {
    Write-Host "[SKIP] OpenClaw already installed ($OpenClawVer)"
} else {
    Write-Host "[->] OpenClaw not found — installing automatically..."
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1)))
    Write-Host "[OK] OpenClaw installed."
}
Write-Host ""

# ── Done ──────────────────────────────────────────────────────────────────────
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