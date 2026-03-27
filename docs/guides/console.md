# Console Application

Interactive AI chat with voice responses.

## Running

```bash
npm run start:console

# Split pane with logs
npm run start:console:split

# Direct Python
python src/main.py --mode console
```

## Commands (14)

| Command | Description |
| --- | --- |
| `/help` | Show commands |
| `/exit` | Quit |
| `/quit` | Alias for exit |
| `/clear` | Clear screen |
| `/history` | Show conversation history |
| `/voice <name>` | Change voice |
| `/info` | Show system configuration |
| `/toggle-voice` | Enable/disable voice output |
| `/tools` | Show available MCP tools |
| `/agent` | Agent mode settings |
| `/provider [name]` | Switch AI provider or list available |
| `/model [name]` | Switch AI model or show current |
| `/debug [on/off/toggle]` | Toggle debug mode |
| `/workflow` | Workflow management |

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
AI: Voice changed to: am_adam
```

**Switch provider:**

```text
You: /provider
AI: Current provider: vertex

Available providers:
  vertex, gemini, zhipuai, zai, zai_coding, custom, mock

Usage: /provider <name>

You: /provider custom
AI: Provider changed to: custom
```

**Change AI model:**

```text
You: /model gemini-1.5-flash
AI: Model changed to: gemini-1.5-flash
```

**Workflow management:**

```text
You: /workflow list
AI: [Lists all registered workflows]

You: /workflow run <id>
AI: [Executes workflow]
```

**Enable debug mode:**

```text
You: /debug on
AI: Debug mode enabled

You: What is 2+2?
[DEBUG] Processing input: What is 2+2?...
[DEBUG] Querying AI with provider: vertex
AI: The answer is 4
[DEBUG] Response stats: 4 words, 16 chars
```

## Configuration

Environment variables:

```bash
export KNIK_AI_PROVIDER=vertex    # AI provider
export KNIK_AI_MODEL=gemini-1.5-flash
export KNIK_VOICE=af_sarah        # Voice name
export KNIK_VOICE_OUTPUT=true     # Enable/disable TTS
```

See [Environment Variables](../reference/environment-variables.md) for all options.

## Features

- 7 AI providers (vertex, gemini, zhipuai, zai, zai_coding, custom, mock)
- Agent-powered streaming responses
- Real-time voice output with 9 voices
- 31 MCP tools across 7 categories (utils, text, shell, file, browser, cron, workflow)
- Conversation history with configurable context
- Workflow management via `/workflow` command

## Architecture

- **app.py** - Main ConsoleApp class
- **history.py** - ConversationHistory for context management
- **tools/** - Command handlers with registry pattern
  - **index.py** - Command registry (`get_command_registry()`, `register_commands()`)
  - Individual command files (`*_cmd.py`)

See [MCP Tools](mcp.md) for tool details and [API Reference](../reference/api.md) for AIClient documentation.
