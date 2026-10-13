"""Console command for toggling voice output on/off."""


def toggle_voice_command(app, args: str) -> str:
    """Toggle voice output on or off."""
    app.config.enable_voice_output = not app.config.enable_voice_output
    status = "enabled" if app.config.enable_voice_output else "disabled"
    return f"Voice output {status} 🔊"
