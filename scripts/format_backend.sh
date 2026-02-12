#!/bin/bash
# scripts/format_backend.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

source "$ROOT_DIR/.venv/bin/activate"

if [ $# -eq 0 ]; then
    ruff format .
else
    ruff format "$@"
fi
