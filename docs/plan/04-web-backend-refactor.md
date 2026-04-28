# Plan 04: Web Backend Refactor

**Status:** Mostly Complete
**Last Updated:** April 2026

---

## Problem

The web backend has several structural issues that make it fragile and hard to extend:

1. **`sys.path.insert(0, ...)` hacks** in `chat.py`, `chat_stream.py`, `conversations.py`, `history.py` — each route file manually patches the Python path
2. **Duplicate `_init_clients()`** in both `chat.py` and `chat_stream.py` — each file creates its own `AIClient`, `MCPServerRegistry`, and TTS instances as module-level globals, leading to two separate client instances
3. **Cross-module state mutation** — `admin.py` directly imports `chat_module` (the `chat.py` module) and mutates its global `ai_client` variable to apply settings changes; this is fragile and breaks if chat_stream's client is not updated in sync
4. **Cross-app import** — `history.py` imports from `apps.console.history`, violating the architecture rule that apps must not depend on each other
5. **Empty stubs** — `models/__init__.py` and `websocket/__init__.py` appear to be unused stubs
6. **Pydantic models scattered** — request/response models are defined inline in route files instead of centralised in `models/`

---

## What Was Done

- `state.py` created with shared mutable state (`AppState`), `init()`, `get_or_create_ai_client()`, `set_client()`, `update_factory_config()`
- `lifespan` context manager added to `main.py` — initialises PostgresDB on startup, shuts down on teardown
- `_init_clients()` removed from `chat.py` and `chat_stream.py` — both now use `state.py`
- `admin.py` updated to mutate state via `state.py` instead of cross-importing `chat_module`
- `sys.path.insert(0, ...)` hacks removed from all route files
- Cross-app import in `history.py` fixed

## What Remains

- `deps.py` (FastAPI dependency injection via `Depends()`) was skipped — routes import from `state.py` directly instead
- Pydantic models have not been centralised into `models/` — they remain inline in route files
- `models/__init__.py` and `websocket/__init__.py` are still empty stubs

---

## Original Proposed Approach

Introduce a shared **app state** object (FastAPI `lifespan` pattern) that initialises `AIClient`, `MCPServerRegistry`, and other shared services once, and injects them into routes via FastAPI dependency injection.

### Rough Shape

```python
# src/apps/web/backend/state.py
class AppState:
    ai_client: AIClient
    mcp_registry: MCPServerRegistry
    tts: TTSService | None

# src/apps/web/backend/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    state = AppState(...)
    app.state.ai_client = state.ai_client
    yield
    # cleanup

# src/apps/web/backend/deps.py
def get_ai_client(request: Request) -> AIClient:
    return request.app.state.ai_client
```

Route files then use `Depends(get_ai_client)` instead of module-level globals.

---

## Key Files

| File                                           | Change                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/apps/web/backend/main.py`                 | Add `lifespan` context manager; initialise shared state once here                                            |
| `src/apps/web/backend/state.py`                | **New** — `AppState` dataclass holding shared service instances                                              |
| `src/apps/web/backend/deps.py`                 | **New** — FastAPI dependency functions (`get_ai_client`, `get_mcp_registry`, etc.)                           |
| `src/apps/web/backend/routes/chat.py`          | Remove `_init_clients()`, remove `sys.path` hack, use `Depends()`                                            |
| `src/apps/web/backend/routes/chat_stream.py`   | Same as above                                                                                                |
| `src/apps/web/backend/routes/admin.py`         | Update settings mutation to go through `app.state` instead of importing `chat_module`                        |
| `src/apps/web/backend/routes/conversations.py` | Remove `sys.path` hack                                                                                       |
| `src/apps/web/backend/routes/history.py`       | Remove `sys.path` hack; replace cross-app `apps.console.history` import with the proper `lib.services` layer |
| `src/apps/web/backend/models/`                 | Move all Pydantic request/response models here, one file per domain                                          |

---

## Rough Steps

1. **Create `state.py`** — define `AppState` holding `ai_client`, `mcp_registry`, `tts`, and any other shared singletons
2. **Create `deps.py`** — dependency functions that pull from `request.app.state`
3. **Add `lifespan` to `main.py`** — move all client initialisation here; assign to `app.state`
4. **Refactor `chat.py`** — remove `_init_clients()` and `sys.path` hack; inject `ai_client` via `Depends(get_ai_client)`
5. **Refactor `chat_stream.py`** — same as above; both routes now share the same single client instance
6. **Refactor `admin.py`** — settings changes mutate `request.app.state.ai_client` directly instead of cross-importing `chat_module`
7. **Refactor `conversations.py` and `history.py`** — remove `sys.path` hacks; fix `history.py` cross-app import by using `src.lib.services.conversation` directly
8. **Centralise Pydantic models** — move inline models from route files into `models/` subdirectory files
9. **Clean up empty stubs** — populate or delete `models/__init__.py` and `websocket/__init__.py`
10. **Verify** — run the backend, test all endpoints still work; confirm only one `AIClient` instance is created

---

## Notes

- The `sys.path` hacks are almost certainly a leftover from before a proper package structure was in place; they should not be necessary if the app is run from the repo root with the correct `PYTHONPATH` or `pyproject.toml` setup
- The `lifespan` pattern is the FastAPI-idiomatic replacement for startup/shutdown event handlers
- Do not change any public API contracts (request/response shapes) during this refactor — this is purely structural
- This refactor unblocks Plans 02 and 03 by providing a clean place to inject shared services into new routes
