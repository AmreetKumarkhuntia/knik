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
  frontend/            # React frontend
  lib/                 # shared library: core, utils, commands, tools, workflows, services
```

Put shared or reusable code in `src/lib/`. Put app-specific code in the app that uses it.

## Dependency Rules

1. **Apps never import each other.** `backend`, `bot`, `worker` and `console` are independent.
2. **Apps import library names through `src/imports.py`**, never through deep `lib.*` paths. The hub is lazy (PEP 562 `__getattr__` over the `_EXPORTS` map), so an app only loads the integrations it uses. To expose a new name, add it to `_EXPORTS` **and** to the `TYPE_CHECKING` block. `tests/test_imports_hub.py` fails if the two differ or a name does not resolve.
3. **Code under `lib/` never imports `imports.py` or any app.** It imports its siblings directly, e.g. `from lib.utils.printer import printer`.
4. **`lib/` is layered.** From top to bottom: `tools`, then `workflows` and `commands` side by side, then `services`, `utils` and `core`. A layer may import the layers below it, never the ones above, and `workflows` and `commands` do not import each other. So services never import tools, workflows or commands, and `utils` and `core` import nothing above them.
5. **Workflows and commands never import `lib/tools`.** A workflow AI node gets its tools through the AI-client factory the app hands to the engine (`Scheduler(ai_client_factory=build_workflow_client)`); without one, AI nodes run without tools.
6. **Services do not import each other.** The one exception is `lib/services/db`, the shared database foundation, which other services may import. `services/db` itself imports no other service. The AI client knows tools only through its `ToolProvider` protocol, never through `lib/tools`.

These rules are enforced by import-linter contracts in `pyproject.toml`. Run them with `npm run lint:imports`; CI and pre-commit run them too. CI also fails on any `sys.path.insert` under `src/`.

## Apps

| App                  | Purpose                                     | Structure                                                                                                                                                     |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/`           | FastAPI web backend (port 8010)             | `main.py` (app, lifespan, 503 handler for database errors) + `config.py` + `state.py` (`AppState`, built once in the lifespan: settings, per-conversation client cache, TTS, the `Scheduler`; `client()` lends a request its client, whose tools are cleaned up only once no request holds it) + `deps.py` (`get_state` for `Depends`; `require_api_key`, the optional X-API-Key check every route under `api_router` runs) + `consent.py` (`WebConsentGate`: web chats cannot ask, so `KNIK_WEB_TOOL_CONSENT` answers, `deny` by default) + `settings_service.py` (env/persisted/runtime settings merge; admin tool toggles) + `analytics.py` (dashboard formatting) + `routes/` + `models/` |
| `bot/`               | Telegram bot                                | `app.py` + `config.py` + `transport.py` (`MessagingTransport` protocol) + `message_handler.py` + `streaming.py` + `user_identity.py` (sender to `users` row via `UserDB`, cached; a temporary in-memory id while Postgres is down) + `user_client_manager.py` (one client per user) + `consent.py` (`ConsentBroker`, keyed by chat and user) + `commands/` (bot-only commands and aliases) |
| `worker/`            | Workflow scheduler process                  | `app.py` (`WorkerApp`)                                                                                                                                        |
| `console/`           | Interactive terminal chat                   | `app.py` + `config.py` + `processor.py` (input loop and command dispatch) + `history.py` + `identity.py` + `commands/` (console `/help` and dispatcher) + `tools/` (console-only commands) |
| `frontend/`          | React + TypeScript + Vite (dev server 8020) | `src/main.tsx` + `src/lib/` (pages, widgets, components, stores)                                                                                              |

When adding a new app:

1. Create `src/<app>/` with `__init__.py` and `app.py`.
2. Add a runner to `RUNNERS` in `src/main.py`.
3. Add the package to `root_packages`, the app independence contract and the `lib` forbidden contract in `pyproject.toml`.
4. Add it to `known-first-party` in `.ruff.toml`.

## Library Domains (`src/lib/`)

