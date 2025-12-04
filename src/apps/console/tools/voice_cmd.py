def voice_command(app, args: str) -> str:
    if not args:
        return f"Current voice: {app.config.voice_name}\nUsage: {app.config.command_prefix}voice <name>"

    try:
        if app.tts_processor:
            app.tts_processor.set_voice(args.strip())
            app.config.voice_name = args.strip()
        return f"Voice changed to: {args.strip()} 🎙️"
    except Exception as e:
        return f"Failed to change voice: {e}"
