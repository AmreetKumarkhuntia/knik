"""Tests for BrowserTool, the adapter over the browser service: result formatting, errors, registration, delegation."""

import math
import threading
import time
import weakref
from unittest.mock import MagicMock

import pytest

from lib.services.browser import session as session_mod
from lib.tools import registry as registry_mod
from lib.tools.browser_tool import BROWSER_DEFINITIONS, BrowserTool
from lib.tools.registry import ToolRegistry, cleanup_all_tools


def _make_mock_page():
    page = MagicMock()
    page.is_closed.return_value = False
    page.title.return_value = "Test Page"
    page.goto.return_value = MagicMock(status=200)
    page.evaluate.return_value = "body text content"
    page.query_selector.return_value = MagicMock(inner_text=MagicMock(return_value="selector text"))
    page.screenshot.return_value = b"\x89PNG\r\n\x1a\nfake_png_bytes"
    return page


def _wire(tool: BrowserTool, page=None):
    """Make the tool's session look launched, with mock Playwright objects, so no real browser starts."""
    page = page or _make_mock_page()
    pw = MagicMock()
    ctx = pw.chromium.launch_persistent_context.return_value
    ctx.new_page.return_value = page
    tool._session._playwright = pw
    tool._session._context = ctx
    tool._session._page = page
    return page, ctx, pw


@pytest.fixture(autouse=True)
def _isolated_registries(monkeypatch):
    monkeypatch.setattr(registry_mod, "_live_registries", weakref.WeakSet())
    monkeypatch.setattr(session_mod, "_sessions", weakref.WeakSet())


@pytest.fixture
def browser_tool():
    tool = BrowserTool()
    yield tool
    tool.cleanup()


@pytest.fixture
def wired_tool():
    """BrowserTool whose session already has a mocked browser. Returns (tool, page, playwright)."""
    tool = BrowserTool()
    page, _ctx, pw = _wire(tool)
    yield tool, page, pw
    tool.cleanup()


# ===========================================================================
# A. Tool calls
# ===========================================================================


class TestNavigate:
    def test_navigate_returns_title_and_status(self, wired_tool):
        tool, page, _ = wired_tool
        page.goto.return_value = MagicMock(status=200)
        page.title.return_value = "Example Page"

        result = tool._navigate("https://example.com")

        assert result == "Navigated to: https://example.com\nPage title: Example Page\nHTTP status: 200"
        page.goto.assert_called_once()

    def test_navigate_invalid_wait_until_falls_back(self, wired_tool):
        tool, page, _ = wired_tool

        tool._navigate("https://example.com", wait_until="bogus")

        assert page.goto.call_args.kwargs.get("wait_until") == "domcontentloaded"

    def test_navigate_error_returns_message(self, wired_tool):
        tool, page, _ = wired_tool
        page.goto.side_effect = Exception("net::ERR_NAME_NOT_RESOLVED")

        result = tool._navigate("https://doesnotexist.invalid")

        assert result == "Error navigating to https://doesnotexist.invalid: net::ERR_NAME_NOT_RESOLVED"

    def test_navigate_no_response_shows_unknown_status(self, wired_tool):
        tool, page, _ = wired_tool
        page.goto.return_value = None
        page.title.return_value = "Blank"

        result = tool._navigate("about:blank")

        assert result.endswith("HTTP status: unknown")


