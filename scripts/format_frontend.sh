#!/bin/bash

# Detect WSL and conditionally run the WSL variant
if [[ "$(uname -a)" == *[Ww][Ss][Ll]* ]] || [[ "$(uname -a)" == *microsoft* ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$SCRIPT_DIR/wsl/$(basename "$0")" "$@"
fi
# scripts/format_frontend.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$ROOT_DIR/src/apps/web/frontend"

# Run prettier from root
PRETTIER_BIN="$FRONTEND_DIR/node_modules/.bin/prettier"
PRETTIER_CONFIG="$FRONTEND_DIR/.prettierrc.json"

if [ $# -eq 0 ]; then
    "$PRETTIER_BIN" --config "$PRETTIER_CONFIG" --write "$FRONTEND_DIR/src/**/*.{ts,tsx,css,json}"
else
    "$PRETTIER_BIN" --config "$PRETTIER_CONFIG" --write "$@"
fi