| Domain       | Purpose                                                                                  | Structure                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/`      | App-level configuration                                                                  | Flat - `config.py`                                                                                                                                                          |
| `utils/`     | Stateless helpers (`printer`, `async_utils`, `graph_utils`, `timezone_utils`, `text_ops`, `time_ops`, `encoding_ops`) | Flat files, no subdirectories                                                                                                                                               |
| `commands/`  | Shared commands for the console and bot                                                  | `service.py` (`CommandService`, acts on the caller's client through a `ClientResolver`) + `models.py` + `registry.py` (`CommandRegistry`, `CommandDispatcher`) + `handlers.py` (shared handlers, `register_shared_commands`) |
| `tools/`     | Tools the AI can call. An in-process LangChain tool registry, not Model Context Protocol | One `*_tool.py` per tool group + `base_tool.py` + `registry.py` + `consent.py` + `catalog.py` + `index.py`                                                                  |
| `workflows/` | Workflow engine and scheduler (row models live in `services/db/models.py`)               | Flat - `nodes.py`, `engine.py`, `scheduler.py`, `loop.py`, `schedule_parser.py`, `schedule_service.py`, `workflow_service.py`, `errors.py` (`NotFoundError`, `ValidationError`), `functions.py`, `validation.py`, `schema.py` (the definition model and `normalize_definition`, shared by `workflow_service`, validation and the engine) |
| `services/`  | Integrations only (AI, TTS, Telegram, database, browser, shell)                          | One subdirectory per service                                                                                                                                                |

## Services (`src/lib/services/`)

Each service is a **self-contained module** (see Dependency Rules).

**Complex services** follow the provider pattern:

| Service      | Structure                                                                                                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai_client/` | `client.py` + `stream_events.py` (typed chat-stream events: `TextDelta`, `ToolCallStarted`, `ToolCallFinished`, `StreamError`, `ConversationReady`, `StreamDone`) + `factory.py` (`build_client`, the one way to build a client) + `settings.py` (`ClientSettings`, and which settings each provider accepts; a model or provider switch re-filters them) + `client_cache.py` (LRU; a client that leaves it is released, by default by cleaning up its tools) + `tool_provider.py` (`ToolProvider`, what the client needs from a tool registry) + `compaction.py` (conversation summaries) + `titles.py` (conversation titles) + `providers/` (base + one file per provider) + `registry/` (`provider_registry.py`) + `pricing.py` + `token_utils.py` |
| `tts/`       | `processor.py` + `providers/` (base + kokoro) + `audio/` (playback) + `utils.py`                                                                                                                                                                                |

When adding a new complex service that supports multiple backends, follow this same pattern: a client module, a `providers/` subdirectory with a base class and implementations, and a registry.

**The database service** is the shared foundation other services may import:

| Service | Structure                                                                                                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db/`   | `connection.py` (`PostgresDB` pool, `DatabaseUnavailable`, `DB_ERRORS`) + `models.py` (row dataclasses) + `repositories/` (`base`, `conversations` (with `ConversationScope`: which conversations a caller may list and open), `users`, `workflows`, `schedules`, `executions`, `settings`) |

Repositories raise on database errors; they never log-and-return a default. A caller that can carry on without Postgres catches `DB_ERRORS` itself, and the backend maps any database error that reaches a route to HTTP 503. Schema changes go in a new numbered file in `db/migrations/`, written so it can be re-run safely; `scripts/migrate.sh` applies the ones not yet recorded in `schema_migrations`.

**Simple services** are a client module plus, where needed, a `models.py`:

| Service     | Structure                                                          |
| ----------- | ------------------------------------------------------------------ |
| `telegram/` | `client.py` (`TelegramClient`) + `models.py`                       |
| `browser/`  | `session.py` (`BrowserSession`, Playwright lifecycle, idle cleanup) |
| `shell/`    | `executor.py`                                                      |

When adding a new simple service, create a subdirectory with `__init__.py` and a single implementation file. Promote to the provider pattern only when multiple backends are needed. Pure helpers that do not talk to anything outside the process belong in `lib/utils/`, not in `services/`.

## Tool Structure (`src/lib/tools/`)

```
tools/
  browser_tool.py, cron_tool.py, file_tool.py, shell_tool.py,
  text_tool.py, utils_tool.py, workflow_tool.py
  base_tool.py -> BaseTool, the base class of a tool group
  registry.py  -> ToolRegistry, cleanup_all_tools()
  consent.py   -> ConsentGate, ConsentRequest, parse_consent_reply(), format_consent_prompt()
  catalog.py   -> ALL_TOOL_CLASSES, the list of tool classes
  index.py     -> register_all_tools(registry, disabled=...), create_tool_registry(consent_gate=..., disabled=...),
                  build_workflow_client(settings, use_tools), get_all_tools(), get_tool_info()
