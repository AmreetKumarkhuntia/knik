# Plan 07: MCP Auth — Tool Execution Consent Layer

**Status:** In Progress
**Last Updated:** April 2026

---

## Problem

There is no user-facing consent mechanism for tool execution in Knik. When the AI decides to run a potentially dangerous tool (e.g. `execute_shell`, `write_file`), it does so silently without any user awareness or approval. This is a security and trust concern, especially in the bot backend where a remote user's AI session can trigger shell commands or file writes on the host machine.

---

## Approach

Introduce a **consent gate** interface into `MCPServerRegistry`. Tools declare which of their functions require user consent via a `consent_required_for` class attribute. Before executing a flagged function, the registry pauses execution and asks the user to approve or deny. Each app backend provides its own gate implementation — the bot sends a Telegram message and waits for a reply; the console prompts via `input()`.

The gate is a pluggable protocol, not baked into any specific backend, so it can be wired up in web, GUI, or any future backend without touching the registry.

---

## The Thread Bridge Problem

`AIClient.achat` runs the LangChain call (and therefore all tool execution) inside `asyncio.to_thread()` — a background thread. This means `execute_tool()` is called from a worker thread, not the event loop.

A naive `await consent_gate.request()` won't work from a thread. The solution: `ConsentGate` exposes a `request_sync()` method that uses `asyncio.run_coroutine_threadsafe(self.request(req), loop).result(timeout)` to block the worker thread while the event loop handles the async consent flow (sending the message, awaiting the user reply via a `Future`).

---

## Data Flow

```
AI decides → shell_execute(command="rm -rf ...")
    │
    ▼
create_langchain_tools() closure → execute_tool("shell_execute", ...)
    │
    ▼
execute_tool(): "shell_execute" ∈ _consent_required?  YES
    │
    ▼
consent_gate.request_sync(ConsentRequest("shell_execute", kwargs))
    │  [blocks worker thread; bridges to event loop via run_coroutine_threadsafe]
    ▼
BotConsentGate.request():
    send_message(chat_id, "Allow shell_execute(command='rm -rf ...')? Reply yes/no")
    future = loop.create_future()
    PendingConsents.add(chat_id, future)
    await asyncio.wait_for(future, timeout=30)
    │
    ▼  [user replies "yes" as a new Telegram message]
    │
BotMessageHandler.handle():
    PendingConsents.has_pending(chat_id)? → YES
    PendingConsents.resolve(chat_id, True)  ← resolves the future
    return  ← message consumed, not routed to AI
    │
    ▼
request_sync() unblocks → returns True
    │
    ▼
execute_tool() proceeds → calls impl → returns result
```

---

## Key Files

| File | Change |
|---|---|
| `src/lib/services/ai_client/consent.py` | **New** — `ConsentRequest` dataclass + `ConsentGate` Protocol |
| `src/lib/services/ai_client/base_tool.py` | Add `consent_required_for: ClassVar[frozenset[str]] = frozenset()` |
| `src/lib/services/ai_client/registry/mcp_registry.py` | Store `_consent_gate` + `_consent_required`; consent check in `execute_tool()`; route `create_langchain_tools()` through `execute_tool()` |
| `src/lib/mcp/tools/shell_tool.py` | Declare `consent_required_for` for shell execution functions |
| `src/lib/mcp/tools/file_tool.py` | Declare `consent_required_for` for `write_file`, `append_to_file` |
| `src/apps/bot/consent.py` | **New** — `PendingConsents` (global `chat_id → Future` dict) + `BotConsentGate` |
| `src/apps/bot/message_handler.py` | Check `PendingConsents` before busy-hint logic; resolve on yes/no reply |
| `src/apps/bot/user_client_manager.py` | Add `update_consent_gate(user_id, chat_id, messaging_client, loop)` |
| `src/apps/console/tools/consent_gate.py` | **New** — `ConsoleConsentGate` using `input()` |

---

