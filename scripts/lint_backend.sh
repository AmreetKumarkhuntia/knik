#!/bin/bash

# Detect WSL and conditionally run the WSL variant
if [[ "$(uname -a)" == *[Ww][Ss][Ll]* ]] || [[ "$(uname -a)" == *microsoft* ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$SCRIPT_DIR/wsl/$(basename "$0")" "$@"
fi
# scripts/lint_backend.sh

# Get directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Activate virtual environment
source "$ROOT_DIR/.venv/bin/activate"

# Run ruff check
# If arguments are provided, use them; otherwise check current directory "."
if [ $# -eq 0 ]; then
    ruff check .
else
    ruff check "$@"
fi
