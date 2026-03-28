"""Console command for agent management."""


def agent_command(app, args: str) -> str:
    """Execute a non-streaming AI chat query via the agent."""
    if not args.strip():
        return "Usage: /agent <your query>"

    try:
        response = app.ai_client.chat(prompt=args, max_tokens=app.config.max_tokens, temperature=app.config.temperature)
        return f"\n{response}"
    except Exception as e:
        return f"Chat error: {e}"
