"""Debug command for toggling debug mode."""


def debug_command(app, args: str) -> str:
    """
    Toggle debug mode or show current debug status.

    Usage:
        /debug              - Show current debug status
        /debug on           - Enable debug mode
        /debug off          - Disable debug mode
        /debug toggle       - Toggle debug mode

    Debug mode shows:
        - Verbose logging
        - Token counts
        - API call details
        - Processing times
        - Tool execution details
    """
    args = args.strip().lower()

    # Show current status
    if not args:
        status = "enabled" if app.debug_mode else "disabled"
        emoji = "🐛" if app.debug_mode else "🔇"
        result = f"{emoji} Debug mode: {status}\n\n"
        result += "Debug mode shows:\n"
        result += "  • Verbose logging\n"
        result += "  • Token counts\n"
        result += "  • API call details\n"
        result += "  • Processing times\n"
        result += "  • Tool execution details\n"
        result += "\nUsage: /debug <on|off|toggle>"
        return result

    # Handle commands
    if args in ["on", "enable", "true", "1"]:
        app.debug_mode = True
        return "✓ Debug mode enabled 🐛"

    elif args in ["off", "disable", "false", "0"]:
        app.debug_mode = False
        return "✓ Debug mode disabled 🔇"

    elif args in ["toggle"]:
        app.debug_mode = not app.debug_mode
        status = "enabled" if app.debug_mode else "disabled"
        emoji = "🐛" if app.debug_mode else "🔇"
        return f"✓ Debug mode {status} {emoji}"

    else:
        return "❌ Invalid argument. Use: /debug <on|off|toggle>"
