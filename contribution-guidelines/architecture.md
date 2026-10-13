# Architecture Rules

## Layout

Everything lives under `src/`, which is the single Python import root.

```
src/
  main.py              # launcher: --mode backend | bot | worker | console
  imports.py           # lazy import hub, for apps only
  backend/             # FastAPI web backend
  bot/                 # Telegram bot
  worker/              # workflow scheduler process
  console/             # interactive terminal chat
  apps/web/frontend/   # React frontend (moves to src/frontend in a later change)
  lib/                 # shared library: core, utils, commands, tools, workflows, services
```

Put shared or reusable code in `src/lib/`. Put app-specific code in the app that uses it.

## Dependency Rules

1. **Apps never import each other.** `backend`, `bot`, `worker` and `console` are independent.
2. **Apps import library names through `src/imports.py`**, never through deep `lib.*` paths. The hub is lazy (PEP 562 `__getattr__` over the `_EXPORTS` map), so an app only loads the integrations it uses. To expose a new name, add it to `_EXPORTS` **and** to the `TYPE_CHECKING` block. `tests/test_imports_hub.py` fails if the two differ or a name does not resolve.
3. **Code under `lib/` never imports `imports.py` or any app.** It imports its siblings directly, e.g. `from lib.utils.printer import printer`.
4. **Services do not import each other.** The one exception is the planned `lib/services/db` (it replaces `postgres/`, `conversation/`, `scheduler/` and `settings/`), which other services may import.

These rules are enforced by import-linter contracts in `pyproject.toml`. Run them with `npm run lint:imports`; CI and pre-commit run them too. The contracts checked today are "apps are independent of each other" and "library code never imports apps or the app import hub". The service-independence contract is added together with `services/db`. CI also fails on any `sys.path.insert` under `src/`.

## Apps

| App                  | Purpose                                     | Structure                                                                                                                                                     |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/`           | FastAPI web backend (port 8010)             | `main.py` + `config.py` + `state.py` (shared clients) + `routes/` + `models/` (Pydantic request/response models)                                              |
| `bot/`               | Telegram bot                                | `app.py` + `config.py` + `message_handler.py` + `streaming.py` + `user_identity.py` + `user_client_manager.py` + `consent.py` + `commands/` (shared commands) |
| `worker/`            | Workflow scheduler process                  | `app.py` (`WorkerApp`)                                                                                                                                        |
| `console/`           | Interactive terminal chat                   | `app.py` + `config.py` + `history.py` + `identity.py` + `commands/` (shared commands) + `tools/` (console-only commands)                                      |
| `apps/web/frontend/` | React + TypeScript + Vite (dev server 8020) | `src/main.tsx` + `src/lib/` (pages, widgets, components, stores). Stays at this path until it moves to `src/frontend`                                         |

When adding a new app:

1. Create `src/<app>/` with `__init__.py` and `app.py`.
2. Add a runner to `RUNNERS` in `src/main.py`.
3. Add the package to `root_packages`, the app independence contract and the `lib` forbidden contract in `pyproject.toml`.
4. Add it to `known-first-party` in `.ruff.toml`.

## Library Domains (`src/lib/`)

| Domain       | Purpose                                                                                  | Structure                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/`      | App-level configuration                                                                  | Flat - `config.py`                                                                                                                                                          |
| `utils/`     | Helpers (`printer`, `async_utils`, `graph_utils`, `timezone_utils`, `console_processor`) | Flat files, no subdirectories                                                                                                                                               |
| `commands/`  | Shared command logic (`CommandService`) behind the console and bot command systems       | `service.py` + `models.py`                                                                                                                                                  |
| `tools/`     | Tools the AI can call. An in-process LangChain tool registry, not Model Context Protocol | One `*_tool.py` per tool group + `catalog.py` + `index.py`                                                                                                                  |
| `workflows/` | Workflow engine and scheduler                                                            | Flat - `models.py`, `nodes.py`, `engine.py`, `scheduler.py`, `loop.py`, `schedule_parser.py`, `schedule_service.py`, `workflow_service.py`, `functions.py`, `validation.py` |
| `services/`  | Integrations (AI, TTS, messaging, database, shell)                                       | One subdirectory per service                                                                                                                                                |

