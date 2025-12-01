def agent_command(app, args: str) -> str:
    if not args.strip():
        return "Usage: /agent <your query>"
    
    try:
        response = app.ai_client.chat_with_agent(
            prompt=args,
            use_tools=True,
            max_tokens=app.config.max_tokens,
            temperature=app.config.temperature
        )
        return f"\n{response}"
    except Exception as e:
        return f"Agent error: {e}"
