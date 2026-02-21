#!/bin/bash
# scripts/lint_frontend.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$ROOT_DIR/src/apps/web/frontend"

# Run eslint from root, pointing to config and using local binary
# This handles both relative and absolute paths correctly
ESLINT_BIN="$FRONTEND_DIR/node_modules/.bin/eslint"
ESLINT_CONFIG="$FRONTEND_DIR/eslint.config.js"

if [ $# -eq 0 ]; then
    "$ESLINT_BIN" --config "$ESLINT_CONFIG" "$FRONTEND_DIR"
else
    "$ESLINT_BIN" --config "$ESLINT_CONFIG" "$@"
fi
