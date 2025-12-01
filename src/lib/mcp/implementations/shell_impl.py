import subprocess
import os
from ...utils.printer import printer

BLOCKED_COMMANDS = ['rm -rf', 'mkfs', 'dd if=', ':(){', 'fork', '>(', 'sudo rm']
MAX_TIMEOUT = 30


def run_shell_command(command: str, timeout: int = 10) -> str:
    timeout = min(timeout, MAX_TIMEOUT)

    printer.info(f"Executing shell command: \"{command}\" with timeout {timeout}s")

    for blocked in BLOCKED_COMMANDS:
        if blocked in command.lower():
            return f"Error: Command blocked for safety reasons. Cannot execute commands containing '{blocked}'"
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.getcwd()
        )
        
        output = result.stdout if result.stdout else ""
        error = result.stderr if result.stderr else ""
        
        if result.returncode != 0:
            response = f"Exit code: {result.returncode}\n"
            if error:
                response += f"Error: {error}\n"
            if output:
                response += f"Output: {output}"
            return response.strip()
        
        return output if output else "Command executed successfully (no output)"
        
    except subprocess.TimeoutExpired:
        return f"Error: Command timed out after {timeout} seconds"
    except Exception as e:
        return f"Error executing command: {str(e)}"


SHELL_IMPLEMENTATIONS = {
    "run_shell_command": run_shell_command,
}
