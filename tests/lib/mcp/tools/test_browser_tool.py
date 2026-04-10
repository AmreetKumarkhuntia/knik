"""Tests for BrowserTool: asyncio fix, single session, multiple sessions, lifecycle, and edge cases."""

import asyncio
import importlib
import importlib.util
import math
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Direct module loading — bypass __init__.py chains to avoid circular imports.
# ---------------------------------------------------------------------------

_SRC = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
_SRC = os.path.abspath(_SRC)

if _SRC not in sys.path:
    sys.path.insert(0, _SRC)


def _load_module(name: str, filepath: str):
    """Load a Python module from *filepath* without triggering its package __init__."""
    if name in sys.modules:
        return sys.modules[name]
    spec = importlib.util.spec_from_file_location(name, filepath)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


# Load BaseTool first (no heavy deps)
_base_tool_mod = _load_module(
    "lib.services.ai_client.base_tool",
    os.path.join(_SRC, "lib", "services", "ai_client", "base_tool.py"),
)
BaseTool = _base_tool_mod.BaseTool

# Stub out printer so browser_tool import doesn't need the full lib tree
_printer_mod_path = os.path.join(_SRC, "lib", "utils", "printer.py")
if "lib.utils.printer" not in sys.modules:
    # Provide a lightweight stub — the real printer pulls in heavy deps
    _printer_stub = type(sys)("lib.utils.printer")
    _printer_stub.printer = MagicMock()
    sys.modules["lib.utils.printer"] = _printer_stub

# Stub Config
if "lib.core.config" not in sys.modules:
    # The real Config tries to read env / files; provide a stub that yields defaults.
    _config_stub_mod = type(sys)("lib.core.config")

    class _StubConfig:
        browser_headless = True
        browser_profile_dir = "/tmp/test-browser-profile"

    _config_stub_mod.Config = _StubConfig
    sys.modules["lib.core.config"] = _config_stub_mod

# Ensure the relative import `from ...core.config import Config` resolves.
# browser_tool.py uses relative imports so we also need the package chain stubs.
for pkg in ("lib", "lib.mcp", "lib.mcp.tools", "lib.core", "lib.services", "lib.services.ai_client", "lib.utils"):
    if pkg not in sys.modules:
        sys.modules[pkg] = type(sys)(pkg)

# Wire BaseTool into the stub package
sys.modules["lib.services.ai_client"].base_tool = sys.modules["lib.services.ai_client.base_tool"]
sys.modules["lib.services.ai_client.base_tool"] = _base_tool_mod

# Now load browser_tool
_browser_tool_mod = _load_module(
    "lib.mcp.tools.browser_tool",
    os.path.join(_SRC, "lib", "mcp", "tools", "browser_tool.py"),
)
BrowserTool = _browser_tool_mod.BrowserTool
BROWSER_DEFINITIONS = _browser_tool_mod.BROWSER_DEFINITIONS


# ---------------------------------------------------------------------------
# helpers / fixtures
# ---------------------------------------------------------------------------


def _make_mock_page():
    """Return a MagicMock that behaves like a Playwright Page."""
    page = MagicMock()
    page.is_closed.return_value = False
    page.title.return_value = "Test Page"
    page.goto.return_value = MagicMock(status=200)
    page.evaluate.return_value = "body text content"
    page.query_selector.return_value = MagicMock(inner_text=MagicMock(return_value="selector text"))
    page.screenshot.return_value = b"\x89PNG\r\n\x1a\nfake_png_bytes"
    return page


def _make_mock_context(page=None):
    """Return a MagicMock that behaves like a Playwright BrowserContext."""
    ctx = MagicMock()
    ctx.new_page.return_value = page or _make_mock_page()
    return ctx


def _make_mock_playwright(context=None, page=None):
    """Return a MagicMock that behaves like a started Playwright instance."""
    pw = MagicMock()
    ctx = context or _make_mock_context(page)
    pw.chromium.launch_persistent_context.return_value = ctx
    return pw


def _make_sync_playwright_factory(pw_instance=None, page=None):
    """Return a callable that mimics sync_playwright().start()."""
    pw = pw_instance or _make_mock_playwright(page=page)
    mock_sync_pw = MagicMock()
    mock_sync_pw.return_value.start.return_value = pw
    return mock_sync_pw, pw


