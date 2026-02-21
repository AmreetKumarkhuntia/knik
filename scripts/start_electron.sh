#!/bin/bash

# Knik Electron Dev Mode Startup Script
# Starts backend + frontend + Electron in development mode

echo "🚀 Starting Knik Electron App (Development Mode)..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Loaded .env file"
else
    echo "⚠️  Warning: .env file not found"
fi

# Activate Python virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✓ Activated Python virtual environment"
else
    echo "❌ Error: .venv not found. Run 'python -m venv .venv' first"
    exit 1
fi

echo ""
echo "📦 Starting services..."
echo "  - Backend API: http://localhost:8000"
echo "  - Frontend Dev Server: http://localhost:5173"
echo "  - Electron Window: Loading..."
echo ""

# Run with npm script
npm run electron:dev
