# Knik - AI Coding Agent Instructions

## Project Overview

Knik is a multi-interface AI assistant with Text-to-Speech (TTS) capabilities. Built with Python, it features async audio processing, 6 pluggable AI providers (including any OpenAI-compatible endpoint), 31 MCP tools across 7 categories, and a React + FastAPI web app with workflow scheduling.

**Core Technologies:** Python 3.12+, Kokoro-82M TTS (82M parameters), LangChain, Google Vertex AI/Gemini, ZhipuAI, Z.AI, React 18 + TypeScript + Vite, FastAPI, PostgreSQL, Sounddevice/Soundfile, Threading/Asyncio

## Architecture

### Three-Layer Structure

1. **`src/lib/`** - Reusable library components (core, services, utils, mcp, cron)
2. **`src/apps/`** - Applications built on the library (console, gui, web)
3. **`src/imports.py`** - Central import hub to avoid complex import paths

### Key Components

**TTSAsyncProcessor** (`src/lib/core/tts_async_processor.py`)

- Dual-thread architecture: text -> audio conversion queue + audio playback queue
- Non-blocking voice output with `play_async(text)` method
- Critical: Use `is_processing_complete()` to check if playback finished before exiting
- Backed by `KokoroVoiceModel` (Kokoro-82M) and `AudioProcessor` (sounddevice)

**AIClient** (`src/lib/services/ai_client/client.py`)

- Unified interface supporting 6 providers via `ProviderRegistry`
- Auto-fallback to mock provider if real provider unconfigured (controlled by `auto_fallback_to_mock`)
- Two query modes: `chat()` (blocking, returns str) and `chat_stream()` (generator, yields str chunks)
- MCP tool integration via `MCPServerRegistry` and `register_tool()`
- Constructor: `AIClient(provider, auto_fallback_to_mock, mcp_registry, system_instruction, tool_callback, **provider_kwargs)`

**ConsoleApp** (`src/apps/console/`)

- Interactive AI chat with voice responses and conversation history
- Modular architecture: `app.py` (main), `history.py` (context), `tools/` (commands)
- Built-in command system with registry pattern
- 14 commands: help, exit, quit, clear, history, voice, info, toggle-voice, tools, agent, provider, model, debug, workflow
- Integrates AIClient + TTSAsyncProcessor with smart wait system

**GUIApp** (`src/apps/gui/`)

- Desktop GUI built with CustomTkinter featuring modern messenger-style chat interface
- Modular architecture: `app.py` (main), `config.py`, `theme.py` (theming), `components/` (UI widgets)
- Three main components: ChatPanel (messages), InputPanel (text entry + buttons), SettingsPanel (configuration)
- Dynamic theme switching: Light/Dark/System modes with full UI refresh
- AI Provider selection in settings includes all 6 providers

**WebApp** (`src/apps/web/`)

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

**Workflow Scheduler** (`src/lib/cron/`)

- Poll-based scheduler with natural language schedule descriptions (NOT cron expressions)
- `models.py`: Workflow, Schedule (with `target_workflow_id`, `schedule_description`, `recurrence_seconds`), ExecutionRecord, NodeExecutionRecord
- `nodes.py`: 4 node types - AIExecutionNode, FunctionExecutionNode, ConditionalBranchNode, FlowMergeNode
- `engine.py`: WorkflowEngine with DAG validation and topological BFS execution
- `scheduler.py`: CronScheduler with asyncio poll loop
- `schedule_parser.py`: Natural language to datetime/seconds conversion

**AI Providers** (`src/lib/services/ai_client/providers/`)

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

**MCP Tools System** (`src/lib/mcp/`)

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

**Console Commands** (`src/apps/console/tools/`)

- Modular command handlers: Each command in separate `*_cmd.py` file
- Registry pattern in `index.py`: `get_command_registry()`, `register_commands()`
- 14 commands: help, exit, quit, clear, history, voice, info, toggle-voice, tools, agent, provider, model, debug, workflow

## Critical Patterns

### Import Convention

**Always** import from `imports.py` when working in `src/` directory:

```python
from imports import AIClient, TTSAsyncProcessor, printer
```

Not `from lib.services.ai_client.client import AIClient`

