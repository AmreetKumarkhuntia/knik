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

## Configuration

Environment variables:

```bash
export KNIK_VOICE_NAME="am_adam"
export KNIK_VOICE_OUTPUT="true"
```

See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for all options.

## Features

- Agent-powered streaming responses
- Multi-step reasoning
- Real-time voice output
- 12 MCP tools (math, text, shell)
- Conversation history

See [MCP.md](MCP.md) for tool details.