## Services (`src/lib/services/`)

Each service is a **self-contained module** (see Dependency Rules).

**Complex services** follow the provider pattern:

| Service             | Structure                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai_client/`        | `client.py` + `client_cache.py` + `providers/` (base + one file per provider) + `registry/` (`provider_registry.py`, `mcp_registry.py`) + `base_tool.py` + `consent.py` + `pricing.py` + `token_utils.py` |
| `tts/`              | `processor.py` + `providers/` (base + kokoro) + `audio/` (playback) + `utils.py`                                                                                                                          |
| `messaging_client/` | `client.py` + `models.py` + `providers/` (base + telegram + mock) + `registry.py`                                                                                                                         |

When adding a new complex service that supports multiple backends, follow this same pattern: a client module, a `providers/` subdirectory with a base class and implementations, and a registry.

**Medium services** have a few related files:

| Service         | Structure                                      |
| --------------- | ---------------------------------------------- |
| `conversation/` | `db_client.py` + `models.py` + `summarizer.py` |

**Simple services** are single-file modules:

| Service      | Structure       |
| ------------ | --------------- |
| `postgres/`  | `db.py`         |
| `scheduler/` | `db_client.py`  |
| `settings/`  | `db_client.py`  |
| `shell/`     | `executor.py`   |
| `text/`      | `operations.py` |
| `time/`      | `operations.py` |
| `encoding/`  | `operations.py` |

When adding a new simple service, create a subdirectory with `__init__.py` and a single implementation file. Promote to the provider pattern only when multiple backends are needed.

## Tool Structure (`src/lib/tools/`)

```
tools/
  browser_tool.py, cron_tool.py, file_tool.py, shell_tool.py,
  text_tool.py, utils_tool.py, workflow_tool.py
  catalog.py   -> ALL_TOOL_CLASSES, the list of tool classes
  index.py     -> register_all_tools(registry), get_all_tools(), get_tool_info()
```

Each `*_tool.py` is one tool group: a `BaseTool` subclass (`lib/services/ai_client/base_tool.py`) whose `get_definitions()` returns JSON Schema tool definitions and whose `get_implementations()` maps each tool name to its function. Tool names that need user approval go in the class's `consent_required_for`.

`register_all_tools(registry)` instantiates every class in `ALL_TOOL_CLASSES` and binds each definition to its implementation on an `MCPServerRegistry` (`lib/services/ai_client/registry/mcp_registry.py`). `AIClient` turns that registry into LangChain tools. The "MCP" in the names is historical.

To add a tool group, create `lib/tools/<group>_tool.py` and add its class to `ALL_TOOL_CLASSES` in `catalog.py`. Do not modify `index.py`.

## Registry Pattern

Use the registry pattern for extensible systems:

- **Providers** register via `ProviderRegistry.register()` at module load time
- **Tools** are listed in `lib/tools/catalog.py`; each app creates an `MCPServerRegistry` and calls `register_all_tools(registry)`
- **Shared commands** (model, provider, sessions, etc.) are handled by `CommandService` from `lib/commands/` and wired per app in `console/commands/` and `bot/commands/`
- **Console-only commands** (exit, clear, history, etc.) register in `console/tools/index.py`

When adding a new provider, tool, or command - register it through the existing registry mechanism. Do not bypass registries with direct references.

## Key Architectural Decisions

- **TTS uses dual-thread architecture**: a text-to-audio conversion queue + an audio playback queue. Always call `start_async_processing()` before `play_async()`, and check `is_processing_complete()` before exiting.
- **AIClient supports provider switching at runtime**: The `/provider` and `/model` commands recreate the client while preserving registered tools and system instructions.
- **AIClient auto-falls back to mock provider** if the configured provider is not available. Check logs if you get unexpected responses.
- **Web app runs as two separate processes**: FastAPI backend (port 8010) + React dev server (port 8020). There is no combined start script.
- **Schedules fire only while the worker runs**: the backend executes workflows on request but does not run the scheduler loop.
- **Scheduler uses natural language**, not cron expressions. The schedule model has `schedule_description` + `recurrence_seconds`.
