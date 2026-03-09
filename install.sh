#!/bin/bash

# ClawWizard Installation Script
# This script sets up the development environment for ClawWizard

set -e

echo "╔══════════════════════════════════════╗"
echo "║      ClawWizard Installation        ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Show installed tool versions
echo "Checking installed tools..."
GIT_VER=$(git --version 2>/dev/null || echo "NOT FOUND")
NODE_VER_CUR=$(node -v 2>/dev/null || echo "NOT FOUND")
NPM_VER_CUR=$(npm -v 2>/dev/null || echo "NOT FOUND")
OPENCLAW_VER=$(openclaw --version 2>/dev/null || echo "NOT FOUND")
echo "  git     : $GIT_VER"
echo "  node    : $NODE_VER_CUR"
echo "  npm     : $NPM_VER_CUR"
echo "  openclaw: $OPENCLAW_VER"
echo ""

# Clone the repository if not already present
if [ ! -d ".git" ]; then
    echo "Cloning ClawWizard repository..."
    git clone https://github.com/OpenKrab/ClawWizard.git .
    echo "✅ Repository cloned successfully!"
    echo ""
fi

# Check if Node.js is installed
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "[->] Node.js not found — installing automatically..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo "[->] Homebrew not found — installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install node
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update -qq
            sudo apt-get install -y nodejs npm
        elif command -v yum &> /dev/null; then
            sudo yum install -y nodejs
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y nodejs
        else
            echo "❌ Unsupported package manager. Install Node.js from https://nodejs.org/"
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Install Node.js from https://nodejs.org/"
        exit 1
    fi
    echo "✅ Node.js installed successfully!"
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js found: $NODE_VERSION"
echo ""

# Check if npm is installed
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    echo "Please install npm from https://nodejs.org/"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm found: $NPM_VERSION"
echo ""

# Diagnose and fix PATH for global npm packages
echo "╔══════════════════════════════════════╗"
echo "║     Checking npm PATH Configuration  ║"
echo "╚══════════════════════════════════════╝"
echo ""

NPM_GLOBAL_PATH=$(npm prefix -g)
NPM_GLOBAL_BIN="$NPM_GLOBAL_PATH/bin"

echo "Diagnosing npm global prefix..."
echo "  npm prefix -g: $NPM_GLOBAL_PATH"
echo "  npm bin -g: $NPM_GLOBAL_BIN"
echo ""

# Check if npm global bin is in PATH
if [[ ":$PATH:" == *":$NPM_GLOBAL_BIN:"* ]]; then
    echo "✅ npm global bin is in your PATH"
else
    echo "[->] npm global bin not in PATH — fixing automatically..."
    if [[ "$SHELL" == *"zsh"* ]]; then
        SHELL_RC="$HOME/.zshrc"
    else
        SHELL_RC="$HOME/.bashrc"
    fi
    echo "" >> "$SHELL_RC"
    echo "# Added by ClawWizard installer" >> "$SHELL_RC"
    echo "export PATH=\"\$(npm prefix -g)/bin:\$PATH\"" >> "$SHELL_RC"
    export PATH="$NPM_GLOBAL_BIN:$PATH"
    echo "✅ Updated $SHELL_RC (effective immediately in this session)"
fi
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed successfully!"
echo ""
if [ -d "dist" ]; then
    echo "✅ dist/ already exists — skipping build"
    echo "   (run 'npm run build' manually to rebuild)"
else
    echo "Building ClawWizard..."
    npm run build
    echo "✅ Build completed successfully!"
fi
echo ""

# Install OpenClaw
echo "╔══════════════════════════════════════╗"
echo "║       Installing OpenClaw Engine    ║"
echo "╚══════════════════════════════════════╝"
echo ""
if command -v openclaw &> /dev/null; then
    OC_VER=$(openclaw --version 2>/dev/null || echo "")
    echo "✅ OpenClaw already installed${OC_VER:+ ($OC_VER)} — skipping"
else
    echo "[->] OpenClaw not found — installing automatically..."
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    echo "✅ OpenClaw installed successfully!"
fi

echo "╔══════════════════════════════════════╗"
echo "║    Installation Completed! ✨       ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Available commands:"
echo "  npm run dev           - Start development server"
echo "  npm run build         - Build for production"
echo "  npm run preview       - Preview production build"
echo "  npm run models:export - Export models"
echo ""

# Ask user if they want to start dev server
read -p "Do you want to start development server now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting development server..."
    npm run dev
else
    echo "To start development later, run: npm run dev"
fi
