# Architecture Rules

## Three-Layer Structure

All code must follow the three-layer structure:

1. **`src/lib/`** - Reusable library components (core, services, utils, mcp, cron). Shared logic goes here.
2. **`src/apps/`** - Applications built on the library (console, gui, web). App-specific logic goes here.
3. **`src/imports.py`** - Central import hub. Always import from here, never use deep paths directly.

Do not put shared/reusable code in `src/apps/`. Do not put app-specific code in `src/lib/`.

## Library Domains (`src/lib/`)

`src/lib/` has five independent domains. Do not create cross-dependencies between them unless absolutely necessary.

| Domain | Purpose | Structure |
|---|---|---|
| `core/` | App-level configuration | Flat - `config.py` |
| `services/` | Independent service modules (AI, TTS, messaging, DB, etc.) | Each service gets its own subdirectory |
| `utils/` | Stateless helper functions (`printer`, `async_utils`, `graph_utils`, etc.) | Flat files, no subdirectories, no state |
| `mcp/` | MCP tool definitions and implementations | Mirrored: `definitions/*_defs.py` + `implementations/*_impl.py` + `index.py` registry |
| `cron/` | Workflow engine and scheduler | Flat files - models, nodes, engine, scheduler, parser |

## Service Independence (`src/lib/services/`)

Each service in `src/lib/services/` is a **self-contained module**. Services must not import from each other.

**Complex services** follow the provider pattern:

| Service | Structure |
|---|---|
| `ai_client/` | `client.py` + `providers/` (base + 6 implementations) + `registry/` (provider + MCP registries) + `token_utils.py` |
| `tts/` | `processor.py` + `providers/` (base + kokoro) + `audio/` (playback) + `utils.py` |
| `messaging_client/` | `client.py` + `models.py` + `providers/` (base + telegram + mock) + `registry.py` |

When adding a new complex service that supports multiple backends, follow this same pattern: a client module, a `providers/` subdirectory with a base class and implementations, and a registry.

**Medium services** have a few related files:

| Service | Structure |
|---|---|
| `conversation/` | `db_client.py` + `models.py` + `summarizer.py` |

**Simple services** are single-file modules:

| Service | Structure |
|---|---|
| `postgres/` | `db.py` |
| `scheduler/` | `db_client.py` |
| `shell/` | `executor.py` |
| `text/` | `operations.py` |
| `time/` | `operations.py` |
| `encoding/` | `operations.py` |

When adding a new simple service, create a subdirectory with `__init__.py` and a single implementation file. Promote to the provider pattern only when multiple backends are needed.

## MCP Tool Structure (`src/lib/mcp/`)

Definitions and implementations mirror each other by category:

```
mcp/
  definitions/   -> browser_defs.py, file_defs.py, shell_defs.py, text_defs.py, utils_defs.py, cron_defs.py, workflow_defs.py
  implementations/ -> browser_impl.py, file_impl.py, shell_impl.py, text_impl.py, utils_impl.py, cron_impl.py, workflow_impl.py
  index.py       -> auto-registers tools by matching definition keys to implementation functions
```

When adding a new tool category, create both a `*_defs.py` and a matching `*_impl.py`. Export in both `__init__.py` files. Do not modify `index.py`.

## App Independence (`src/apps/`)

Each app is a standalone entry point. Apps must **never** import from each other - only from `src/lib/` (via `src/imports.py`).

| App | Purpose | Structure |
|---|---|---|
| `console/` | Interactive CLI chat | `app.py` + `config.py` + `history.py` + `identity.py` + `commands/` (shared command system) + `tools/` (console-only handlers) |
| `gui/` | Desktop GUI (CustomTkinter) | `app.py` + `config.py` + `theme.py` + `components/` |
| `web/` | Web interface | `backend/` (FastAPI) + `frontend/` (React + TypeScript + Vite) |
| `bot/` | Messaging bot | `app.py` + `config.py` + `message_handler.py` + `streaming.py` + `user_identity.py` + `commands/` (shared command system) |
| `cron_job/` | Scheduled workflow runner | `app.py` |

When adding a new app, create a subdirectory under `src/apps/` with at least `__init__.py` and `app.py`. Add a corresponding mode to `src/main.py`.

## Registry Pattern

Use the registry pattern for extensible systems:

- **Providers** register via `ProviderRegistry.register()` at module load time
- **MCP tools** auto-register via dictionary lookup in `lib/mcp/index.py`
- **Shared commands** (model, provider, sessions, etc.) are handled by `CommandService` from `lib/commands/` and wired per-app in `apps/<app>/commands/`
- **Console-only commands** (exit, clear, history, etc.) register in `apps/console/tools/index.py`

When adding a new provider, tool, or command - register it through the existing registry mechanism. Do not bypass registries with direct references.

## Key Architectural Decisions

- **TTS uses dual-thread architecture**: a text-to-audio conversion queue + an audio playback queue. Always call `start_async_processing()` before `play_async()`, and check `is_processing_complete()` before exiting.
- **AIClient supports provider switching at runtime**: The `/provider` and `/model` commands recreate the client while preserving MCP tools and system instructions.
- **AIClient auto-falls back to mock provider** if the configured provider is not available. Check logs if you get unexpected responses.
- **Web app runs as two separate processes**: FastAPI backend + React frontend. There is no combined start script.
- **Scheduler uses natural language**, not cron expressions. The schedule model has `schedule_description` + `recurrence_seconds`.
