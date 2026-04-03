# Plan 01 — Tool Base Class Refactor

**Status:** Complete
**Last Updated:** April 2026

---

## Problem

`ToolSessionManager` was a monolithic singleton. MCP tool implementations were bare functions that called `ToolSessionManager.get_instance()` directly. There was no abstraction boundary between what a tool does, how it manages resources, and how it gets session context. `conversation_id` was threaded through a ContextVar that each browser impl function read independently.

## Goal

1. **`BaseTool` ABC** — single contract for every tool (session-aware or stateless).
2. **No global state** — no singletons, no ContextVars. Each call site creates its own `MCPServerRegistry` + tool instances per conversation context.
3. **`BrowserTool` owns its own Playwright lifecycle** — standalone, self-managed, no dependency on `ToolSessionManager`.
4. **Delete `tool_session/` entirely** — `ToolSessionManager`, `ToolRegistry`, `current_conversation_id` and all related infrastructure are removed.

## Final Architecture

```
src/lib/services/ai_client/
  base_tool.py                  ← BaseTool ABC with _instances tracking + cleanup_all()

src/lib/mcp/
  index.py                      ← register_all_tools(), get_all_tools(), get_tool_info()
  tools/
    __init__.py                 ← ALL_TOOL_CLASSES list + named exports
    file_tool.py                ← FileTool(BaseTool) — FILE_DEFINITIONS inlined
    shell_tool.py               ← ShellTool(BaseTool) — SHELL_DEFINITIONS inlined
    text_tool.py                ← TextTool(BaseTool) — TEXT_DEFINITIONS inlined
    utils_tool.py               ← UtilsTool(BaseTool) — UTILS_DEFINITIONS inlined
    cron_tool.py                ← CronTool(BaseTool) — CRON_DEFINITIONS inlined
    workflow_tool.py            ← WorkflowTool(BaseTool) — WORKFLOW_DEFINITIONS inlined
    browser_tool.py             ← BrowserTool(BaseTool) — BROWSER_DEFINITIONS inlined, standalone Playwright
```

`src/lib/services/tool_session/` — **deleted entirely**.
`src/lib/mcp/definitions/` — **deleted entirely** (inlined into tool files).
`src/lib/mcp/implementations/` — **deleted entirely** (logic already in tool classes).

## What Was Deleted

| Item | Reason |
|---|---|
| `src/lib/services/tool_session/` (7 files) | Entire directory removed — all infrastructure replaced by `BaseTool` |
| `ToolSessionManager` | Replaced by per-instance lifecycle in `BrowserTool` |
| `ToolRegistry` singleton | Replaced by `BaseTool.cleanup_all()` class method |
| `current_conversation_id` ContextVar | Removed — no global state |
| `src/lib/mcp/implementations/browser_impl.py` | Logic moved into `BrowserTool` |
| `src/lib/mcp/implementations/` (entire directory) | Dead code — logic already inlined in tool classes |
| `src/lib/mcp/definitions/` (entire directory) | Definition lists inlined into each `*_tool.py` |
| `tool_session_idle_timeout` config field | No longer relevant |

## Architecture

### `BaseTool` ABC — `src/lib/services/ai_client/base_tool.py`

```python
class BaseTool(ABC):
    _instances: ClassVar[list["BaseTool"]] = []

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def get_definitions(self) -> list[dict[str, Any]]: ...

    @abstractmethod
    def get_implementations(self) -> dict[str, Callable]: ...

    def cleanup(self) -> None:
        pass  # no-op default; override in session-aware tools

    def __init__(self) -> None:
        BaseTool._instances.append(self)

    @classmethod
    def cleanup_all(cls) -> None:
        for instance in cls._instances:
            instance.cleanup()
```

`BaseTool.cleanup_all()` replaces both `ToolRegistry.cleanup_all()` and `ToolRegistry.cleanup_session()` at all call sites.

### `BrowserTool` — `src/lib/mcp/tools/browser_tool.py`

Standalone: owns its own `Playwright` instance, `ThreadPoolExecutor`, and page map. No dependency on `ToolSessionManager`. `cleanup()` override shuts down Playwright and the executor.

### Stateless Tool Classes

`FileTool`, `ShellTool`, `TextTool`, `UtilsTool`, `CronTool`, `WorkflowTool` each:
- Subclass `BaseTool`
- `get_definitions()` returns the relevant MCP schema list
- `get_implementations()` delegates to the corresponding `*_impl.py` functions
- Do not override `cleanup()` (no resources to release)

### Registration — `src/lib/mcp/index.py`

