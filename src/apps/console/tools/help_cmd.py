def help_command(app, args: str) -> str:
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
  {app.config.command_prefix}agent <query> - Execute query using agent (non-streaming)

Chat Features:
  • Agent-powered streaming responses by default
  • Multi-step reasoning and complex task handling
  • Real-time voice output (if enabled)
  
Just type your question to chat with AI!
"""
    return help_text.strip()
