#!/bin/bash

# Exit on error
set -e

echo "Setting up Knik Project..."

# Setup Node.js dependencies
if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Setup Python virtual environment
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
echo "To start the application, you can map out npm run scripts:"
echo "  npm run start"
echo "========================================="
