def info_command(app, args: str) -> str:
    ai_info = app.ai_client.get_info()
    voice_status = 'Enabled' if app.config.enable_voice_output else 'Disabled'
    
    return f"""Current Configuration:
            AI Provider:    {ai_info.get('provider', 'Unknown')}
            AI Model:       {ai_info.get('model', 'Unknown')}
            Voice:          {app.config.voice_name}
            Voice Output:   {voice_status}
            History Size:   {len(app.history.entries)}/{app.config.max_history_size}"""