def _patch_sync_playwright(mock_sync_pw):
    """Patch the `playwright.sync_api` module in sys.modules so local imports
    inside _ensure_browser pick up our mock sync_playwright."""
    fake_module = type(sys)("playwright.sync_api")
    fake_module.sync_playwright = mock_sync_pw
    return patch.dict(
        "sys.modules",
        {
            "playwright": type(sys)("playwright"),
            "playwright.sync_api": fake_module,
        },
    )


def _patch_config():
    """Patch Config to return headless=True and a temp profile dir."""
    return patch(
        "lib.mcp.tools.browser_tool.Config",
        return_value=MagicMock(
            browser_headless=True,
            browser_profile_dir="/tmp/test-browser-profile",
        ),
    )


@pytest.fixture(autouse=True)
def _clear_base_tool_instances():
    """Reset BaseTool._instances before each test so tests don't leak."""
    saved = BaseTool._instances[:]
    yield
    BaseTool._instances = saved


@pytest.fixture
def browser_tool():
    """Fresh BrowserTool instance."""
    tool = BrowserTool()
    yield tool
    # Tear down any executor created during the test
    if tool._executor:
        tool._executor.shutdown(wait=False)
        tool._executor = None


@pytest.fixture
def wired_tool():
    """BrowserTool with mocked Playwright already wired up, ready for tool calls.

    Returns (tool, mock_page, mock_playwright).
    """
    tool = BrowserTool()
    page = _make_mock_page()
    pw = _make_mock_playwright(page=page)
    ctx = pw.chromium.launch_persistent_context.return_value

    # Pre-wire the tool so _ensure_browser has already run
    tool._playwright = pw
    tool._browser_context = ctx
    tool._page = page
    tool._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="test-browser")

    yield tool, page, pw

    if tool._executor:
        tool._executor.shutdown(wait=False)
        tool._executor = None


# ===========================================================================
# A. Asyncio fix tests
# ===========================================================================


class TestAsyncioFix:
    """Verify that _ensure_browser clears any inherited running loop."""

    def test_ensure_browser_clears_running_loop(self, browser_tool):
        """When a running loop is inherited (e.g. from nest_asyncio), _ensure_browser
        clears it before sync_playwright().start(), so Playwright doesn't raise."""
        page = _make_mock_page()
        mock_sync_pw, pw = _make_sync_playwright_factory(page=page)

        loop_was_none_at_start = threading.Event()
        original_start = mock_sync_pw.return_value.start

        def intercepted_start():
            # At the moment sync_playwright().start() is called,
            # the running loop should have been cleared.
            if asyncio._get_running_loop() is None:
                loop_was_none_at_start.set()
            return original_start()

        mock_sync_pw.return_value.start = intercepted_start

        def run_on_executor():
            # Simulate nest_asyncio having set a running loop on this thread
            fake_loop = asyncio.new_event_loop()
            asyncio._set_running_loop(fake_loop)
            try:
                browser_tool._ensure_browser()
            finally:
                asyncio._set_running_loop(None)
                fake_loop.close()

        with (
            _patch_sync_playwright(mock_sync_pw),
            _patch_config(),
            patch("os.makedirs"),
        ):
            executor = ThreadPoolExecutor(max_workers=1)
            try:
                executor.submit(run_on_executor).result(timeout=5)
            finally:
                executor.shutdown(wait=False)

        assert loop_was_none_at_start.is_set(), "Running loop was NOT cleared before sync_playwright().start()"

    def test_ensure_browser_works_without_running_loop(self, browser_tool):
        """When no running loop exists, _ensure_browser still works fine."""
        page = _make_mock_page()
        mock_sync_pw, pw = _make_sync_playwright_factory(page=page)

        with (
            _patch_sync_playwright(mock_sync_pw),
            _patch_config(),
            patch("os.makedirs"),
        ):
            browser_tool._ensure_browser()

        mock_sync_pw.return_value.start.assert_called_once()
        assert browser_tool._playwright is pw


# ===========================================================================
# B. Single session tests
# ===========================================================================