### Registry Pattern (Provider & MCP)

- **ProviderRegistry**: Maps provider names to implementation classes (6 providers)
- **MCPServerRegistry**: Stores tool schemas + implementations as class attributes
- Both use class methods for global state management (no instances needed)

### Async TTS Workflow

```python
processor = TTSAsyncProcessor(sample_rate=24000, voice_model='af_sarah')
processor.start_async_processing()  # Starts background threads
processor.play_async("Text to speak")  # Non-blocking
while not processor.is_processing_complete():  # Wait for completion
    time.sleep(0.1)
```

### Adding Console Commands

1. Create handler in `src/apps/console/tools/my_cmd.py`:
   ```python
   def my_command(app, args: str) -> str:
       return f"Result: {args}"
   ```
2. Add to registry in `tools/index.py`:
   ```python
   from .my_cmd import my_command
   # Add to get_command_registry() dict: 'my': my_command
   ```
3. Use with: `/my argument`

### Adding MCP Tools

1. Define schema in `lib/mcp/definitions/category_defs.py` with JSON Schema format
2. Implement function in `lib/mcp/implementations/category_impl.py`
3. Export in `definitions/__init__.py` (`ALL_DEFINITIONS`) and `implementations/__init__.py` (`ALL_IMPLEMENTATIONS`)
4. No changes to `index.py` needed - auto-registered via dictionary lookup

### Coding Patterns

- Code should be self-explanatory
- Comments/docstrings policy: remove comments that merely restate **what** the code does (the code already says that). Keep only comments/docstrings that explain **why** a decision was made, or document non-obvious constraints (e.g., error conditions, side effects, design rationale)
- Module-level docstrings (one-liners) are fine. Class/method docstrings that just paraphrase the name should be removed
- Documentation should be simple and straightforward
- Small modules, helper functions, shared logic via unified base functions
- Return structured dicts with `success` flag and descriptive `error` messages
- Always add `text_color` to CustomTkinter buttons for visibility across themes
- Store widget references as instance variables (self.*) when needing to update them later
- Use `printer` for internal logging (`printer.info()`, `printer.success()`, `printer.error()`), regular `print()` for direct user output

## Development Workflows

### Running the App

```bash
# GUI mode
npm run start:gui

# Console mode
npm run start:console

# Split pane with logs
npm run start:console:split

# Web app (two separate terminals)
npm run start:web:backend
npm run start:web:frontend

# Cron scheduler
npm run start:cron

# Electron desktop app
npm run start:electron

# Direct Python
python src/main.py --mode gui
python src/main.py --mode console
python src/main.py --mode cron
```

### Code Quality

```bash
npm run lint          # Lint backend
npm run lint:fix      # Auto-fix backend lint
npm run lint:frontend # Lint frontend
npm run lint:all      # Lint everything

npm run format        # Format backend
npm run format:check  # Check formatting
npm run format:frontend
npm run format:all

npm run typecheck          # Backend type checking
npm run typecheck:frontend # Frontend type checking (tsc --noEmit)
```

### Environment Setup

- **Required:** `espeak-ng` (install via `brew install espeak-ng` on macOS)
- **Optional:** Set `GOOGLE_CLOUD_PROJECT` for Vertex AI (falls back to mock provider)
- See `docs/reference/environment-variables.md` for all configuration options

### Cache Management

```bash
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
```

## File Navigation

**Key directories to know:**

- `src/lib/services/ai_client/providers/` - AI provider implementations (vertex, gemini, zhipuai, zai, custom, mock)
- `src/lib/services/ai_client/registry/` - ProviderRegistry and MCPServerRegistry
- `src/lib/mcp/definitions/` - MCP tool definitions (7 category files)
- `src/lib/mcp/implementations/` - MCP tool implementations (7 category files)
- `src/lib/cron/` - Scheduler system (models, nodes, engine, scheduler, parser)
- `src/apps/console/tools/` - Console command handlers (14 commands)
- `src/apps/web/backend/routes/` - Web API routes (7 route files)
- `src/apps/web/frontend/src/lib/` - React frontend (pages, sections, components, services)
- `docs/` - Documentation (organized by guides, reference, development, components)

**Entry points:**

