def clear_command(app, args: str) -> str:
    app.history.clear()
    return "Conversation history cleared! 🗑️"