## Implementation Steps

1. **`consent.py` (lib layer)** — define `ConsentRequest` and `ConsentGate` Protocol with both `async request()` and sync `request_sync()` methods

2. **`BaseTool`** — add `consent_required_for: ClassVar[frozenset[str]] = frozenset()`; tools override this to declare which function names require consent

3. **`MCPServerRegistry`**:
   - `_consent_gate: ConsentGate | None` and `_consent_required: set[str]`
   - `set_consent_gate(gate)` method
   - `add_tool_instance()` populates `_consent_required` from `tool.consent_required_for`
   - `execute_tool()` checks gate before calling impl
   - `create_langchain_tools()` routes through `execute_tool()` (not raw impl) so consent is enforced for LangChain-invoked tools too

4. **Tool declarations** — set `consent_required_for` on `ShellTool` (all shell execution functions) and `FileTool` (`write_file`, `append_to_file`)

5. **`BotConsentGate`** — `request()` sends a message and parks an `asyncio.Future` in `PendingConsents`; `request_sync()` bridges via `run_coroutine_threadsafe`

6. **`BotMessageHandler`** — at the top of `handle()`, check if `PendingConsents.has_pending(chat_id)` and route yes/no text to the resolver before the normal busy-check logic

7. **`UserClientManager`** — add `update_consent_gate()` to attach a fresh `BotConsentGate` to the user's registry on each message (so `chat_id` + `loop` are always current)

8. **`_process_message()`** in the bot — call `update_consent_gate()` after `get_or_create()`

9. **`ConsoleConsentGate`** — `request_sync()` calls `input()` directly (thread-safe; blocks the worker thread while the event loop stays free); wire into the console app's registry

---

## Interface Sketch

```python
# src/lib/services/ai_client/consent.py

@dataclass
class ConsentRequest:
    tool_name: str
    kwargs: dict[str, Any]

class ConsentGate(Protocol):
    async def request(self, req: ConsentRequest) -> bool: ...
    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> bool: ...
```

```python
# MCPServerRegistry.execute_tool()
def execute_tool(self, tool_name: str, **kwargs) -> Any:
    if self._consent_gate and tool_name in self._consent_required:
        req = ConsentRequest(tool_name=tool_name, kwargs=kwargs)
        allowed = self._consent_gate.request_sync(req)
        if not allowed:
            return {"error": f"Permission denied for {tool_name}"}
    impl = self.get_implementation(tool_name)
    if impl is None:
        raise ValueError(f"No implementation found for tool: {tool_name}")
    return impl(**kwargs)
```

```python
# src/apps/bot/consent.py

class PendingConsents:
    _pending: ClassVar[dict[str, asyncio.Future]] = {}

    @classmethod
    def add(cls, chat_id: str, future: asyncio.Future) -> None: ...

    @classmethod
    def has_pending(cls, chat_id: str) -> bool: ...

    @classmethod
    def resolve(cls, chat_id: str, allowed: bool) -> bool: ...  # returns True if resolved


class BotConsentGate:
    def __init__(self, chat_id: str, messaging_client, loop: asyncio.AbstractEventLoop) -> None: ...

    async def request(self, req: ConsentRequest) -> bool:
        # send message, park Future, await with timeout
        ...

    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> bool:
        future = asyncio.run_coroutine_threadsafe(self.request(req), self._loop)
        try:
            return future.result(timeout=timeout)
        except TimeoutError:
            return False
```

---

## Scope

**In scope:**
- Consent gate protocol in `MCPServerRegistry` (backend-agnostic)
- `ShellTool` and `FileTool` write-op declarations
- Bot backend gate (Telegram message + Future-based reply detection)
- Console backend gate (`input()`)

**Out of scope:**
- Web frontend consent (requires WebSocket/SSE round-trip — separate plan)
- Per-user allow-lists or "always allow this tool" preference storage
- OAuth / external service authentication (original plan doc direction — deferred indefinitely)
