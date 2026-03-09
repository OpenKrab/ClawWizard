# ClawWizard Installation Script for Windows
# PowerShell script to set up ClawWizard development environment

Set-StrictMode -Version 3.0
$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════╗"
Write-Host "║      ClawWizard Installation        ║"
Write-Host "╚══════════════════════════════════════╝"
Write-Host ""

# Clone the repository if not already present
if (-not (Test-Path ".\.git")) {
    Write-Host "Cloning ClawWizard repository..."
    git clone https://github.com/OpenKrab/ClawWizard.git .
    Write-Host "✅ Repository cloned successfully!"
    Write-Host ""
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..."
$NodePath = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $NodePath) {
    Write-Host "❌ Node.js is not installed."
    Write-Host ""
    
    $response = Read-Host "Do you want to install Node.js automatically? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Installing Node.js via Chocolatey..."
        
        # Check if Chocolatey is installed
        $ChocoPath = (Get-Command choco -ErrorAction SilentlyContinue)
        if (-not $ChocoPath) {
            Write-Host "⚠️  Chocolatey not found. Installing Chocolatey first..."
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        }
        
        Write-Host "Installing Node.js..."
        choco install nodejs -y
        Write-Host "✅ Node.js installed successfully!"
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Host "Please install Node.js from https://nodejs.org/"
        exit 1
    }
}

$NodeVersion = node -v
Write-Host "✅ Node.js found: $NodeVersion"
Write-Host ""

# Check if npm is installed
Write-Host "Checking npm installation..."
$NpmPath = (Get-Command npm -ErrorAction SilentlyContinue)
if (-not $NpmPath) {
    Write-Host "❌ npm is not installed."
    Write-Host "Please install npm from https://nodejs.org/"
    exit 1
}

$NpmVersion = npm -v
Write-Host "✅ npm found: $NpmVersion"
Write-Host ""

# Diagnose and fix PATH for global npm packages
Write-Host "╔══════════════════════════════════════╗"
Write-Host "║     Checking npm PATH Configuration  ║"
Write-Host "╚══════════════════════════════════════╝"
Write-Host ""

$NpmGlobalPath = npm prefix -g
Write-Host "Diagnosing npm global prefix..."
Write-Host "  npm prefix -g: $NpmGlobalPath"
Write-Host ""

# Check if npm global path is in PATH
$PathArray = $env:Path -split ";"
$NpmInPath = $PathArray -contains $NpmGlobalPath

if ($NpmInPath) {
    Write-Host "✅ npm global bin is in your PATH"
} else {
    Write-Host "⚠️  npm global bin is NOT in your PATH"
    Write-Host ""
    
    $response = Read-Host "Do you want to fix this? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Adding npm global path to system PATH..."
        
        $CurrentUserPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $NewPath = "$NpmGlobalPath;$CurrentUserPath"
        [System.Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
        
        # Update session PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ Updated system PATH"
        Write-Host "Please restart your terminal to apply changes."
    }
}
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..."
npm install
Write-Host "✅ Dependencies installed successfully!"
Write-Host ""

# Build the project
Write-Host "Building ClawWizard..."
npm run build
Write-Host "✅ Build completed successfully!"
Write-Host ""

# Install OpenClaw
Write-Host "╔══════════════════════════════════════╗"
Write-Host "║       Installing OpenClaw Engine    ║"
Write-Host "╚══════════════════════════════════════╝"
Write-Host ""

$response = Read-Host "Do you want to install OpenClaw Gateway? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "Installing OpenClaw..."
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1)))
    Write-Host "✅ OpenClaw installed successfully!"
    Write-Host ""
} else {
    Write-Host "Skipping OpenClaw installation."
    Write-Host "To install later, run: & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1)))"
    Write-Host ""
}

Write-Host "╔══════════════════════════════════════╗"
Write-Host "║    Installation Completed! ✨       ║"
Write-Host "╚══════════════════════════════════════╝"
Write-Host ""
Write-Host "Available commands:"
Write-Host "  npm run dev          - Start development server"
Write-Host "  npm run build        - Build for production"
Write-Host "  npm run preview      - Preview production build"
Write-Host "  npm run models:export - Export models"
Write-Host ""

# Ask user if they want to start dev server
$response = Read-Host "Do you want to start development server now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "Starting development server..."
    npm run dev
} else {
    Write-Host "To start development later, run: npm run dev"
}