class TestGetText:
    def test_get_text_full_page(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.return_value = "Hello world body text"

        result = tool._get_text()

        assert "Hello world body text" in result
        page.evaluate.assert_called_once()

    def test_get_text_with_selector(self, wired_tool):
        tool, page, _ = wired_tool
        element = MagicMock()
        element.inner_text.return_value = "Main Heading"
        page.query_selector.return_value = element

        result = tool._get_text(selector="h1")

        assert "Main Heading" in result
        page.query_selector.assert_called_once_with("h1")

    def test_get_text_selector_not_found(self, wired_tool):
        tool, page, _ = wired_tool
        page.query_selector.return_value = None

        result = tool._get_text(selector="#nonexistent")

        assert result == "Error: No element found matching selector '#nonexistent'"

    def test_get_text_empty_page(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.return_value = ""

        assert tool._get_text() == "(No visible text found on page)"

    def test_get_text_chunking(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.return_value = "A" * 20000

        result_chunk1 = tool._get_text(max_chars=8000, chunk=1)
        result_chunk2 = tool._get_text(max_chars=8000, chunk=2)

        assert "Chunk 1/" in result_chunk1
        assert "Chunk 2/" in result_chunk2
        assert "continue reading" in result_chunk1

    def test_get_text_error(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.side_effect = Exception("execution context destroyed")

        assert tool._get_text() == "Error extracting text: execution context destroyed"


class TestGetLinks:
    def test_get_links_returns_formatted_list(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.return_value = [
            {"text": "Google", "href": "https://google.com"},
            {"text": "GitHub", "href": "https://github.com"},
        ]

        result = tool._get_links()

        assert result == "1. [Google](https://google.com)\n2. [GitHub](https://github.com)"

    def test_get_links_no_links(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.return_value = []

        assert tool._get_links() == "No links found on the current page."

    def test_get_links_empty_text(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.return_value = [{"text": "", "href": "https://example.com"}]

        assert "(no text)" in tool._get_links()

    def test_get_links_passes_selector_and_limit(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.return_value = []

        tool._get_links(selector="main", max_links=3)

        script = page.evaluate.call_args.args[0]
        assert "document.querySelector('main')" in script
        assert "slice(0, 3)" in script

    def test_get_links_error(self, wired_tool):
        tool, page, _ = wired_tool
        page.evaluate.side_effect = Exception("frame detached")

        assert tool._get_links() == "Error extracting links: frame detached"


class TestClick:
    def test_click_by_selector(self, wired_tool):
        tool, page, _ = wired_tool
        page.title.return_value = "After Click"

        result = tool._click(selector="#btn")

        assert result == "Clicked element: #btn\nNew page title: After Click"
        page.wait_for_selector.assert_called_once_with("#btn", timeout=5000)
        page.click.assert_called_once_with("#btn", timeout=5000)

    def test_click_by_text(self, wired_tool):
        tool, page, _ = wired_tool
        page.title.return_value = "Submitted"

        result = tool._click(text="Submit")

        assert result == "Clicked element with text 'Submit'\nNew page title: Submitted"
        page.wait_for_selector.assert_called_once_with("text=Submit", timeout=5000)

    def test_click_no_args_returns_error(self, wired_tool):
        tool, page, _ = wired_tool

        result = tool._click()

        assert result == "Error: Provide either 'selector' or 'text' to identify what to click."
        page.click.assert_not_called()

    def test_click_no_args_does_not_launch_browser(self, browser_tool):
        browser_tool._click()

        assert browser_tool._session._executor is None
        assert browser_tool._session.last_used == 0.0

    def test_click_custom_timeout(self, wired_tool):
        tool, page, _ = wired_tool

        tool._click(selector=".slow", timeout=10000)

        page.wait_for_selector.assert_called_once_with(".slow", timeout=10000)
        page.click.assert_called_once_with(".slow", timeout=10000)

    def test_click_error(self, wired_tool):
        tool, page, _ = wired_tool
        page.wait_for_selector.side_effect = Exception("Timeout 5000ms exceeded")

        assert tool._click(selector="#missing") == "Error clicking element: Timeout 5000ms exceeded"


class TestType:
    def test_type_into_field(self, wired_tool):
        tool, page, _ = wired_tool

        result = tool._type(selector="input#email", text="user@example.com")

        assert result == "Typed 'user@example.com' into input#email"
        page.fill.assert_called_once_with("input#email", "")
        page.type.assert_called_once_with("input#email", "user@example.com", delay=30)

    def test_type_without_clear(self, wired_tool):
        tool, page, _ = wired_tool

        tool._type(selector="input", text="append", clear_first=False)

        page.fill.assert_not_called()
        page.type.assert_called_once()

    def test_type_with_enter(self, wired_tool):
        tool, page, _ = wired_tool
        page.title.return_value = "Search Results"

        result = tool._type(selector="input#q", text="pytest", press_enter=True)

        assert result == "Typed 'pytest' into input#q and pressed Enter\nNew page title: Search Results"
        page.press.assert_called_once_with("input#q", "Enter")

    def test_type_error(self, wired_tool):
        tool, page, _ = wired_tool
        page.wait_for_selector.side_effect = Exception("Element not found")

        assert tool._type(selector="#missing", text="hello") == "Error typing into element: Element not found"


class TestScreenshot:
    def test_screenshot_returns_base64(self, wired_tool):
        tool, page, _ = wired_tool
        page.screenshot.return_value = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

        result = tool._screenshot()

        assert result.startswith("Screenshot captured (0 KB).\nBase64 PNG:\n")
        page.screenshot.assert_called_once_with(full_page=False)

    def test_screenshot_full_page(self, wired_tool):
        tool, page, _ = wired_tool
        page.screenshot.return_value = b"\x89PNG"

        tool._screenshot(full_page=True)

        page.screenshot.assert_called_once_with(full_page=True)

    def test_screenshot_error(self, wired_tool):
        tool, page, _ = wired_tool
        page.screenshot.side_effect = Exception("page crashed")

        assert tool._screenshot() == "Error taking screenshot: page crashed"


# ===========================================================================
# B. Text chunking
# ===========================================================================


class TestCleanText:
    def test_collapses_whitespace(self):
        result = BrowserTool._clean_text("line1\n\n\n\nline2   with   spaces", max_chars=10000)
        assert "\n\n\n" not in result
        assert "   " not in result

    def test_empty_returns_empty(self):
        assert BrowserTool._clean_text("", max_chars=100) == ""

    def test_whitespace_only_returns_empty(self):
        assert BrowserTool._clean_text("   \n\n  ", max_chars=100) == ""

    def test_chunk_one(self):
        result = BrowserTool._clean_text("A" * 100, max_chars=30, chunk=1)
        assert "Chunk 1/" in result
        assert "A" * 30 in result

    def test_chunk_two(self):
        result = BrowserTool._clean_text("A" * 30 + "B" * 30, max_chars=30, chunk=2)
        assert "Chunk 2/" in result
        assert "B" * 30 in result

    def test_out_of_range_chunk(self):
        result = BrowserTool._clean_text("short text", max_chars=10000, chunk=5)
        assert "No content at chunk 5" in result

    def test_continue_hint_present(self):
        result = BrowserTool._clean_text("A" * 200, max_chars=50, chunk=1)
        assert "chunk=2" in result

    def test_final_chunk_no_continuation(self):
        total_chunks = math.ceil(100 / 50)
        result = BrowserTool._clean_text("A" * 100, max_chars=50, chunk=total_chunks)
        assert "chunk=" not in result.split("]")[-1]

    def test_chunk_zero_treated_as_one(self):
        result = BrowserTool._clean_text("Hello world test", max_chars=10000, chunk=0)
        assert "Chunk 1/" in result


# ===========================================================================
# C. Registration
# ===========================================================================


class TestDefinitionsAndImplementations:
    def test_definitions_count(self, browser_tool):
        assert len(browser_tool.get_definitions()) == 6

    def test_definitions_are_the_module_definitions(self, browser_tool):
        assert browser_tool.get_definitions() is BROWSER_DEFINITIONS

    def test_definitions_names(self, browser_tool):
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
        """Screenshot is defined but deliberately not bound."""
        assert set(browser_tool.get_implementations()) == {
            "browser_navigate",
            "browser_get_text",
            "browser_get_links",
            "browser_click",
            "browser_type",
        }

    def test_every_browser_tool_needs_consent(self, browser_tool):
        names = {d["name"] for d in browser_tool.get_definitions()}
        assert BrowserTool.consent_required_for == names

    def test_name_property(self, browser_tool):
        assert browser_tool.name == "browser"


# ===========================================================================
# D. Session ownership and cleanup delegation
# ===========================================================================


class TestSessionDelegation:
    def test_each_tool_owns_its_own_session(self):
        a, b = BrowserTool(), BrowserTool()

        assert a._session is not b._session

    def test_cleanup_tears_down_session(self):
        tool = BrowserTool()
        page, ctx, pw = _wire(tool)
        tool._navigate("https://example.com")

        tool.cleanup()

        page.close.assert_called_once()
        ctx.close.assert_called_once()
        pw.stop.assert_called_once()
        assert tool._session._executor is None
        assert tool._session.last_used == 0.0

    def test_cleanup_on_fresh_tool_is_noop(self, browser_tool):
        browser_tool.cleanup()

    def test_cleanup_all_tools_closes_browser_sessions_of_live_registries(self):
        tool = BrowserTool()
        registry = ToolRegistry()
        registry.add_tool_instance(tool)
        _page, ctx, _pw = _wire(tool)
        tool._navigate("https://example.com")

        cleanup_all_tools()

        ctx.close.assert_called_once()
        assert tool._session.last_used == 0.0

    def test_service_idle_cleanup_skips_an_active_tool_session(self, wired_tool):
        tool, _page, _pw = wired_tool
        tool._navigate("https://example.com")

        session_mod.cleanup_idle(idle_seconds=30)

        assert tool._session._context is not None
        assert tool._session.last_used > 0.0

    def test_service_idle_cleanup_closes_a_stale_tool_session(self, wired_tool):
        tool, _page, pw = wired_tool
        tool._navigate("https://example.com")
        tool._session._last_used = time.monotonic() - 60

        session_mod.cleanup_idle(idle_seconds=30)

        assert tool._session._executor is None
        assert tool._session.last_used == 0.0
        pw.stop.assert_called_once()


# ===========================================================================
# E. Concurrent tool calls
# ===========================================================================


class TestParallelToolCalls:
    def test_parallel_navigate_same_instance_serializes(self, wired_tool):
        """Two _navigate calls on the same tool run one after the other on its session thread."""
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
        time.sleep(0.01)
        t2.start()
        t1.join(timeout=10)
        t2.join(timeout=10)

        assert not errors, f"Errors in threads: {errors}"
        assert results[0] is not None and results[1] is not None
        assert "Navigated to: https://first.com" in results[0]
        assert "Navigated to: https://second.com" in results[1]
        assert order.index("goto_end:https://first.com") < order.index("goto_start:https://second.com")

    def test_parallel_tool_calls_different_instances(self):
        """Two BrowserTool instances run tool calls truly in parallel."""
        tool_a, tool_b = BrowserTool(), BrowserTool()
        page_a, page_b = _make_mock_page(), _make_mock_page()
        _wire(tool_a, page_a)
        _wire(tool_b, page_b)

        overlap = threading.Event()
        order = []
        original_goto_a = page_a.goto
        original_goto_b = page_b.goto

        def slow_goto_a(url, **kwargs):
            order.append("a_start")
            overlap.wait(timeout=5)
            order.append("a_end")
            return original_goto_a(url, **kwargs)

        def slow_goto_b(url, **kwargs):
            order.append("b_start")
            overlap.set()
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
        try:
            t1.start()
            time.sleep(0.01)
            t2.start()
            t1.join(timeout=10)
            t2.join(timeout=10)
        finally:
            tool_a.cleanup()
            tool_b.cleanup()

        assert results[0] is not None and results[1] is not None
        assert "Navigated to: https://a.com" in results[0]
        assert "Navigated to: https://b.com" in results[1]
        assert order.index("b_start") < order.index("a_end")

    def test_cleanup_during_active_tool_call(self, wired_tool):
        """cleanup() while _navigate is mid-flight queues behind it and crashes neither thread."""
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
                # Release the navigation only after cleanup has queued its teardown behind it.
                threading.Timer(0.05, navigate_can_finish.set).start()
                tool.cleanup()
            except Exception as e:
                cleanup_error[0] = e
            finally:
                navigate_can_finish.set()

        t_nav = threading.Thread(target=do_navigate)
        t_clean = threading.Thread(target=do_cleanup)
        t_nav.start()
        t_clean.start()
        t_nav.join(timeout=15)
        t_clean.join(timeout=15)

        assert nav_error[0] is None, f"Navigate raised: {nav_error[0]}"
        assert cleanup_error[0] is None, f"Cleanup raised: {cleanup_error[0]}"
        assert nav_result[0] == "Navigated to: https://example.com\nPage title: Page\nHTTP status: 200"
        page.close.assert_called_once()
        assert tool._session._executor is None

    def test_concurrent_navigate_and_get_text(self, wired_tool):
        """get_text submitted while navigate runs waits for it on the session thread."""
        tool, page, _ = wired_tool
        order = []
        original_goto = page.goto
        original_evaluate = page.evaluate

        def slow_goto(url, **kwargs):
            order.append("goto_start")
            time.sleep(0.05)
            order.append("goto_end")
            return original_goto(url, **kwargs)

        def recording_evaluate(*args, **kwargs):
            order.append("evaluate")
            return original_evaluate(*args, **kwargs)

        page.goto = slow_goto
        page.evaluate = recording_evaluate
        page.title.return_value = "Page"
        original_evaluate.return_value = "page body text"

        results: list[str | None] = [None, None]

        def do_navigate():
            results[0] = tool._navigate("https://example.com")

        def do_get_text():
            results[1] = tool._get_text()

        t1 = threading.Thread(target=do_navigate)
        t2 = threading.Thread(target=do_get_text)
        t1.start()
        time.sleep(0.01)
        t2.start()
        t1.join(timeout=10)
        t2.join(timeout=10)

        assert results[0] is not None and results[1] is not None
        assert "Navigated to" in results[0]
        assert "page body text" in results[1]
        assert order.index("goto_end") < order.index("evaluate")

    def test_sequential_navigate_then_get_text(self, wired_tool):
        tool, page, _ = wired_tool
        page.goto.return_value = MagicMock(status=200)
        page.title.return_value = "Example"
        page.evaluate.return_value = "Hello from example.com"

        nav_result = tool._navigate("https://example.com")
        text_result = tool._get_text()

        assert "Navigated to: https://example.com" in nav_result
        assert "Example" in nav_result
        assert "Hello from example.com" in text_result
