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
| `/provider [name]` | Switch AI provider or list available |
| `/model [name]` | Switch AI model or show current |
| `/debug [on/off/toggle]` | Toggle debug mode |

## Usage

**Basic chat:**

```text
You: What is AI?
AI: Artificial intelligence refers to...
[audio plays]
```

**Change voice:**

```text
You: /voice am_adam
AI: Voice changed to: am_adam 🎙️
```

**View history:**

```text
You: /history
AI: 📜 Conversation History:
[1] 14:23:15
  You: What is AI?
  AI:  Artificial intelligence refers...
```

**Switch provider:**

```text
You: /provider
AI: 📡 Current provider: vertex

Available providers:
  → vertex
    langchain
    mock

Usage: /provider <name>

You: /provider mock
AI: ✓ Provider changed to: mock 📡
```

**Change AI model:**

```text
You: /model
AI: 🤖 Current model: gemini-1.5-pro

You: /model gemini-1.5-flash
AI: ✓ Model changed to: gemini-1.5-flash 🤖
```

**Enable debug mode:**

```text
You: /debug on
AI: ✓ Debug mode enabled 🐛

You: What is 2+2?
🐛 [DEBUG] Processing input: What is 2+2?...
🐛 [DEBUG] Querying AI with provider: mock
AI: The answer is 4
🐛 [DEBUG] Response stats: 4 words, 16 chars
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
- 20 MCP tools (math, text, shell, file operations)
- Conversation history

See [MCP.md](MCP.md) for tool details.
