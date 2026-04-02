# File Navigation

## Key Directories

- `src/lib/services/ai_client/providers/` - AI provider implementations (vertex, gemini, zhipuai, zai, custom, mock)
- `src/lib/services/ai_client/registry/` - ProviderRegistry and MCPServerRegistry
- `src/lib/mcp/definitions/` - MCP tool definitions (7 category files)
- `src/lib/mcp/implementations/` - MCP tool implementations (7 category files)
- `src/lib/cron/` - Scheduler system (models, nodes, engine, scheduler, parser)
- `src/apps/console/tools/` - Console command handlers (14 commands)
- `src/apps/web/backend/routes/` - Web API routes (7 route files)
- `src/apps/web/frontend/src/lib/` - React frontend (pages, sections, components, services)
- `docs/` - Documentation (organized by guides, reference, development, components)

## Entry Points

- `src/main.py` - Application launcher (supports --mode gui/console/cron)
- `src/imports.py` - Central import hub
- `src/apps/console/app.py` - Console app main logic
- `src/apps/gui/app.py` - GUI app main logic
- `src/apps/web/backend/main.py` - FastAPI web backend
- `src/apps/web/frontend/src/main.tsx` - React frontend entry
- `src/lib/mcp/index.py` - MCP tool registry
- `src/lib/cron/scheduler.py` - CronScheduler entry

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
- `AGENTS.md` - This file - comprehensive project guide for AI assistants
