# Plan 01: Refactor Tool Session into a Generic Tool Base Class

**Status:** Planning
**Last Updated:** April 2026

---

## Problem

The current `ToolSessionManager` is a monolithic singleton that manages per-conversation resource lifecycles (browser, etc.). MCP tool implementations are tightly coupled to it — they call `ToolSessionManager.get_instance().run_on_thread("browser", ...)` directly everywhere in `browser_impl.py`. There is no clean abstraction boundary between "what a tool does" and "how it manages its session/resources".

This makes it hard to:
- Add new tools that require session management (e.g., a file editor, a code runner)
- Test tool logic in isolation
- Understand what a tool is responsible for at a glance
- Extend or replace session behaviour per tool without touching the manager

---

## Proposed Approach

Introduce a `BaseTool` abstract class that encapsulates:
1. **Tool definitions** — the MCP tool schemas the tool exposes
2. **Session/resource lifecycle** — how to acquire, use, and release resources for a conversation
3. **Tool execution** — the actual tool handler logic

Each concrete tool (e.g., `BrowserTool`) inherits from `BaseTool` and provides its own implementation. The `ToolSessionManager` either becomes a thin coordinator used internally by `BaseTool`, or is dissolved into the base class itself.

### Rough Shape

```python
# src/lib/tools/base.py
class BaseTool(ABC):
    @abstractmethod
    def get_definitions(self) -> list[ToolDefinition]: ...

    @abstractmethod
    async def execute(self, name: str, args: dict, conversation_id: str) -> ToolResult: ...

    async def on_session_start(self, conversation_id: str) -> None: ...
    async def on_session_end(self, conversation_id: str) -> None: ...
```

```python
# src/lib/tools/browser_tool.py
class BrowserTool(BaseTool):
    def get_definitions(self): return BROWSER_TOOL_DEFINITIONS
    async def execute(self, name, args, conversation_id): ...
    async def on_session_start(self, conversation_id): # launch browser
    async def on_session_end(self, conversation_id):   # close browser
```

---

## Key Files

| File | Change |
|------|--------|
| `src/lib/services/tool_session/manager.py` | Refactor or dissolve into base class |
| `src/lib/services/tool_session/resources.py` | Keep `SessionResource`/`SessionResourceFactory` ABCs, used internally by `BaseTool` |
| `src/lib/services/tool_session/browser_resource.py` | Move resource logic into `BrowserTool` or keep as internal detail |
| `src/lib/mcp/implementations/browser_impl.py` | Replace direct `ToolSessionManager` calls with `BrowserTool.execute()` |
| `src/lib/mcp/definitions/browser_defs.py` | No change — consumed by `BrowserTool.get_definitions()` |
| `src/lib/mcp/index.py` | Register `BrowserTool` instance instead of raw tool callables |
| `src/lib/services/ai_client/registry/mcp_registry.py` | Accept `BaseTool` instances for registration |
| `src/lib/tools/base.py` | **New** — `BaseTool` abstract class |
| `src/lib/tools/browser_tool.py` | **New** — `BrowserTool` concrete implementation |

---

## Rough Steps

1. **Define `BaseTool` ABC** in `src/lib/tools/base.py` with `get_definitions`, `execute`, `on_session_start`, `on_session_end`
2. **Create `BrowserTool`** in `src/lib/tools/browser_tool.py` — move browser impl logic from `browser_impl.py` and resource lifecycle from `browser_resource.py` into this class
3. **Update `MCPServerRegistry`** to accept `BaseTool` instances and call `get_definitions()` + `execute()` instead of raw callables
4. **Update tool registration** in `mcp/index.py` to instantiate and register `BrowserTool`
5. **Wire session lifecycle** — when a conversation ends, call `on_session_end()` on all registered tools (currently done via `ToolSessionManager.cleanup_session()`)
6. **Update all callers** of `ToolSessionManager.cleanup_session()` / `cleanup_all()` in console, GUI, bot, and web apps to use the new lifecycle API
7. **Delete or slim down** `ToolSessionManager` — if it's still needed as a coordinator, keep it internal; do not expose it publicly
8. **Update `src/lib/tools/__init__.py`** with public exports

---

## Notes

- Keep backward compatibility with the existing `ToolDefinition` schema — no changes to what tools look like from the LLM's perspective
- The `run_on_thread` pattern (dedicated thread pool per resource type) should be preserved inside `BrowserTool` — Playwright requires a consistent thread
- The `current_conversation_id` context variable pattern in the manager should be reviewed — it may be cleaner to pass `conversation_id` explicitly through `execute()`
