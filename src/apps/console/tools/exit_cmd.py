def exit_command(app, args: str) -> str:
    app.running = False
    return "Goodbye! 👋"
