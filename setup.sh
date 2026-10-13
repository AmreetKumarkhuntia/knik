#!/bin/bash

set -e

echo "Setting up Knik Project..."

if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo "Setting up Python virtual environment..."
if command -v uv &> /dev/null; then
    echo "Using uv for dependency management..."
    uv venv
    source .venv/bin/activate
    uv pip install -r requirements.txt
else
    echo "Using standard pip for dependency management..."
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    python -m ensurepip
    python -m pip install --upgrade pip
    pip install -r requirements.txt
fi

echo "========================================="
echo "Setup complete! ✅"
echo "To activate the virtual environment, run:"
echo "  source .venv/bin/activate"
echo "To start the application, use one of the npm run scripts:"
echo "  npm run start:web:backend   # web backend (port 8010)"
echo "  npm run start:web:frontend  # web frontend (port 8020)"
echo "  npm run start:bot           # Telegram bot"
echo "  npm run start:worker        # workflow scheduler"
echo "  npm run start:console       # terminal chat"
echo "========================================="