```python
def register_all_tools(registry) -> int:
    if registry is None:
        raise ValueError("An MCPServerRegistry instance is required")

    count = 0
    for tool_cls in ALL_TOOL_CLASSES:
        tool = tool_cls()
        impls = tool.get_implementations()
        for tool_def in tool.get_definitions():
            tool_name = tool_def.get("name")
            impl = impls.get(tool_name)
            if impl:
                registry.register_tool(tool_def, impl)
                count += 1

    return count
```

Callers create a fresh `MCPServerRegistry()`, call `register_all_tools(registry)`, and pass the registry to `AIClient`. No shared state between conversations.

### `_wrap_with_logging` — `src/lib/services/ai_client/registry/mcp_registry.py`

```python
def _wrap_with_logging(tool_name: str, func: Callable) -> Callable:
    def wrapper(**kwargs):
        printer.info(f"Tool Input: {tool_name}({kwargs})")
        try:
            result = func(**kwargs)
            printer.info(f"Tool Output: {tool_name} -> {result}")
            return result
        except Exception as e:
            printer.error(f"Tool Error: {tool_name} -> {e}")
            return {"error": str(e)}
    return wrapper
```

No ContextVar read. No `conversation_id` injection. Tools that need conversation context receive it through their own mechanisms.

### App Shutdown Pattern

All app shutdown paths call `BaseTool.cleanup_all()` directly:

| File | Call |
|---|---|
| `apps/console/app.py` | `BaseTool.cleanup_all()` |
| `apps/gui/app.py` | `BaseTool.cleanup_all()` |
| `apps/bot/app.py` | `BaseTool.cleanup_all()` |
| `apps/web/backend/routes/conversations.py` | `BaseTool.cleanup_all()` |

### Per-Invocation Client Construction (Web Routes)

`chat.py` and `chat_stream.py` each build a fresh `MCPServerRegistry` on first request:

```python
def _build_ai():
    registry = MCPServerRegistry()
    register_all_tools(registry)
    client = AIClient(
        provider=config.ai_provider,
        mcp_registry=registry,
        ...
    )
    return registry, client

mcp_registry, ai_client = await asyncio.to_thread(_build_ai)
```

`cron/nodes.py` follows the same pattern — fresh registry per invocation.

## Files Changed

**New files:**
- `src/lib/services/ai_client/base_tool.py`
- `src/lib/mcp/tools/__init__.py`
- `src/lib/mcp/tools/file_tool.py`
- `src/lib/mcp/tools/shell_tool.py`
- `src/lib/mcp/tools/text_tool.py`
- `src/lib/mcp/tools/utils_tool.py`
- `src/lib/mcp/tools/cron_tool.py`
- `src/lib/mcp/tools/workflow_tool.py`

**Modified files:**
- `src/lib/mcp/tools/browser_tool.py` — rewritten as standalone `BaseTool` subclass
- `src/lib/mcp/index.py` — rewritten to use `ALL_TOOL_CLASSES`
- `src/lib/mcp/implementations/__init__.py` — removed `browser_impl` import and `BROWSER_IMPLEMENTATIONS`
- `src/lib/services/ai_client/registry/mcp_registry.py` — removed ContextVar import, simplified `_wrap_with_logging`
- `src/lib/services/ai_client/client.py` — removed both `current_conversation_id.set()` calls and the import
- `src/lib/services/__init__.py` — removed `tool_session` exports
- `src/imports.py` — removed `tool_session` import block and `__all__` entries
- `src/lib/core/config.py` — removed `tool_session_idle_timeout` field
- `src/apps/console/app.py` — removed `ToolRegistry`/`current_conversation_id`, added `BaseTool`
- `src/apps/gui/app.py` — same
- `src/apps/bot/app.py` — removed `ToolRegistry`, added `BaseTool`
- `src/apps/web/backend/routes/conversations.py` — removed `ToolRegistry`, added `BaseTool`

**Deleted files:**
- `src/lib/services/tool_session/__init__.py`
- `src/lib/services/tool_session/manager.py`
- `src/lib/services/tool_session/registry.py`
- `src/lib/services/tool_session/browser_tool.py`
- `src/lib/services/tool_session/browser_resource.py`
- `src/lib/services/tool_session/models.py`
- `src/lib/services/tool_session/resources.py`
- `src/lib/mcp/implementations/` (entire directory: `file_impl.py`, `shell_impl.py`, `text_impl.py`, `utils_impl.py`, `cron_impl.py`, `workflow_impl.py`, `__init__.py`)
- `src/lib/mcp/definitions/` (entire directory: `file_defs.py`, `shell_defs.py`, `text_defs.py`, `utils_defs.py`, `cron_defs.py`, `workflow_defs.py`, `browser_defs.py`, `__init__.py`)
