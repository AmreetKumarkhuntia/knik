# Architecture

## Project Overview

Knik is a multi-interface AI assistant with Text-to-Speech (TTS) capabilities. Built with Python, it features async audio processing, 6 pluggable AI providers (including any OpenAI-compatible endpoint), 31 MCP tools across 7 categories, and a React + FastAPI web app with workflow scheduling.

**Core Technologies:** Python 3.12+, Kokoro-82M TTS (82M parameters), LangChain, Google Vertex AI/Gemini, ZhipuAI, Z.AI, React 18 + TypeScript + Vite, FastAPI, PostgreSQL, Sounddevice/Soundfile, Threading/Asyncio

## Three-Layer Structure

1. **`src/lib/`** - Reusable library components (core, services, utils, mcp, cron)
2. **`src/apps/`** - Applications built on the library (console, gui, web)
3. **`src/imports.py`** - Central import hub to avoid complex import paths

## Key Components

### TTSAsyncProcessor (`src/lib/core/tts_async_processor.py`)

- Dual-thread architecture: text -> audio conversion queue + audio playback queue
- Non-blocking voice output with `play_async(text)` method
- Critical: Use `is_processing_complete()` to check if playback finished before exiting
- Backed by `KokoroVoiceModel` (Kokoro-82M) and `AudioProcessor` (sounddevice)

### AIClient (`src/lib/services/ai_client/client.py`)

- Unified interface supporting 6 providers via `ProviderRegistry`
- Auto-fallback to mock provider if real provider unconfigured (controlled by `auto_fallback_to_mock`)
- Two query modes: `chat()` (blocking, returns str) and `chat_stream()` (generator, yields str chunks)
- MCP tool integration via `MCPServerRegistry` and `register_tool()`
- Constructor: `AIClient(provider, auto_fallback_to_mock, mcp_registry, system_instruction, tool_callback, **provider_kwargs)`

### ConsoleApp (`src/apps/console/`)

- Interactive AI chat with voice responses and conversation history
- Modular architecture: `app.py` (main), `history.py` (context), `tools/` (commands)
- Built-in command system with registry pattern
- 14 commands: help, exit, quit, clear, history, voice, info, toggle-voice, tools, agent, provider, model, debug, workflow
- Integrates AIClient + TTSAsyncProcessor with smart wait system

### GUIApp (`src/apps/gui/`)

- Desktop GUI built with CustomTkinter featuring modern messenger-style chat interface
- Modular architecture: `app.py` (main), `config.py`, `theme.py` (theming), `components/` (UI widgets)
- Three main components: ChatPanel (messages), InputPanel (text entry + buttons), SettingsPanel (configuration)
- Dynamic theme switching: Light/Dark/System modes with full UI refresh
- AI Provider selection in settings includes all 6 providers

### WebApp (`src/apps/web/`)

- Modern web interface with React + FastAPI
- **Backend** (`backend/`): FastAPI REST API with 7 route files, 22 endpoints
  - `routes/chat.py`: Chat endpoint (text in -> text + audio out)
  - `routes/chat_stream.py`: SSE streaming chat endpoint
  - `routes/admin.py`: Settings management (provider, model, voice lists)
  - `routes/history.py`: Conversation history CRUD
  - `routes/workflow.py`: Workflow CRUD and execution
  - `routes/cron.py`: Schedule management (natural language)
  - `routes/analytics.py`: Dashboard, metrics, execution analytics
  - `config.py`: WebBackendConfig reads from environment variables
  - `main.py`: App entry point with CORS, lifespan handlers
- **Frontend** (`frontend/src/`): React 18 + TypeScript + Vite + Tailwind
  - `lib/pages/`: Home, Workflows, WorkflowBuilder, ExecutionDetail, AllExecutions
  - `lib/sections/`: Domain-specific UI organized by subdirectory (audio, chat, effects, feedback, home, layout, theme, workflows)
  - `lib/components/`: 30+ reusable UI components (ActionButton, Card, Modal, Table, Pagination, etc.)
  - `lib/services/`: API client, audio playback, theme tokens
- **Scripts**: `scripts/start_web_backend.sh`, `scripts/start_web_frontend.sh`
- **Usage**: `npm run start:web:backend` + `npm run start:web:frontend` (separate processes)
- Frontend dev server runs on port 12414, backend on port 8000

### Workflow Scheduler (`src/lib/cron/`)

- Poll-based scheduler with natural language schedule descriptions (NOT cron expressions)
- `models.py`: Workflow, Schedule (with `target_workflow_id`, `schedule_description`, `recurrence_seconds`), ExecutionRecord, NodeExecutionRecord
- `nodes.py`: 4 node types - AIExecutionNode, FunctionExecutionNode, ConditionalBranchNode, FlowMergeNode
- `engine.py`: WorkflowEngine with DAG validation and topological BFS execution
- `scheduler.py`: CronScheduler with asyncio poll loop
- `schedule_parser.py`: Natural language to datetime/seconds conversion

### AI Providers (`src/lib/services/ai_client/providers/`)

```
BaseAIProvider (ABC)
 +-- LangChainProvider (chat/chat_stream via LangChain invoke/stream)
 |    +-- VertexAIProvider    ("vertex")   - ChatVertexAI
 |    +-- GeminiAIProvider    ("gemini")   - ChatGoogleGenerativeAI
 |    +-- ZhipuAIProvider     ("zhipuai")  - ChatZhipuAI
 |    +-- ZAIProvider         ("zai")      - ChatOpenAI -> z.ai endpoint
 |    +-- CustomProvider      ("custom")   - ChatOpenAI -> any OpenAI-compatible endpoint
 +-- MockAIProvider           ("mock")     - Canned responses for testing
```

Each provider self-registers at module load time via `ProviderRegistry.register()`.

### MCP Tools System (`src/lib/mcp/`)

- Clean separation: `definitions/` (JSON schemas) -> `implementations/` (Python functions) -> `index.py` (registry)
- 31 built-in tools across 7 categories:
  - **Utils** (4): calculate, get_current_time, get_current_date, reverse_string
  - **Text** (5): word_count, find_and_replace, extract_emails, extract_urls, text_case_convert
  - **Shell** (1): run_shell_command
  - **File** (8): read_file, list_directory, search_in_files, file_info, write_file, append_to_file, find_in_file, count_in_file
  - **Browser** (6): browser_navigate, browser_get_text (supports chunked reading), browser_get_links, browser_click, browser_type, browser_screenshot
  - **Cron** (3): list_cron_schedules, add_cron_schedule, remove_cron_schedule
  - **Workflow** (4): create_workflow, remove_workflow, list_workflows, get_workflow_templates
- Tools registered at app startup via `register_all_tools(ai_client)`
- Separate from console commands (MCP = AI-callable tools, console commands = user-callable commands)

### Console Commands (`src/apps/console/tools/`)

- Modular command handlers: Each command in separate `*_cmd.py` file
- Registry pattern in `index.py`: `get_command_registry()`, `register_commands()`
- 14 commands: help, exit, quit, clear, history, voice, info, toggle-voice, tools, agent, provider, model, debug, workflow
