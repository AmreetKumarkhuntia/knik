"""
Common shell command execution.

Provides an async shell command runner with safety checks (blocked commands)
that is shared between the scheduler workflow engine and MCP tool layer.
"""

import asyncio
import time
from typing import Any


# Commands blocked for safety — prevents destructive operations
BLOCKED_COMMANDS: list[str] = ["rm -rf", "mkfs", "dd if=", ":(){", "fork", ">(", "sudo rm"]

# Maximum allowed timeout for shell commands
MAX_TIMEOUT: int = 30


async def run_shell_command(
    command: str,
    timeout: int = 30,
    blocked_commands: list[str] | None = None,
) -> dict[str, Any]:
    """Run a shell command asynchronously and return structured results.

    Includes safety checks against a configurable blocklist of dangerous commands.

    Args:
        command: The shell command to execute.
        timeout: Maximum execution time in seconds. Capped at MAX_TIMEOUT.
        blocked_commands: Optional override for the blocked commands list.
            Defaults to BLOCKED_COMMANDS if not provided.

    Returns:
        Dict with keys:
        - On success: 'result' (stdout), 'stderr', 'return_code', 'duration_ms'
        - On error: 'error' (description string)
    """
    effective_blocklist = blocked_commands if blocked_commands is not None else BLOCKED_COMMANDS
    timeout = min(timeout, MAX_TIMEOUT)

    # Safety check: block dangerous commands
    command_lower = command.lower()
    for blocked in effective_blocklist:
        if blocked in command_lower:
            return {"error": f"Command blocked for safety reasons. Cannot execute commands containing '{blocked}'"}

    req_start = time.perf_counter()
    try:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except TimeoutError:
            proc.kill()
            await proc.communicate()
            return {"error": f"Command timed out after {timeout}s: {command}"}

        duration_ms = int((time.perf_counter() - req_start) * 1000)
        stdout = stdout_bytes.decode(errors="replace").strip()
        stderr = stderr_bytes.decode(errors="replace").strip()

        return {
            "result": stdout,
            "stderr": stderr,
            "return_code": proc.returncode,
            "duration_ms": duration_ms,
        }
    except Exception as e:
        return {"error": f"Shell command failed: {str(e)}"}