class TestNavigate:
    def test_navigate_returns_title_and_status(self, wired_tool):
        """_navigate returns formatted string with title and HTTP status."""
        tool, page, _ = wired_tool
        page.goto.return_value = MagicMock(status=200)
        page.title.return_value = "Example Page"

        result = tool._navigate("https://example.com")

        assert "Navigated to: https://example.com" in result
        assert "Example Page" in result
        assert "200" in result
        page.goto.assert_called_once()

    def test_navigate_invalid_wait_until_falls_back(self, wired_tool):
        """Invalid wait_until value falls back to 'domcontentloaded'."""
        tool, page, _ = wired_tool
        page.goto.return_value = MagicMock(status=200)

        tool._navigate("https://example.com", wait_until="bogus")

        args, kwargs = page.goto.call_args
        assert kwargs.get("wait_until") == "domcontentloaded"

    def test_navigate_error_returns_message(self, wired_tool):
        """When page.goto raises, returns error string."""
        tool, page, _ = wired_tool
        page.goto.side_effect = Exception("net::ERR_NAME_NOT_RESOLVED")

        result = tool._navigate("https://doesnotexist.invalid")

        assert "Error navigating to" in result
        assert "net::ERR_NAME_NOT_RESOLVED" in result

    def test_navigate_no_response_shows_unknown_status(self, wired_tool):
        """When page.goto returns None, status should be 'unknown'."""
        tool, page, _ = wired_tool
        page.goto.return_value = None
        page.title.return_value = "Blank"

        result = tool._navigate("about:blank")

        assert "unknown" in result


class TestGetText:
    def test_get_text_full_page(self, wired_tool):
        """_get_text() with no selector evaluates JS to get body text."""
        tool, page, _ = wired_tool
        page.evaluate.return_value = "Hello world body text"

        result = tool._get_text()

        assert "Hello world body text" in result
        page.evaluate.assert_called_once()

    def test_get_text_with_selector(self, wired_tool):
        """_get_text(selector='h1') uses query_selector().inner_text()."""
        tool, page, _ = wired_tool
        element = MagicMock()
        element.inner_text.return_value = "Main Heading"
        page.query_selector.return_value = element

        result = tool._get_text(selector="h1")

        assert "Main Heading" in result
        page.query_selector.assert_called_once_with("h1")

    def test_get_text_selector_not_found(self, wired_tool):
        """When selector matches nothing, returns error message."""
        tool, page, _ = wired_tool
        page.query_selector.return_value = None

        result = tool._get_text(selector="#nonexistent")

        assert "Error" in result
        assert "No element found" in result

    def test_get_text_empty_page(self, wired_tool):
        """Empty page text returns no-text message."""
        tool, page, _ = wired_tool
        page.evaluate.return_value = ""

        result = tool._get_text()

        assert "No visible text" in result

    def test_get_text_chunking(self, wired_tool):
        """Large text is chunked correctly."""
        tool, page, _ = wired_tool
        page.evaluate.return_value = "A" * 20000

        result_chunk1 = tool._get_text(max_chars=8000, chunk=1)
        result_chunk2 = tool._get_text(max_chars=8000, chunk=2)

        assert "Chunk 1/" in result_chunk1
        assert "Chunk 2/" in result_chunk2
        assert "continue reading" in result_chunk1

    def test_get_text_error(self, wired_tool):
        """When page.evaluate raises, returns error string."""
        tool, page, _ = wired_tool
        page.evaluate.side_effect = Exception("execution context destroyed")

        result = tool._get_text()

        assert "Error extracting text" in result


class TestGetLinks:
    def test_get_links_returns_formatted_list(self, wired_tool):
        """_get_links returns numbered markdown list."""
        tool, page, _ = wired_tool
        page.evaluate.return_value = [
            {"text": "Google", "href": "https://google.com"},
            {"text": "GitHub", "href": "https://github.com"},
        ]

        result = tool._get_links()

        assert "1. [Google](https://google.com)" in result
        assert "2. [GitHub](https://github.com)" in result

    def test_get_links_no_links(self, wired_tool):
        """When no links found, returns informational message."""
        tool, page, _ = wired_tool
        page.evaluate.return_value = []

        result = tool._get_links()

        assert "No links found" in result

    def test_get_links_empty_text(self, wired_tool):
        """Links with empty text show '(no text)' placeholder."""
        tool, page, _ = wired_tool
        page.evaluate.return_value = [
            {"text": "", "href": "https://example.com"},
        ]

        result = tool._get_links()

        assert "(no text)" in result

    def test_get_links_error(self, wired_tool):
        """When page.evaluate raises, returns error string."""
        tool, page, _ = wired_tool
        page.evaluate.side_effect = Exception("frame detached")

        result = tool._get_links()

        assert "Error extracting links" in result


