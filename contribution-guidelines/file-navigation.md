# File Navigation

## Where to Put New Code

| If you're adding...                                  | Put it in...                                                                                                                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A new AI provider                                    | `src/lib/services/ai_client/providers/` - extend `LangChainProvider`, register via `ProviderRegistry`                                                                |
| A new tool group                                     | `src/lib/tools/<group>_tool.py` (a `BaseTool` subclass), then add the class to `ALL_TOOL_CLASSES` in `src/lib/tools/catalog.py`                                      |
| A new shared command (model/provider/sessions logic) | Logic in `src/lib/commands/service.py`; an async handler plus a `SHARED_COMMANDS` entry in `src/lib/commands/handlers.py` (both apps get it; the bot overrides `/new`). App-only commands go in `src/<app>/commands/handlers.py` |
| A new console-only command                           | `src/console/tools/` as `*_cmd.py`, register in `tools/index.py`                                                                                                     |
| A new web API route                                  | `src/backend/routes/`, with its Pydantic models in `src/backend/models/`; include the router in `src/backend/main.py`                                                |
| State shared by backend routes                       | An attribute on `AppState` in `src/backend/state.py`, reached through `Depends(get_state)`; settings logic goes in `src/backend/settings_service.py`                  |
| A new bot feature                                    | `src/bot/`                                                                                                                                                           |
| A new React page/widget                              | Under `src/apps/web/frontend/src/lib/`: pages in `pages/`, widgets in `widgets/`, components in `components/`                                                        |
| A new integration (external system, DB, device)      | `src/lib/services/<name>/`                                                                                                                                           |
| A new stateless helper                               | `src/lib/utils/`                                                                                                                                                     |
| Workflow engine or scheduler logic                   | `src/lib/workflows/`                                                                                                                                                 |
| A library name an app needs                          | `src/imports.py` - add it to `_EXPORTS` and the `TYPE_CHECKING` block                                                                                                |
| Tests                                                | `tests/`, mirroring `src/` (e.g. `tests/bot/`, `tests/lib/tools/`)                                                                                                   |

## Entry Points

Know these when debugging startup or tracing execution flow:

- `src/main.py` - Launcher (`--mode backend|bot|worker|console`, `cron` is an alias for `worker`, default `backend`)
- `src/imports.py` - Lazy import hub for apps
- `src/backend/main.py` - FastAPI backend (`python -m backend.main` from `src/`)
- `src/bot/app.py` - Telegram bot
- `src/worker/app.py` - Workflow scheduler process
- `src/console/app.py` - Console app
- `src/apps/web/frontend/src/main.tsx` - React frontend
- `src/lib/tools/index.py` - Tool registration (`register_all_tools`)
- `src/lib/workflows/scheduler.py` - Scheduler facade: `run(workflow_id)`, `start()`/`stop()` (`loop.py` holds the poll loop)
