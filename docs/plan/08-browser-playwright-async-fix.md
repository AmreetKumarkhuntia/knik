# Plan 08 — Fix Playwright Sync API inside asyncio loop

**Status:** Pending
**Last Updated:** April 2026

---

## Problem

`BrowserTool._ensure_browser()` calls `sync_playwright().start()` on a dedicated `ThreadPoolExecutor(max_workers=1)` thread. Playwright's sync API detects a running asyncio event loop on the thread and raises:

```
It looks like you are using Playwright Sync API inside the asyncio loop.
Please use the Async API instead.
```

This is a pre-existing bug unrelated to the consent gate feature.

## Root Cause

`nest_asyncio.apply()` is called by `run_async()` in `src/lib/utils/async_utils.py`. This globally patches the asyncio event loop policy, making running loops visible even on `ThreadPoolExecutor` threads. When Playwright's `sync_playwright().start()` internally calls `asyncio._get_running_loop()`, it detects the patched loop and refuses to run.

## Execution Flow

```
achat_stream()
  └─ loop.run_in_executor(None, _produce)        # default ThreadPoolExecutor thread
       └─ chat_stream() → provider tool loop
            └─ execute_tool("browser_navigate")
                 └─ BrowserTool._navigate()
                      └─ run_on_thread(_inner)     # BrowserTool's dedicated thread
                           └─ _ensure_browser()
                                └─ sync_playwright().start()  ← BOOM
```

## Proposed Fix

Clear any inherited running loop on the BrowserTool's dedicated thread before Playwright initialization:

```python
# In _ensure_browser(), before sync_playwright().start():
asyncio._set_running_loop(None)
self._playwright = sync_playwright().start()
```

This is safe because the BrowserTool's executor thread is a pure sync thread — it should never have a running asyncio loop.

## File to Change

| File | Change |
|------|--------|
| `src/lib/mcp/tools/browser_tool.py:290` | Add `asyncio._set_running_loop(None)` before `sync_playwright().start()` |

## Alternative Approaches Considered

1. **Migrate to Playwright Async API** — Replace `sync_playwright` with `async_playwright` throughout `BrowserTool`. Would require making all browser methods async and reworking the threading model. Too invasive for a targeted fix; better suited for a separate refactor.

2. **Remove `nest_asyncio` usage** — Would break `run_async()` which other tools (shell, file) depend on for calling async database/scheduler code from sync tool implementations.

3. **Isolate Playwright in a subprocess** — Overkill; adds IPC complexity for a single-threaded fix.

## Testing

- Start bot via Telegram
- Send a message that triggers `browser_navigate` (e.g., "open youtube.com")
- Verify browser launches without the asyncio error
- Verify subsequent browser operations (get text, click, screenshot) still work