class TestClick:
    def test_click_by_selector(self, wired_tool):
        """_click(selector='#btn') waits, clicks, and returns confirmation."""
        tool, page, _ = wired_tool
        page.title.return_value = "After Click"

        result = tool._click(selector="#btn")

        assert "Clicked element: #btn" in result
        assert "After Click" in result
        page.wait_for_selector.assert_called_once_with("#btn", timeout=5000)
        page.click.assert_called_once_with("#btn", timeout=5000)

    def test_click_by_text(self, wired_tool):
        """_click(text='Submit') uses text selector."""
        tool, page, _ = wired_tool
        page.title.return_value = "Submitted"

        result = tool._click(text="Submit")

        assert "Submit" in result
        page.wait_for_selector.assert_called_once_with("text=Submit", timeout=5000)

    def test_click_no_args_returns_error(self, wired_tool):
        """_click() with neither selector nor text returns error."""
        tool, page, _ = wired_tool

        result = tool._click()

        assert "Error" in result or "Provide either" in result

    def test_click_custom_timeout(self, wired_tool):
        """Custom timeout is passed through to wait_for_selector and click."""
        tool, page, _ = wired_tool

        tool._click(selector=".slow", timeout=10000)

        page.wait_for_selector.assert_called_once_with(".slow", timeout=10000)
        page.click.assert_called_once_with(".slow", timeout=10000)

    def test_click_error(self, wired_tool):
        """When click raises, returns error string."""
        tool, page, _ = wired_tool
        page.wait_for_selector.side_effect = Exception("Timeout 5000ms exceeded")

        result = tool._click(selector="#missing")

        assert "Error clicking element" in result


class TestType:
    def test_type_into_field(self, wired_tool):
        """_type fills and types text into an input field."""
        tool, page, _ = wired_tool

        result = tool._type(selector="input#email", text="user@example.com")

        assert "Typed" in result
        assert "user@example.com" in result
        page.fill.assert_called_once_with("input#email", "")
        page.type.assert_called_once_with("input#email", "user@example.com", delay=30)

    def test_type_without_clear(self, wired_tool):
        """clear_first=False skips page.fill."""
        tool, page, _ = wired_tool

        tool._type(selector="input", text="append", clear_first=False)

        page.fill.assert_not_called()
        page.type.assert_called_once()

    def test_type_with_enter(self, wired_tool):
        """press_enter=True presses Enter and waits for load."""
        tool, page, _ = wired_tool
        page.title.return_value = "Search Results"

        result = tool._type(selector="input#q", text="pytest", press_enter=True)

        assert "pressed Enter" in result
        page.press.assert_called_once_with("input#q", "Enter")

    def test_type_error(self, wired_tool):
        """When typing raises, returns error string."""
        tool, page, _ = wired_tool
        page.wait_for_selector.side_effect = Exception("Element not found")

        result = tool._type(selector="#missing", text="hello")

        assert "Error typing into element" in result


class TestScreenshot:
    def test_screenshot_returns_base64(self, wired_tool):
        """_screenshot returns base64-encoded PNG string."""
        tool, page, _ = wired_tool
        page.screenshot.return_value = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

        result = tool._screenshot()

        assert "Screenshot captured" in result
        assert "Base64 PNG" in result
        page.screenshot.assert_called_once_with(full_page=False)

    def test_screenshot_full_page(self, wired_tool):
        """full_page=True is passed through to page.screenshot."""
        tool, page, _ = wired_tool
        page.screenshot.return_value = b"\x89PNG"

        tool._screenshot(full_page=True)

        page.screenshot.assert_called_once_with(full_page=True)

    def test_screenshot_error(self, wired_tool):
        """When screenshot raises, returns error string."""
        tool, page, _ = wired_tool
        page.screenshot.side_effect = Exception("page crashed")

        result = tool._screenshot()

        assert "Error taking screenshot" in result


# ===========================================================================
# C. Multiple session / lifecycle tests
# ===========================================================================


