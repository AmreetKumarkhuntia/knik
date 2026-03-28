"""Console command for exiting the application."""


def exit_command(app, args: str) -> str:
    """Stop the application and display a farewell message."""
    app.running = False
    return "Goodbye! 👋"
