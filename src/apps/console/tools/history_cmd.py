def history_command(app, args: str) -> str:
    entries = app.history.get_all_entries()
    if not entries:
        return "No conversation history yet."
    
    history_lines = ["\n📜 Conversation History:"]
    for i, entry in enumerate(entries, 1):
        timestamp = entry['timestamp'].strftime("%H:%M:%S")
        history_lines.append(f"\n[{i}] {timestamp}")
        history_lines.append(f"  You: {entry['user']}")
        history_lines.append(f"  AI:  {entry['assistant'][:100]}...")
    
    return "\n".join(history_lines)
