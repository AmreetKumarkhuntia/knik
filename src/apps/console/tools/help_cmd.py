"""Help command handler"""


def help_command(app, args: str) -> str:
    """Display available commands and usage information"""
    help_text = f"""
Available Commands:
  {app.config.command_prefix}help          - Show this help message
  {app.config.command_prefix}exit/quit     - Exit the application
  {app.config.command_prefix}clear         - Clear conversation history
  {app.config.command_prefix}history       - Show conversation history
  {app.config.command_prefix}voice <name>  - Change voice (e.g., af_sarah, am_adam)
  {app.config.command_prefix}info          - Show current configuration
  {app.config.command_prefix}toggle-voice  - Enable/disable voice output
  {app.config.command_prefix}tools         - Show available MCP tools

Just type your question to chat with AI!
"""
    return help_text.strip()
