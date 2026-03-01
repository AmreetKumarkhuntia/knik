#!/bin/bash
# Start Knik Web App Backend

# Exit on error
set -e

# Get the project root directory (scripts/ is one level below project root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🚀 Starting Knik Backend..."
echo "📁 Project root: $PROJECT_ROOT"

# Load environment variables if .env exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "📝 Loading environment variables from .env..."
    # Source the .env file directly (handles export statements)
    set -a  # automatically export all variables
    source "$PROJECT_ROOT/.env"
    set +a  # turn off auto-export
    echo "✅ Loaded: AI_MODEL=${KNIK_AI_MODEL:-not set}, PROVIDER=${KNIK_AI_PROVIDER:-not set}"
else
    echo "⚠️  No .env file found (optional)"
fi

# Activate virtual environment
if [ -f "$PROJECT_ROOT/.venv/bin/activate" ]; then
    echo "🐍 Activating virtual environment..."
    source "$PROJECT_ROOT/.venv/bin/activate"
else
    echo "❌ Virtual environment not found at $PROJECT_ROOT/.venv"
    exit 1
fi

# Change to src directory (for imports.py to work)
cd "$PROJECT_ROOT/src"

# Run backend module
echo "✨ Starting FastAPI server on http://localhost:8000"
python -m apps.web.backend.main
