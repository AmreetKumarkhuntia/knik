"""
Shell command execution service.

Provides an async shell command runner with safety checks (blocked commands).
"""

from .executor import BLOCKED_COMMANDS, MAX_TIMEOUT, run_shell_command


__all__ = [
    "run_shell_command",
    "BLOCKED_COMMANDS",
    "MAX_TIMEOUT",
]
