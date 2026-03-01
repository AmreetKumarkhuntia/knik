#!/bin/bash

# Knik Console - Split Terminal Launcher
# Automatically creates a split view with conversation on left and logs on right

SESSION_NAME="knik-console"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed. Install it with: brew install tmux"
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Create new tmux session
tmux new-session -d -s $SESSION_NAME

# Split window vertically (side by side)
tmux split-window -h -t $SESSION_NAME

# Left pane (40% width): Main conversation
tmux send-keys -t $SESSION_NAME:0.0 "cd $(pwd)" C-m
tmux send-keys -t $SESSION_NAME:0.0 "source .venv/bin/activate" C-m
tmux send-keys -t $SESSION_NAME:0.0 "clear" C-m
tmux send-keys -t $SESSION_NAME:0.0 "npm run start:console 2>console_debug.log" C-m

# Right pane (60% width): Debug logs
tmux send-keys -t $SESSION_NAME:0.1 "cd $(pwd)" C-m
tmux send-keys -t $SESSION_NAME:0.1 "clear" C-m
tmux send-keys -t $SESSION_NAME:0.1 "echo '🐛 Debug Logs'" C-m
tmux send-keys -t $SESSION_NAME:0.1 "echo '============================================'" C-m
tmux send-keys -t $SESSION_NAME:0.1 "tail -f console_debug.log" C-m

# Adjust pane sizes (40% left, 60% right)
tmux resize-pane -t $SESSION_NAME:0.1 -x 60%

# Attach to the session
tmux attach-session -t $SESSION_NAME
