SHELL_DEFINITIONS = [
    {
        "name": "run_shell_command",
        "description": "Execute shell commands on the user's local machine. The LLM can use this tool to run system operations, file operations, git commands, and other shell-level tasks directly within the user's environment.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "The shell command to execute (e.g., 'ls -la', 'git status', 'pwd')."
                },
                "timeout": {
                    "type": "integer",
                    "description": "Maximum time (in seconds) to allow the command to run. Default is 10 seconds, maximum allowed is 30 seconds.",
                    "default": 10
                }
            },
            "required": ["command"]
        }
    }
]
