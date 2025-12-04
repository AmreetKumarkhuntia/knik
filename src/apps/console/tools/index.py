"""Command registry and registration"""

from collections.abc import Callable


def get_command_registry() -> dict[str, Callable]:
    """
    Returns a dictionary mapping command names to their handler functions.
    Each handler receives (app, args: str) and returns str.
    """
    from .agent_cmd import agent_command
    from .clear_cmd import clear_command
    from .debug_cmd import debug_command
    from .exit_cmd import exit_command
    from .help_cmd import help_command
    from .history_cmd import history_command
    from .info_cmd import info_command
    from .model_cmd import model_command
    from .provider_cmd import provider_command
    from .toggle_voice_cmd import toggle_voice_command
    from .tools_cmd import tools_command
    from .voice_cmd import voice_command

    return {
        "help": help_command,
        "exit": exit_command,
        "quit": exit_command,
        "clear": clear_command,
        "history": history_command,
        "voice": voice_command,
        "info": info_command,
        "toggle-voice": toggle_voice_command,
        "tools": tools_command,
        "agent": agent_command,
        "provider": provider_command,
        "model": model_command,
        "debug": debug_command,
    }


def register_commands(app, console_processor):
    """
    Register all commands to the console processor.

    Args:
        app: ConsoleApp instance
        console_processor: ConsoleProcessor instance
    """
    command_registry = get_command_registry()

    for command_name, handler in command_registry.items():
        console_processor.register_command(command_name, lambda args, h=handler: h(app, args))

    return len(command_registry)