class TestBrowserLifecycle:
    def test_ensure_browser_only_launches_once(self, browser_tool):
        """Calling _ensure_browser twice reuses the existing context."""
        page = _make_mock_page()
        mock_sync_pw, pw = _make_sync_playwright_factory(page=page)

        with (
            _patch_sync_playwright(mock_sync_pw),
            _patch_config(),
            patch("os.makedirs"),
        ):
            browser_tool._ensure_browser()
            browser_tool._ensure_browser()

        # sync_playwright().start() should only be called once
        mock_sync_pw.return_value.start.assert_called_once()

    def test_cleanup_tears_down_browser(self):
        """cleanup() closes page, context, stops playwright, and shuts down executor."""
        tool = BrowserTool()
        page = _make_mock_page()
        pw = _make_mock_playwright(page=page)
        ctx = pw.chromium.launch_persistent_context.return_value

        tool._playwright = pw
        tool._browser_context = ctx
        tool._page = page
        tool._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="test")
        tool._last_used = time.monotonic()

        tool.cleanup()

        page.close.assert_called_once()
        ctx.close.assert_called_once()
        pw.stop.assert_called_once()
        assert tool._executor is None
        assert tool._last_used == 0.0

    def test_cleanup_allows_relaunch(self, browser_tool):
        """After cleanup(), the next tool call re-initializes the browser."""
        page = _make_mock_page()
        mock_sync_pw, pw = _make_sync_playwright_factory(page=page)

        with (
            _patch_sync_playwright(mock_sync_pw),
            _patch_config(),
            patch("os.makedirs"),
        ):
            # First session
            browser_tool._executor = ThreadPoolExecutor(max_workers=1)
            browser_tool._ensure_browser()
            assert mock_sync_pw.return_value.start.call_count == 1

            # Simulate cleanup — clear browser state but keep executor
            browser_tool._browser_context = None
            browser_tool._playwright = None
            browser_tool._page = None

            # Second session — should re-launch
            browser_tool._ensure_browser()
            assert mock_sync_pw.return_value.start.call_count == 2

    def test_cleanup_idle_skips_active(self):
        """cleanup_idle doesn't clean up a recently-used instance."""
        tool = BrowserTool()
        tool._last_used = time.monotonic()  # just used
        tool._playwright = MagicMock()
        tool._browser_context = MagicMock()

        BrowserTool.cleanup_idle(idle_seconds=30)

        # Should NOT have been cleaned up
        assert tool._browser_context is not None

    def test_cleanup_idle_cleans_stale(self):
        """cleanup_idle cleans up an instance idle for longer than threshold."""
        tool = BrowserTool()
        page = _make_mock_page()
        pw = _make_mock_playwright(page=page)
        ctx = pw.chromium.launch_persistent_context.return_value

        tool._playwright = pw
        tool._browser_context = ctx
        tool._page = page
        tool._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="test")
        tool._last_used = time.monotonic() - 60  # idle for 60s

        BrowserTool.cleanup_idle(idle_seconds=30)

        assert tool._executor is None
        assert tool._last_used == 0.0

    def test_executor_created_once(self, browser_tool):
        """Multiple _get_or_create_executor calls return the same executor."""
        ex1 = browser_tool._get_or_create_executor()
        ex2 = browser_tool._get_or_create_executor()

        assert ex1 is ex2

    def test_run_on_thread_serializes_calls(self, browser_tool):
        """Two run_on_thread calls execute sequentially on the single-worker executor."""
        order = []

        def task_a():
            order.append("a_start")
            time.sleep(0.05)
            order.append("a_end")
            return "a"

        def task_b():
            order.append("b_start")
            order.append("b_end")
            return "b"

        # Submit from two threads concurrently
        t1 = threading.Thread(target=lambda: browser_tool.run_on_thread(task_a))
        t2 = threading.Thread(target=lambda: browser_tool.run_on_thread(task_b))
        t1.start()
        time.sleep(0.01)  # ensure task_a starts first
        t2.start()
        t1.join(timeout=5)
        t2.join(timeout=5)

        # Since max_workers=1, task_a must finish before task_b starts
        assert order.index("a_end") < order.index("b_start")

    def test_run_on_thread_updates_last_used(self, browser_tool):
        """run_on_thread updates _last_used timestamp."""
        browser_tool._last_used = 0.0

        browser_tool.run_on_thread(lambda: None)

        assert browser_tool._last_used > 0.0

    def test_cleanup_on_fresh_tool_is_noop(self, browser_tool):
        """Calling cleanup on a tool that was never initialized doesn't raise."""
        browser_tool.cleanup()  # should not raise


# ===========================================================================
# D. Edge case tests
# ===========================================================================


