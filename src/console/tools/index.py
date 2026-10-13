"""Console-only command registry and registration."""

from collections.abc import Callable


def get_command_registry() -> dict[str, Callable]:
    """
    Returns console-only commands. Shared commands (model, provider, status,
    new, sessions, resume) are handled by ConsoleCommandDispatcher in commands/.
    Each handler receives (app, args: str) and returns str.
    """
    from .agent_cmd import agent_command
    from .clear_cmd import clear_command
    from .debug_cmd import debug_command
    from .exit_cmd import exit_command
    from .history_cmd import history_command
    from .toggle_voice_cmd import toggle_voice_command
    from .tools_cmd import tools_command
    from .voice_cmd import voice_command
    from .workflow_cmd import workflow_command

    return {
        "exit": exit_command,
        "quit": exit_command,
        "clear": clear_command,
        "history": history_command,
        "voice": voice_command,
        "toggle-voice": toggle_voice_command,
        "tools": tools_command,
        "agent": agent_command,
        "debug": debug_command,
        "workflow": workflow_command,
    }


def register_commands(app, console_processor):
    """Register console-only commands to the console processor."""
    command_registry = get_command_registry()

    for command_name, handler in command_registry.items():
        console_processor.register_command(command_name, lambda args, h=handler: h(app, args))

    return len(command_registry)
