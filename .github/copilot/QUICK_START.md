# Quick Start Guide -- Working with Knik

## What Knik Is

- AI assistant with voice (TTS) and chat capabilities
- Four interfaces: Console (terminal), GUI (CustomTkinter), Web (React + FastAPI), Electron (desktop)
- 6 AI providers: `vertex`, `gemini`, `glm`, `zai`, `custom` (any OpenAI-compatible API), `mock`
- 31 built-in MCP tools across 7 categories
- 9 TTS voices (5 female, 4 male) via Kokoro
- Workflow engine with scheduled execution (cron)
- Conversation history for context-aware responses

---

## Project Structure

```
src/
├── main.py                  # App launcher (--mode console|gui|web)
├── imports.py               # Central import hub
├── lib/                     # Reusable library
│   ├── core/                # Config, TTS async processor
│   ├── services/            # AI client (6 providers), voice, audio
│   │   └── ai_client/
│   │       ├── client.py    # AIClient (chat, chat_stream)
│   │       ├── providers/   # vertex, gemini, zhipuai, zai, custom, mock
│   │       └── registry/    # Provider + MCP registry
│   ├── mcp/                 # 31 MCP tools (7 categories)
│   │   ├── definitions/     # Tool schemas
│   │   └── implementations/ # Tool logic
│   └── cron/                # Scheduler engine, models, nodes
└── apps/
    ├── console/             # Terminal chat app (14 commands)
    │   ├── app.py
    │   ├── history.py
    │   └── tools/           # /commands
    ├── gui/                 # Desktop GUI (CustomTkinter)
    │   ├── app.py
    │   ├── theme.py
    │   └── components/
    └── web/
        ├── backend/         # FastAPI (7 route files, 22 endpoints)
        │   ├── main.py
        │   ├── config.py
        │   └── routes/      # admin, analytics, chat, chat_stream,
        │                    # cron, history, workflow
        └── frontend/        # React + Vite + Tailwind
            └── src/
                ├── lib/
                │   ├── components/  # 29 reusable UI components
                │   ├── sections/    # App-specific sections
                │   ├── pages/       # 5 pages (Home, Workflows, etc.)
                │   ├── hooks/       # useChat, useAudio, useTheme, etc.
                │   ├── constants/
                │   ├── utils/
                │   └── data-structures/  # Graph visualization
                ├── services/    # API clients, streaming, audio
                └── types/       # TypeScript type definitions
```

---

## Running

```bash
# Console mode
npm run start:console

# GUI mode
npm run start:gui

# Web app (two terminals)
npm run start:web:backend     # FastAPI on :8000
npm run start:web:frontend    # Vite on :12414

# Electron (all-in-one)
npm run electron:dev

# Code quality
npm run lint          # Check
npm run lint:fix      # Auto-fix
npm run format        # Format all code
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

## MCP Tools (31 total)

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
- `docs/guides/mcp.md` -- MCP tools reference
- `docs/guides/scheduler.md` -- Workflow scheduler guide
- `docs/guides/web-app.md` -- Web app guide
- `docs/guides/console.md` -- Console app guide
- `docs/guides/gui.md` -- GUI app guide
- `docs/components/web-architecture.md` -- Frontend/backend file structure
- `docs/components/react-common-components.md` -- 29 React components reference
- `docs/development/setup.md` -- Development setup
- `docs/development/streaming.md` -- Streaming architecture