- `src/main.py` - Application launcher (supports --mode gui/console/cron)
- `src/imports.py` - Central import hub
- `src/apps/console/app.py` - Console app main logic
- `src/apps/gui/app.py` - GUI app main logic
- `src/apps/web/backend/main.py` - FastAPI web backend
- `src/apps/web/frontend/src/main.tsx` - React frontend entry
- `src/lib/mcp/index.py` - MCP tool registry
- `src/lib/cron/scheduler.py` - CronScheduler entry

## Project-Specific Conventions

1. **Printer vs print:** Use `printer` for internal logging. Use regular `print()` for direct user output (e.g., debug mode)
2. **Voice names:** Female `af_*` (heart, bella, sarah, nicole, sky) vs Male `am_*` (adam, michael, leo, ryan)
3. **Provider naming:** Always lowercase in registry (`vertex`, `gemini`, `zhipuai`, `zai`, `custom`, `mock`)
4. **Run from src/:** Most import paths assume `src/` as working directory
5. **Config classes:** Each app has a Config class reading from env vars with defaults
6. **Dynamic switching:** `/provider` and `/model` commands recreate AIClient to apply changes while preserving MCP tools and system instructions
7. **AI methods:** Use `chat()` and `chat_stream()` (not `query()` / `query_stream()`)

## Common Pitfalls

- **Don't forget** `start_async_processing()` before `play_async()` - threads won't start
- **Mock provider confusion:** AIClient auto-switches to mock if real provider unconfigured (check logs)
- **Import errors:** Run from `src/` directory, not project root
- **Blocking on TTS:** Always check `is_processing_complete()` or you'll exit before audio plays
- **MCP tool registration:** Must call `register_all_tools(ai_client)` before AI can use tools
- **Web app startup:** Use `start:web:backend` + `start:web:frontend` separately (no combined `start:web` script)
- **Frontend port:** Dev server runs on port 12414, not 5173
- **Scheduler uses natural language:** Not cron expressions. Schedule model has `schedule_description` + `recurrence_seconds`, not `cron_expression`
- **Schedule foreign key:** Field is `target_workflow_id`, not `workflow_id`

## Documentation Map

### User Documentation

- `docs/README.md` - Documentation index and quick links
- `docs/guides/mcp.md` - MCP tools architecture (31 tools, 7 categories)
- `docs/guides/console.md` - Console app commands and usage
- `docs/guides/gui.md` - GUI app architecture and components
- `docs/guides/web-app.md` - Web app architecture and API
- `docs/guides/scheduler.md` - Workflow scheduler system
- `docs/guides/electron.md` - Electron desktop packaging
- `docs/reference/api.md` - Core API reference (AIClient, TTS, Web endpoints)
- `docs/reference/environment-variables.md` - All configuration options
- `docs/reference/conversation-history.md` - Conversation memory system
- `docs/development/roadmap.md` - Development roadmap
- `docs/development/setup.md` - Development setup guide

### AI/Copilot Context

- `.github/copilot/QUICK_START.md` - Quick reference for starting new sessions
- `.github/copilot-instructions.md` - This file - comprehensive project guide for AI assistants

## Commit Message Format

```
<type>(<scope>): <short description>

- <detail 1>
- <detail 2>
```

### Rules

- **type** (required): one of `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, `ci`, `build`, `revert`
- **scope** (recommended): kebab-case name of the feature/area, e.g. `ai-client`, `scheduler`, `web-frontend`
- **short description** (required): lowercase, imperative mood, max 100 chars, no period at end
- **body** (optional): pointwise with `-`, max 500 chars total
- Semantic-release uses this format to determine version bumps:
  - `feat` -> minor version bump (1.0.0 -> 1.1.0)
  - `fix` -> patch version bump (1.0.0 -> 1.0.1)
  - `BREAKING CHANGE` in body or `!` after type -> major version bump (1.0.0 -> 2.0.0)

### Examples

```
feat(scheduler): add natural language schedule parsing

- support "every N minutes/hours/days" patterns
- fallback to dateparser for complex expressions
```

```
fix(ai-client): handle provider initialization errors gracefully

- catch exceptions and fall back to mock provider
- log warning when auto-fallback occurs
```

```
docs(reference): rewrite environment variables documentation
```
