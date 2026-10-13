from lib.services.ai_client.base_tool import BaseTool


SHELL_DEFINITIONS = [
    {
        "name": "run_shell_command",
        "description": "Execute shell commands on the user's local machine. The LLM can use this tool to run system operations, file operations, git commands, and other shell-level tasks directly within the user's environment.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "The shell command to execute (e.g., 'ls -la', 'git status', 'pwd').",
                },
                "timeout": {
                    "type": "integer",
                    "description": "Maximum time (in seconds) to allow the command to run. Default is 10 seconds, maximum allowed is 30 seconds.",
                    "default": 10,
                },
            },
            "required": ["command"],
        },
    }
]
from lib.services.shell import BLOCKED_COMMANDS, MAX_TIMEOUT
from lib.services.shell import run_shell_command as _async_run_shell_command
from lib.utils.async_utils import run_async
from lib.utils.printer import printer


class ShellTool(BaseTool):
    consent_required_for = frozenset({"run_shell_command"})

    @property
    def name(self) -> str:
        return "shell"

    def get_definitions(self):
        return SHELL_DEFINITIONS

    def get_implementations(self):
        return {"run_shell_command": self._run_shell_command}

    @staticmethod
    def _run_shell_command(command: str, timeout: int = 10) -> str:
        if timeout is None:
            timeout = 10

        timeout = min(timeout, MAX_TIMEOUT)

        printer.info(f'Executing shell command: "{command}" with timeout {timeout}s')

        result = run_async(_async_run_shell_command(command, timeout=timeout, blocked_commands=BLOCKED_COMMANDS))

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
