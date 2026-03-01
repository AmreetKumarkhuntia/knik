#!/bin/bash

# Detect WSL and conditionally run the WSL variant
if [[ "$(uname -a)" == *[Ww][Ss][Ll]* ]] || [[ "$(uname -a)" == *microsoft* ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$SCRIPT_DIR/wsl/$(basename "$0")" "$@"
fi
# scripts/format_backend.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

source "$ROOT_DIR/.venv/bin/activate"

if [ $# -eq 0 ]; then
    ruff format .
else
    ruff format "$@"
fi