```

Each `*_tool.py` is one tool group: a `BaseTool` subclass whose `get_definitions()` returns JSON Schema tool definitions and whose `get_implementations()` maps each tool name to its function. Tool names that need user approval go in the class's `consent_required_for`.

`create_tool_registry()` makes a `ToolRegistry`, attaches the consent gate if one is given and calls `register_all_tools()`, which instantiates every class in `ALL_TOOL_CLASSES` and binds each definition to its implementation, leaving out the tool names in `disabled`. The registry owns the tool instances it registered: `cleanup_tools()` cleans them up (closing a browser, for example) and revokes "yes all" approvals. Live registries are tracked weakly, so `cleanup_all_tools()` reaches every one at app shutdown without keeping a dropped one alive. `AIClient` turns the registry into LangChain tools. The "MCP" in some names (`McpToolsDB`, the admin MCP tool toggles) is historical.

Consent gates are per app (`bot/consent.py`, `console/tools/consent_gate.py`, `backend/consent.py`). The bot and the console word the prompt with `format_consent_prompt()` and read the answer with `parse_consent_reply()`; the web backend cannot ask yet, so `KNIK_WEB_TOOL_CONSENT` answers for it (`deny` by default).

To add a tool group, create `lib/tools/<group>_tool.py` and add its class to `ALL_TOOL_CLASSES` in `catalog.py`. Do not modify `index.py`.

## Registry Pattern

Use the registry pattern for extensible systems:

- **Providers** register via `ProviderRegistry.register()` at module load time
- **Tools** are listed in `lib/tools/catalog.py`; each app calls `create_tool_registry()` and passes the registry to `build_client(settings, tool_registry=...)`
- **AI clients** are built only by `build_client()` from a `ClientSettings` (`lib/services/ai_client/factory.py`). It passes the model as `model_name` and hands a provider only the settings its constructor declares, so the chosen model takes effect for every provider
- **Shared commands** (new, resume, sessions, model, provider, status) live in `lib/commands/handlers.py`; each app calls `register_shared_commands()` and then registers its own, replacing a shared one where it words it differently (the bot's `/revoke`, `/help`, `/start` alias and its own `/new`, which adds a welcome list and cleans up the user's tools; the console's `/help`)
- **Console-only commands** (exit, clear, history, etc.) register in `console/tools/index.py`

When adding a new provider, tool, or command - register it through the existing registry mechanism. Do not bypass registries with direct references.

## Key Architectural Decisions

- **TTS uses dual-thread architecture**: a text-to-audio conversion queue + an audio playback queue. Always call `start_async_processing()` before `play_async()`, and check `is_processing_complete()` before exiting.
- **AIClient supports provider switching at runtime**: The `/provider` and `/model` commands swap the provider inside the client (`set_provider`, `set_model`), keeping its tool registry and system instruction.
- **Workflow AI nodes own their client**: each AI node builds a client through the engine's `ai_client_factory` and cleans up that client's tools when the call ends. `build_workflow_client` gives that client a registry without a consent gate, so a node with `use_tools` runs every tool unasked.
- **AIClient auto-falls back to mock provider** if the configured provider is not available. Check logs if you get unexpected responses.
- **Web app runs as two separate processes**: FastAPI backend (port 8010) + React dev server (port 8020). There is no combined start script.
- **Schedules fire only while the worker runs**: the backend executes workflows on request but does not run the scheduler loop.
- **Scheduler uses natural language**, not cron expressions. The schedule model has `schedule_description` + `recurrence_seconds`.
