# Quick Start Guide -- Working with Knik

## What Knik Is

- AI assistant with voice (TTS) and chat capabilities
- Processes: web backend (FastAPI), web frontend (React), Telegram bot, workflow worker, terminal console; Electron wraps the frontend
- 7 AI providers: `vertex`, `gemini`, `zhipuai`, `zai`, `zai_coding`, `custom` (any OpenAI-compatible API), `mock`
- 30 AI-callable tools across 7 groups (an in-process LangChain tool registry, not Model Context Protocol)
- 9 TTS voices (5 female, 4 male) via Kokoro
- Workflow engine with scheduled execution (cron)
- Conversation history for context-aware responses

---

## Project Structure

```
src/
├── main.py                  # Launcher: --mode backend|bot|worker|console (cron = worker alias)
├── imports.py               # Lazy import hub, used by the apps only
├── backend/                 # FastAPI app (port 8010)
│   ├── main.py  config.py  state.py  deps.py  consent.py  settings_service.py
│   ├── models/              # Pydantic request/response models per domain
│   └── routes/              # admin, analytics, chat, chat_stream, conversations, cron, workflow
├── bot/                     # Telegram bot daemon
├── worker/                  # Workflow scheduler process
├── console/                 # Terminal chat app (commands/, tools/)
├── lib/                     # Shared library; never imports an app or imports.py
│   ├── core/                # Config
│   ├── utils/               # printer, async, graph, timezone, text, time and encoding helpers
│   ├── commands/            # CommandService shared by bot and console
│   ├── tools/               # *_tool.py groups, catalog.py (ALL_TOOL_CLASSES), index.py (register_all_tools)
│   ├── workflows/           # schema.py (definitions), engine, nodes, validation, schedule parser, loop.py
│   └── services/            # Integrations: db, ai_client, tts, telegram, browser, shell
└── frontend/               # React + Vite + Tailwind (port 8020)
```

---

## Running

```bash
# Web app (two terminals)
npm run start:web:backend     # FastAPI on :8010
npm run start:web:frontend    # Vite on :8020

# Other processes
npm run start:bot             # Telegram bot
npm run start:worker          # Workflow scheduler (start:cron still works)
npm run start:console         # Terminal chat

# Electron (starts backend, frontend and the Electron window)
npm run electron:dev

# Code quality
npm run lint          # Check
npm run lint:fix      # Auto-fix
npm run format        # Format all code
npm run lint:imports  # Check the import rules in pyproject.toml
npm test              # Backend tests
```

---

## AI Providers

| Provider     | Env Variable                                       | Notes                                                     |
| ------------ | -------------------------------------------------- | --------------------------------------------------------- |
| `vertex`     | `GOOGLE_CLOUD_PROJECT`                             | Default provider                                          |
| `gemini`     | `GEMINI_API_KEY`                                   | Google AI Studio                                          |
| `zhipuai`    | `ZHIPUAI_API_KEY`                                  | ZhipuAI (GLM models)                                      |
| `zai`        | `ZAI_API_KEY`                                      | Z.AI                                                      |
| `zai_coding` | `ZAI_CODING_API_KEY` (falls back to `ZAI_API_KEY`) | Z.AI Coding Plan                                          |
| `custom`     | `KNIK_CUSTOM_API_BASE`                             | Any OpenAI-compatible API (Ollama, LM Studio, Groq, etc.) |
| `mock`       | (none)                                             | Auto-fallback when a provider is unknown or unconfigured  |

Set provider: `export KNIK_AI_PROVIDER="vertex"`

---

## Tools

| Group    | Count | Tools                                                                                                          |
| -------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| Utils    | 4     | calculate, get_current_time, get_current_date, reverse_string                                                  |
| Text     | 5     | word_count, find_and_replace, extract_emails, extract_urls, text_case_convert                                  |
| Shell    | 1     | run_shell_command                                                                                              |
| File     | 8     | read_file, list_directory, search_in_files, file_info, write_file, append_to_file, find_in_file, count_in_file |
| Browser  | 5     | browser_navigate, browser_get_text, browser_get_links, browser_click, browser_type                             |
| Cron     | 3     | list_cron_schedules, add_cron_schedule, remove_cron_schedule                                                   |
| Workflow | 4     | create_workflow, remove_workflow, list_workflows, get_workflow_templates                                       |

Shell, file, browser, cron and workflow tools need consent: the console and the bot ask, web chats follow
`KNIK_WEB_TOOL_CONSENT` (`deny` by default).

---

## Console Commands

| Command                                                          | Description                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| `/new`, `/resume`, `/sessions`, `/model`, `/provider`, `/status` | Shared with the bot (`src/lib/commands/handlers.py`) |
| `/help`                                                          | Show help                                            |
| `/exit`, `/quit`                                                 | Exit app                                             |
| `/clear`                                                         | Clear the in-memory history                          |
| `/history`                                                       | Show conversation history                            |
| `/voice`                                                         | Show the voice setting                               |
| `/toggle-voice`                                                  | Toggle TTS on/off                                    |
| `/tools`                                                         | List the tool definitions                            |
| `/agent <query>`                                                 | Ask once without streaming                           |
| `/debug`                                                         | Toggle debug mode                                    |
| `/workflow list\|run <id>`                                       | Workflow operations                                  |

---

## Key Documentation

- `AGENTS.md` and `contribution-guidelines/` -- Coding guidelines
- `docs/reference/environment-variables.md` -- All env vars
- `docs/reference/api.md` -- AIClient + Web API reference
- `docs/guides/mcp.md` -- Tools, consent gates and the tool registry
- `docs/guides/scheduler.md` -- Workflow scheduler guide
- `docs/guides/web-app.md` -- Web app guide
- `docs/guides/console.md` -- Console app guide
- `docs/components/web-architecture.md` -- Frontend/backend file structure
- `docs/components/react-common-components.md` -- React components reference
- `docs/development/setup.md` -- Development setup
- `docs/development/streaming.md` -- Stream events and SSE