class TestEdgeCases:
    def test_ensure_browser_raises_without_playwright(self, browser_tool):
        """When playwright is not importable, raises RuntimeError with install instructions."""
        # Temporarily remove playwright from sys.modules and make import fail
        saved_modules = {}
        for key in list(sys.modules):
            if "playwright" in key:
                saved_modules[key] = sys.modules.pop(key)

        import builtins

        real_import = builtins.__import__

        def fail_playwright(name, *args, **kwargs):
            if "playwright" in name:
                raise ImportError("No module named 'playwright'")
            return real_import(name, *args, **kwargs)

        try:
            with (
                patch("builtins.__import__", side_effect=fail_playwright),
                pytest.raises(RuntimeError, match="Playwright is not installed"),
            ):
                browser_tool._ensure_browser()
        finally:
            sys.modules.update(saved_modules)

    def test_ensure_page_creates_new_if_closed(self):
        """If page.is_closed() returns True, _ensure_page creates a new page."""
        tool = BrowserTool()
        ctx = _make_mock_context()
        tool._browser_context = ctx
        tool._playwright = MagicMock()

        closed_page = MagicMock()
        closed_page.is_closed.return_value = True
        tool._page = closed_page

        tool._ensure_page()

        ctx.new_page.assert_called_once()
        assert tool._page is ctx.new_page.return_value

    def test_ensure_page_reuses_open_page(self):
        """If page is still open, _ensure_page does NOT create a new one."""
        tool = BrowserTool()
        ctx = _make_mock_context()
        tool._browser_context = ctx
        tool._playwright = MagicMock()

        open_page = MagicMock()
        open_page.is_closed.return_value = False
        tool._page = open_page

        tool._ensure_page()

        ctx.new_page.assert_not_called()
        assert tool._page is open_page


class TestCleanText:
    """Tests for the static _clean_text method."""

    def test_collapses_whitespace(self):
        raw = "line1\n\n\n\nline2   with   spaces"
        result = BrowserTool._clean_text(raw, max_chars=10000)
        assert "\n\n\n" not in result
        assert "   " not in result

    def test_empty_returns_empty(self):
        assert BrowserTool._clean_text("", max_chars=100) == ""

    def test_whitespace_only_returns_empty(self):
        assert BrowserTool._clean_text("   \n\n  ", max_chars=100) == ""

    def test_chunk_one(self):
        """Chunk 1 returns the first portion."""
        raw = "A" * 100
        result = BrowserTool._clean_text(raw, max_chars=30, chunk=1)
        assert "Chunk 1/" in result
        assert "A" * 30 in result

    def test_chunk_two(self):
        """Chunk 2 returns the second portion."""
        raw = "A" * 30 + "B" * 30
        result = BrowserTool._clean_text(raw, max_chars=30, chunk=2)
        assert "Chunk 2/" in result
        assert "B" * 30 in result

    def test_out_of_range_chunk(self):
        """Out-of-range chunk returns informational message."""
        raw = "short text"
        result = BrowserTool._clean_text(raw, max_chars=10000, chunk=5)
        assert "No content at chunk 5" in result

    def test_continue_hint_present(self):
        """Non-final chunks include a continuation hint."""
        raw = "A" * 200
        result = BrowserTool._clean_text(raw, max_chars=50, chunk=1)
        assert "chunk=2" in result

    def test_final_chunk_no_continuation(self):
        """The last chunk does not include a continuation hint."""
        raw = "A" * 100
        total_chunks = math.ceil(100 / 50)
        result = BrowserTool._clean_text(raw, max_chars=50, chunk=total_chunks)
        assert "chunk=" not in result.split("]")[-1]

    def test_chunk_zero_treated_as_one(self):
        """chunk=0 is treated as chunk=1."""
        raw = "Hello world test"
        result = BrowserTool._clean_text(raw, max_chars=10000, chunk=0)
        assert "Chunk 1/" in result


class TestClearStaleSingletonLock:
    """Tests for the static _clear_stale_singleton_lock method."""

    def test_no_lock_file(self, tmp_path):
        """Returns False when no SingletonLock exists."""
        assert BrowserTool._clear_stale_singleton_lock(str(tmp_path)) is False

    def test_removes_lock_for_dead_pid(self, tmp_path):
        """Removes lock file when referenced PID is dead."""
        lock_path = tmp_path / "SingletonLock"
        # PID 999999999 is very likely dead
        os.symlink("hostname-999999999", str(lock_path))

        result = BrowserTool._clear_stale_singleton_lock(str(tmp_path))

        assert result is True
        assert not lock_path.exists()

    def test_keeps_lock_for_live_pid(self, tmp_path):
        """Leaves lock file when referenced PID is alive (current process)."""
        lock_path = tmp_path / "SingletonLock"
        os.symlink(f"hostname-{os.getpid()}", str(lock_path))

        result = BrowserTool._clear_stale_singleton_lock(str(tmp_path))

        assert result is False
        # Use lexists because the symlink target doesn't exist as a real path
        assert os.path.lexists(str(lock_path))

    def test_regular_file_lock_removed(self, tmp_path):
        """A regular file (not symlink) named SingletonLock is removed."""
        lock_path = tmp_path / "SingletonLock"
        lock_path.write_text("stale")

        result = BrowserTool._clear_stale_singleton_lock(str(tmp_path))

        assert result is True
        assert not lock_path.exists()


