"""Exit command handler"""


def exit_command(app, args: str) -> str:
    """Exit the application"""
    app.running = False
    return "Goodbye! 👋"
