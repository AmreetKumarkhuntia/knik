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

## Tips

- Use `/toggle-voice` to disable audio temporarily
- Use `/clear` to reset conversation context
- Shorter responses = less wait time
- Check `/info` to verify configuration