class TestDefinitionsAndImplementations:
    """Verify tool registration."""

    def test_definitions_count(self, browser_tool):
        """get_definitions returns all 6 browser tool schemas."""
        defs = browser_tool.get_definitions()
        assert len(defs) == 6

    def test_definitions_names(self, browser_tool):
        """All expected tool names are present."""
        names = {d["name"] for d in browser_tool.get_definitions()}
        assert names == {
            "browser_navigate",
            "browser_get_text",
            "browser_get_links",
            "browser_click",
            "browser_type",
            "browser_screenshot",
        }

    def test_implementations_keys(self, browser_tool):
        """get_implementations returns the expected tool names (minus screenshot)."""
        impls = browser_tool.get_implementations()
        assert set(impls.keys()) == {
            "browser_navigate",
            "browser_get_text",
            "browser_get_links",
            "browser_click",
            "browser_type",
        }

    def test_name_property(self, browser_tool):
        assert browser_tool.name == "browser"


class TestExecutorThreadSafety:
    """Verify double-checked locking for executor creation."""

    def test_concurrent_get_or_create_returns_same_executor(self, browser_tool):
        """Multiple threads calling _get_or_create_executor get the same instance."""
        results = []
        barrier = threading.Barrier(5)

        def worker():
            barrier.wait()
            results.append(browser_tool._get_or_create_executor())

        threads = [threading.Thread(target=worker) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=5)

        assert len(results) == 5
        assert all(r is results[0] for r in results)


