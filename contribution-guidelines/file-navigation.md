# File Navigation

## Where to Put New Code

| If you're adding... | Put it in... |
|---|---|
| A new AI provider | `src/lib/services/ai_client/providers/` - extend `LangChainProvider`, register via `ProviderRegistry` |
| A new MCP tool | Definition in `src/lib/mcp/definitions/`, implementation in `src/lib/mcp/implementations/`, export in both `__init__.py` files |
| A new console command | `src/apps/console/tools/` as `*_cmd.py`, register in `tools/index.py` |
| A new web API route | `src/apps/web/backend/routes/` |
| A new React page/section | Pages in `frontend/src/lib/pages/`, sections in `frontend/src/lib/sections/`, components in `frontend/src/lib/components/` |
| A new reusable service/utility | `src/lib/services/` or `src/lib/utils/` |
| Scheduler/workflow logic | `src/lib/cron/` |
| GUI components | `src/apps/gui/components/` |

## Entry Points

Know these when debugging startup or tracing execution flow:

- `src/main.py` - Application launcher (`--mode gui/console/cron`)
- `src/imports.py` - Central import hub (use this for all imports)
- `src/apps/console/app.py` - Console app entry
- `src/apps/gui/app.py` - GUI app entry
- `src/apps/web/backend/main.py` - FastAPI backend entry
- `src/apps/web/frontend/src/main.tsx` - React frontend entry
- `src/lib/mcp/index.py` - MCP tool registry
- `src/lib/cron/scheduler.py` - Scheduler entry
