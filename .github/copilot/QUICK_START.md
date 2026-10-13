# Quick Start Guide -- Working with Knik

## What Knik Is

- AI assistant with voice (TTS) and chat capabilities
- Processes: web backend (FastAPI), web frontend (React), Telegram bot, workflow worker, terminal console; Electron wraps the frontend
- 6 AI providers: `vertex`, `gemini`, `glm`, `zai`, `custom` (any OpenAI-compatible API), `mock`
- 30 built-in tools across 7 groups (an in-process LangChain tool registry, not Model Context Protocol)
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
│   ├── main.py  config.py  state.py
│   ├── models/              # Pydantic request/response models per domain
│   └── routes/              # admin, analytics, chat, chat_stream, conversations, cron, workflow
├── bot/                     # Telegram bot daemon
├── worker/                  # Workflow scheduler process
├── console/                 # Terminal chat app (commands/, tools/)
├── lib/                     # Shared library; never imports an app or imports.py
│   ├── core/                # Config
│   ├── utils/               # printer, async helpers, graph helpers
│   ├── commands/            # CommandService shared by bot and console
│   ├── tools/               # *_tool.py groups, catalog.py (ALL_TOOL_CLASSES), index.py (register_all_tools)
│   ├── workflows/           # Engine, nodes, validation, schedule parser, loop.py (scheduler loop)
│   └── services/            # Integrations: db, ai_client, tts, telegram, browser, shell
└── apps/web/frontend/       # React + Vite + Tailwind (port 8020)
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

# Electron (all-in-one)
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

| Provider | Env Variable           | Notes                                                     |
| -------- | ---------------------- | --------------------------------------------------------- |
| `vertex` | `GOOGLE_CLOUD_PROJECT` | Default provider                                          |
| `gemini` | `GOOGLE_API_KEY`       | Google AI Studio                                          |
| `glm`    | `ZHIPUAI_API_KEY`      | ZhipuAI (GLM models)                                      |
| `zai`    | `ZAI_API_KEY`          | ZAI                                                       |
| `custom` | `KNIK_CUSTOM_API_BASE` | Any OpenAI-compatible API (Ollama, LM Studio, Groq, etc.) |
| `mock`   | (none)                 | Auto-fallback when provider fails                         |

Set provider: `export KNIK_AI_PROVIDER="vertex"`

---

## Tools

| Category | Count | Tools                                                                                                    |
| -------- | ----- | -------------------------------------------------------------------------------------------------------- |
| Utils    | 4     | calculator, timer, random_number, uuid_generator                                                         |
| Text     | 5     | word_count, text_transform, regex_search, summarize, translate                                           |
| Shell    | 1     | execute_command                                                                                          |
| File     | 8     | read_file, write_file, list_directory, create_directory, delete_file, move_file, file_info, search_files |
| Browser  | 6     | open_url, search_web, scrape_page, screenshot, click_element, type_text                                  |
| Cron     | 3     | schedule_task, list_schedules, delete_schedule                                                           |
| Workflow | 4     | create_workflow, execute_workflow, list_workflows, get_workflow                                          |

---

## Console Commands (14)

| Command          | Description               |
| ---------------- | ------------------------- |
| `/help`          | Show help                 |
| `/exit`, `/quit` | Exit app                  |
| `/clear`         | Clear screen              |
| `/history`       | Show conversation history |
| `/voice`         | Change TTS voice          |
| `/info`          | Show system info          |
| `/toggle-voice`  | Toggle TTS on/off         |
| `/tools`         | List MCP tools            |
| `/agent`         | Agent mode                |
| `/provider`      | Change AI provider        |
| `/model`         | Change AI model           |
| `/debug`         | Toggle debug mode         |
| `/workflow`      | Workflow operations       |

---

## Key Documentation

- `.github/copilot-instructions.md` -- Main AI assistant reference
- `docs/reference/environment-variables.md` -- All env vars
- `docs/reference/api.md` -- AIClient + Web API reference
- `docs/guides/mcp.md` -- Tool registry reference
- `docs/guides/scheduler.md` -- Workflow scheduler guide
- `docs/guides/web-app.md` -- Web app guide
- `docs/guides/console.md` -- Console app guide
- `docs/components/web-architecture.md` -- Frontend/backend file structure
- `docs/components/react-common-components.md` -- 29 React components reference
- `docs/development/setup.md` -- Development setup
- `docs/development/streaming.md` -- Streaming architecture