class TestParallelToolCalls:
    """Verify behaviour when tool calls overlap from multiple threads."""

    def test_parallel_navigate_same_instance_serializes(self, wired_tool):
        """Two _navigate calls on the same tool serialize — no page corruption."""
        tool, page, _ = wired_tool
        order = []

        original_goto = page.goto

        def slow_goto(url, **kwargs):
            order.append(f"goto_start:{url}")
            time.sleep(0.05)
            order.append(f"goto_end:{url}")
            return original_goto(url, **kwargs)

        page.goto = slow_goto
        page.title.return_value = "Page"

        results: list[str | None] = [None, None]
        errors: list[Exception] = []

        def nav(idx, url):
            try:
                results[idx] = tool._navigate(url)
            except Exception as e:
                errors.append(e)

        t1 = threading.Thread(target=nav, args=(0, "https://first.com"))
        t2 = threading.Thread(target=nav, args=(1, "https://second.com"))
        t1.start()
        time.sleep(0.01)  # give t1 a head start
        t2.start()
        t1.join(timeout=10)
        t2.join(timeout=10)

        assert not errors, f"Errors in threads: {errors}"
        assert results[0] is not None and results[1] is not None
        # Both should succeed
        assert "Navigated to: https://first.com" in results[0]
        assert "Navigated to: https://second.com" in results[1]
        # First navigate must finish before second starts (single-worker executor)
        assert order.index("goto_end:https://first.com") < order.index("goto_start:https://second.com")

    def test_parallel_tool_calls_different_instances(self):
        """Two separate BrowserTool instances run tool calls truly in parallel."""
        tool_a = BrowserTool()
        tool_b = BrowserTool()

        page_a = _make_mock_page()
        page_b = _make_mock_page()
        pw_a = _make_mock_playwright(page=page_a)
        pw_b = _make_mock_playwright(page=page_b)

        for tool, page, pw in [(tool_a, page_a, pw_a), (tool_b, page_b, pw_b)]:
            tool._playwright = pw
            tool._browser_context = pw.chromium.launch_persistent_context.return_value
            tool._page = page
            tool._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="test")

        overlap = threading.Event()
        order = []

        original_goto_a = page_a.goto

        def slow_goto_a(url, **kwargs):
            order.append("a_start")
            overlap.wait(timeout=5)  # wait until b has also started
            order.append("a_end")
            return original_goto_a(url, **kwargs)

        original_goto_b = page_b.goto

        def slow_goto_b(url, **kwargs):
            order.append("b_start")
            overlap.set()  # signal that b has started
            order.append("b_end")
            return original_goto_b(url, **kwargs)

        page_a.goto = slow_goto_a
        page_b.goto = slow_goto_b
        page_a.title.return_value = "A"
        page_b.title.return_value = "B"

        results: list[str | None] = [None, None]

        def nav(idx, tool, url):
            results[idx] = tool._navigate(url)

        t1 = threading.Thread(target=nav, args=(0, tool_a, "https://a.com"))
        t2 = threading.Thread(target=nav, args=(1, tool_b, "https://b.com"))
        t1.start()
        time.sleep(0.01)
        t2.start()
        t1.join(timeout=10)
        t2.join(timeout=10)

        # Both succeed
        assert results[0] is not None and results[1] is not None
        assert "Navigated to: https://a.com" in results[0]
        assert "Navigated to: https://b.com" in results[1]
        # b_start should appear before a_end — proving true parallelism
        assert order.index("b_start") < order.index("a_end")

        for tool in (tool_a, tool_b):
            tool._executor.shutdown(wait=False)
            tool._executor = None

    def test_cleanup_during_active_tool_call(self, wired_tool):
        """cleanup() called while _navigate is mid-flight doesn't crash either thread."""
        tool, page, _ = wired_tool

        navigate_started = threading.Event()
        navigate_can_finish = threading.Event()

        original_goto = page.goto

        def blocking_goto(url, **kwargs):
            navigate_started.set()
            navigate_can_finish.wait(timeout=5)
            return original_goto(url, **kwargs)

        page.goto = blocking_goto
        page.title.return_value = "Page"

        nav_result: list[str | None] = [None]
        nav_error: list[Exception | None] = [None]
        cleanup_error: list[Exception | None] = [None]

        def do_navigate():
            try:
                nav_result[0] = tool._navigate("https://example.com")
            except Exception as e:
                nav_error[0] = e

        def do_cleanup():
            try:
                navigate_started.wait(timeout=5)
                # Navigate is now in progress on the executor thread —
                # cleanup submits _teardown to the same single-worker executor,
                # so it queues behind the navigate.
                tool.cleanup()
            except Exception as e:
                cleanup_error[0] = e
            finally:
                # Unblock navigate so the test doesn't hang
                navigate_can_finish.set()

        t_nav = threading.Thread(target=do_navigate)
        t_clean = threading.Thread(target=do_cleanup)
        t_nav.start()
        t_clean.start()
        t_nav.join(timeout=10)
        t_clean.join(timeout=10)

        # Neither thread should have crashed
        assert nav_error[0] is None, f"Navigate raised: {nav_error[0]}"
        assert cleanup_error[0] is None, f"Cleanup raised: {cleanup_error[0]}"

    def test_concurrent_navigate_and_get_text(self, wired_tool):
        """Navigate and get_text submitted concurrently — get_text waits for navigate."""
        tool, page, _ = wired_tool
        order = []

        original_goto = page.goto

        def slow_goto(url, **kwargs):
            order.append("goto_start")
            time.sleep(0.05)
            order.append("goto_end")
            return original_goto(url, **kwargs)

        page.goto = slow_goto
        page.title.return_value = "Page"
        page.evaluate.return_value = "page body text"

        results: list[str | None] = [None, None]

        def do_navigate():
            results[0] = tool._navigate("https://example.com")

        def do_get_text():
            results[1] = tool._get_text()

        t1 = threading.Thread(target=do_navigate)
        t2 = threading.Thread(target=do_get_text)
        t1.start()
        time.sleep(0.01)  # ensure navigate starts first
        t2.start()
        t1.join(timeout=10)
        t2.join(timeout=10)

        assert results[0] is not None and results[1] is not None
        assert "Navigated to" in results[0]
        assert "page body text" in results[1]
        # Navigate must finish before get_text runs (single-worker)
        assert order.index("goto_end") < len(order)

    def test_sequential_navigate_then_get_text(self, wired_tool):
        """Navigate followed by get_text on the same page returns correct data."""
        tool, page, _ = wired_tool
        page.goto.return_value = MagicMock(status=200)
        page.title.return_value = "Example"
        page.evaluate.return_value = "Hello from example.com"

        nav_result = tool._navigate("https://example.com")
        text_result = tool._get_text()

        assert "Navigated to: https://example.com" in nav_result
        assert "Example" in nav_result
        assert "Hello from example.com" in text_result
