"""Clear command handler"""


def clear_command(app, args: str) -> str:
    """Clear conversation history"""
    app.history.clear()
    return "Conversation history cleared! 🗑️"
