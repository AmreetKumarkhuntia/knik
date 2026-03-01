#!/bin/bash

# Detect WSL and conditionally run the WSL variant
if [[ "$(uname -a)" == *[Ww][Ss][Ll]* ]] || [[ "$(uname -a)" == *microsoft* ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$SCRIPT_DIR/wsl/$(basename "$0")" "$@"
fi
# scripts/typecheck_backend.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

source "$ROOT_DIR/.venv/bin/activate"

# Pyright needs the project root
cd "$ROOT_DIR"

if [ $# -eq 0 ]; then
    pyright
else
    pyright "$@"
fi
