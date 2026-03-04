#!/bin/bash

# Detect WSL and conditionally run the WSL variant
if [[ "$(uname -a)" == *[Ww][Ss][Ll]* ]] || [[ "$(uname -a)" == *microsoft* ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$SCRIPT_DIR/wsl/$(basename "$0")" "$@"
fi

# Knik Console - Dual Window Launcher
# Opens two native Terminal windows side-by-side

# Get the project root directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load environment variables from .env file if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo "📄 Loading configuration from .env..."
    set -a  # Auto-export all variables
    source "$SCRIPT_DIR/.env"
    set +a
else
    echo "⚠️  No .env file found, using defaults"
fi

# Setup log file in /tmp
LOG_FILE="/tmp/knik_console_debug.log"
echo "🚀 Launching Knik Console with dual windows..."
echo "📝 Main conversation → Left window"
echo "🐛 Debug logs → Right window"
echo "📄 Log file: $LOG_FILE"
echo ""

# Kill any existing processes and clean old logs
pkill -f "python.*console" 2>/dev/null
rm -f "$LOG_FILE"

# Create AppleScript to launch dual terminals
osascript <<EOF
tell application "Terminal"
    activate

    -- First window: Main Console (left side)
    do script "cd '$SCRIPT_DIR' && clear && echo '🤖 Knik Console - Main Window' && echo '================================' && echo '' && source .env && source .venv/bin/activate && arch -arm64 python src/main.py --mode console 2> '$LOG_FILE'"

    -- Wait a moment for first window to start
    delay 1

    -- Second window: Debug Logs (right side)
    do script "clear && echo '🐛 Debug Logs' && echo '================================' && echo '' && echo 'Waiting for logs...' && echo '' && tail -f '$LOG_FILE'"

    -- Position windows side by side
    set the bounds of window 1 to {0, 50, 600, 850}
    set the bounds of window 2 to {620, 50, 1420, 850}
end tell
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dual terminal launched successfully!"
    echo ""
    echo "💡 Tips:"
    echo "   - Main conversation is in the LEFT window"
    echo "   - Debug logs stream in the RIGHT window"
    echo "   - Use Cmd+W to close each window when done"
    echo "   - Logs are saved to: $LOG_FILE"
else
    echo ""
    echo "❌ Failed to launch dual terminals"
    echo ""
    echo "Alternative: Run manually in two terminals:"
    echo "  Terminal 1: cd $SCRIPT_DIR && arch -arm64 python src/main.py --mode console 2>'$LOG_FILE'"
    echo "  Terminal 2: tail -f '$LOG_FILE'"
fi
