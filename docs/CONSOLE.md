# Console Application

Interactive AI chat with voice responses.

## Running

```bash
npm run start:console
```

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show commands |
| `/exit` | Quit |
| `/clear` | Clear history |
| `/history` | Show history |
| `/voice <name>` | Change voice |
| `/info` | Show config |
| `/toggle-voice` | Enable/disable voice |
| `/tools` | Show available MCP tools |

## Usage

**Basic chat:**
```
You: What is AI?
AI: Artificial intelligence refers to...
[audio plays]
```

**Change voice:**
```
You: /voice am_adam
AI: Voice changed to: am_adam 🎙️
```

**View history:**
```
You: /history
AI: 📜 Conversation History:
[1] 14:23:15
  You: What is AI?
  AI:  Artificial intelligence refers...
```

## How It Works

1. User enters text
2. App streams AI response
3. Each chunk is displayed and queued for voice
4. App waits until all audio finishes
5. Ready for next input

## Configuration

Edit `src/apps/console/config.py`:

```python
@dataclass
class ConsoleConfig:
    ai_model: str = "gemini-2.0-flash-exp"
    voice_name: str = "af_sarah"
    enable_voice_output: bool = True
    max_history_size: int = 50
```

Or use environment variables:

```bash
export KNIK_VOICE="am_adam"
export KNIK_ENABLE_VOICE="true"
```

## Features

**Async Voice:** Text-to-speech runs in background threads  
**Smart Wait:** Blocks input until audio completes  
**Context-Aware:** Remembers conversation history  
**Streaming:** See responses as AI generates them  
**MCP Tools:** 11 built-in tools for calculations, text processing, and more

## MCP Tools

The console app includes Model Context Protocol (MCP) tools that the AI can use:

**Utility Tools:**
- `calculate` - Basic math expressions
- `advanced_calculate` - Advanced math with precision
- `get_current_time` - Get current timestamp
- `get_current_date` - Get today's date
- `reverse_string` - Reverse text
- `count_words` - Count words

**Text Processing:**
- `word_count` - Detailed text statistics
- `find_and_replace` - Text replacement
- `extract_emails` - Extract email addresses
- `extract_urls` - Extract URLs

**Shell Tools:**
- `run_shell_command` - Execute shell commands (controlled/safe)
- `text_case_convert` - Convert case (snake, camel, kebab)

Use `/tools` to see the list, or just ask the AI naturally:

```
You: What's 25 * 4 + sqrt(144)?
AI: Let me calculate that... The result is 112.0

You: Convert "hello world" to snake_case
AI: The snake_case version is: hello_world
```

See **[MCP.md](MCP.md)** for details on creating custom tools.

## Architecture

The console app follows a modular design:

```
src/apps/console/
├── app.py              # Main application logic
├── config.py           # Configuration management
├── history.py          # ConversationHistory class
└── tools/              # Command handlers
    ├── index.py        # Command registry
    ├── help_cmd.py     # /help command
    ├── exit_cmd.py     # /exit and /quit
    ├── clear_cmd.py    # /clear command
    ├── history_cmd.py  # /history command
    ├── voice_cmd.py    # /voice command
    ├── info_cmd.py     # /info command
    ├── toggle_voice_cmd.py  # /toggle-voice command
    └── tools_cmd.py    # /tools command
```

### Adding Custom Commands

1. Create a new handler in `tools/`:

```python
# tools/my_cmd.py
def my_command(app, args: str) -> str:
    """My custom command"""
    return f"You said: {args}"
```

2. Register in `tools/index.py`:

```python
def get_command_registry() -> Dict[str, Callable]:
    from .my_cmd import my_command
    
    return {
        # ... existing commands
        'my': my_command,
    }
```

3. Use it: `/my hello world`

## Tips

- Use `/toggle-voice` to disable audio temporarily
- Use `/clear` to reset conversation context
- Use `/tools` to see available AI tools
- Shorter responses = less wait time
- Check `/info` to verify configuration
