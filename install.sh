#!/bin/bash

# ClawWizard Installation Script
# This script sets up the development environment for ClawWizard

set -e

echo "╔══════════════════════════════════════╗"
echo "║      ClawWizard Installation        ║"
echo "╚══════════════════════════════════════╝"
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
    echo "❌ Node.js is not installed."
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
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

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed successfully!"
echo ""

# Build the project
echo "Building ClawWizard..."
npm run build
echo "✅ Build completed successfully!"
echo ""

echo "╔══════════════════════════════════════╗"
echo "║    Installation Completed! ✨       ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run preview      - Preview production build"
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
echo "Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run preview      - Preview production build"
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
