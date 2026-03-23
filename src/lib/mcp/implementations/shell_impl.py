"""
MCP shell command tool implementation.

Wraps the common async shell function with a sync interface for MCP tools.
"""

from lib.services.shell import BLOCKED_COMMANDS, MAX_TIMEOUT
from lib.services.shell import run_shell_command as _async_run_shell_command
from lib.utils.async_utils import run_async
from lib.utils.printer import printer


def run_shell_command(command: str, timeout: int = 10) -> str:
    """Run a shell command synchronously via MCP tool interface.

    Wraps the common async run_shell_command with sync execution and
    MCP-friendly string return format.

    Args:
        command: The shell command to execute.
        timeout: Maximum execution time in seconds. Defaults to 10.
            Capped at MAX_TIMEOUT (30s).

    Returns:
        String result: stdout on success, formatted error on failure.
    """
    # LangChain may pass None for optional tool parameters even when a default exists
    if timeout is None:
        timeout = 10

    timeout = min(timeout, MAX_TIMEOUT)

    printer.info(f'Executing shell command: "{command}" with timeout {timeout}s')

    # Use the common async implementation
    result = run_async(_async_run_shell_command(command, timeout=timeout, blocked_commands=BLOCKED_COMMANDS))

    # Convert dict result to MCP-friendly string format
    if "error" in result:
        return f"Error: {result['error']}"

    if result.get("return_code", 0) != 0:
        response = f"Exit code: {result['return_code']}\n"
        if result.get("stderr"):
            response += f"Error: {result['stderr']}\n"
        if result.get("result"):
            response += f"Output: {result['result']}"
        printer.warning(
            f"Command failed with exit code {result['return_code']} with error: {result.get('stderr', '').strip()}"
        )
        return response.strip()

    result_text = result.get("result", "") or "Command executed successfully (no output)"
    printer.info(f"Command completed: {result_text[:100]}{'...' if len(result_text) > 100 else ''}")
    return result_text


SHELL_IMPLEMENTATIONS = {
    "run_shell_command": run_shell_command,
}
