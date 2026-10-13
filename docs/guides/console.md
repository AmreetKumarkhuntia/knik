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

## Commands

Shared with the Telegram bot (`src/lib/commands/handlers.py`):

| Command                 | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `/new`                  | Start a fresh conversation                                                        |
| `/resume [id\|#number]` | Resume a previous conversation                                                    |
| `/sessions [page]`      | List recent conversations (the web app's and older ones, never a Telegram user's) |
| `/model [name]`         | Show or switch the AI model                                                       |
| `/provider [name]`      | Show or switch the AI provider                                                    |
| `/status`               | Show the current configuration                                                    |
| `/help`                 | Show the commands                                                                 |

Console only (`src/console/tools/`):

| Command                                  | Description                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `/exit`, `/quit`                         | Quit                                                                             |
| `/clear`                                 | Clear the in-memory conversation history                                         |
| `/history`                               | Show the conversation history                                                    |
| `/voice [name]`                          | Show the voice setting; changing it fails for now (TTS cannot switch voices yet) |
| `/toggle-voice`                          | Enable/disable voice output                                                      |
| `/tools`                                 | List the built-in tool definitions                                               |
| `/agent <query>`                         | Ask once without streaming                                                       |
| `/debug [on\|off\|toggle]`               | Show or change debug mode                                                        |
| `/workflow list\|run <id> [inputs_json]` | List workflows, or run one now                                                   |

## Usage

**Basic chat:**

```text
You: What is AI?
AI: Artificial intelligence refers to...
[audio plays]
```

**Switch provider:**

```text
You: /provider
AI: Current provider: vertex

Available providers:
    custom
    gemini
    mock
 -> vertex
    zai_coding
    zai
    zhipuai

Usage: /provider <name>

You: /provider custom
AI: Provider switched to custom
```

**Change AI model:**

```text
You: /model gemini-1.5-flash
AI: Model switched to gemini-1.5-flash
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
AI: ✓ Debug mode enabled 🐛

You: What is 2+2?
🐛 [DEBUG] Processing input: What is 2+2?...
🐛 [DEBUG] Querying AI with provider: vertex
AI: The answer is 4
🐛 [DEBUG] Response stats: 4 words, 16 chars
```

## Configuration

Environment variables:

```bash
export KNIK_AI_PROVIDER=vertex    # AI provider
export KNIK_AI_MODEL=gemini-1.5-flash
export KNIK_VOICE_OUTPUT=true     # Enable/disable TTS
export KNIK_HISTORY_CONTEXT_SIZE=5  # Earlier turns sent with each message
```

See [Environment Variables](../reference/environment-variables.md) for all options.

## Features

- 7 AI providers (vertex, gemini, zhipuai, zai, zai_coding, custom, mock)
- Agent-powered streaming responses
- Voice output with Kokoro (the `af_heart` voice for now)
- 30 tools across 7 groups (utils, text, shell, file, browser, cron, workflow); the console asks before running one that needs consent
- Conversation history with configurable context
- Workflow management via `/workflow` command

## Architecture

- **app.py** - Main ConsoleApp class
- **history.py** - ConversationHistory for context management
- **commands/** - `/help` and the dispatcher for the shared commands
- **tools/** - Console-only command handlers
  - **index.py** - Command registry (`get_command_registry()`, `register_commands()`)
  - Individual command files (`*_cmd.py`) and `consent_gate.py`

See [Tools](mcp.md) for tool details and [API Reference](../reference/api.md) for AIClient documentation.
