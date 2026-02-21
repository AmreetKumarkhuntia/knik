#!/bin/bash
# Start Knik Web App Frontend (React + Vite)

# Exit on error
set -e

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🎨 Starting Knik Frontend..."
echo "📁 Project root: $PROJECT_ROOT"

# Change to frontend directory
cd "$PROJECT_ROOT/src/apps/web/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run frontend dev server
echo "✨ Starting Vite dev server on http://localhost:5173"
npm run dev
