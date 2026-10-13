"""Tests for the browser service: Chromium lifecycle, the session thread, idle cleanup and page operations."""

import asyncio
import os
import sys
import threading
import time
import types
import weakref
from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from lib.services.browser import session as session_mod
from lib.services.browser.session import BrowserSession, cleanup_idle, clear_stale_singleton_lock


def _make_mock_page():
    page = MagicMock()
    page.is_closed.return_value = False
    page.title.return_value = "Test Page"
    page.goto.return_value = MagicMock(status=200)
    page.evaluate.return_value = "body text content"
    page.query_selector.return_value = MagicMock(inner_text=MagicMock(return_value="selector text"))
    page.screenshot.return_value = b"\x89PNG\r\n\x1a\nfake_png_bytes"
    return page


def _make_mock_context(page=None):
    ctx = MagicMock()
    ctx.new_page.return_value = page or _make_mock_page()
    return ctx


def _make_mock_playwright(page=None):
    pw = MagicMock()
    pw.chromium.launch_persistent_context.return_value = _make_mock_context(page)
    return pw


def _wire(session: BrowserSession, page=None):
    """Make ``session`` look launched, with mock Playwright objects, so no real browser starts."""
    page = page or _make_mock_page()
    pw = _make_mock_playwright(page=page)
    ctx = pw.chromium.launch_persistent_context.return_value
    session._playwright = pw
    session._context = ctx
    session._page = page
    return pw, ctx, page


@pytest.fixture(autouse=True)
def _isolated_session_registry(monkeypatch):
    monkeypatch.setattr(session_mod, "_sessions", weakref.WeakSet())


@pytest.fixture
def config(monkeypatch, tmp_path):
    cfg = SimpleNamespace(
        browser_headless=True,
        browser_profile_dir=str(tmp_path / "browser-profile"),
        browser_idle_timeout=1800,
    )
    monkeypatch.setattr(session_mod, "Config", lambda: cfg)
    return cfg


@pytest.fixture
def fake_playwright(monkeypatch, config):
    """Serve a fake ``playwright.sync_api`` whose ``sync_playwright().start()`` returns a mock Playwright."""
    page = _make_mock_page()
    pw = _make_mock_playwright(page=page)
    sync_playwright = MagicMock()
    sync_playwright.return_value.start.return_value = pw
    module = types.ModuleType("playwright.sync_api")
    module.sync_playwright = sync_playwright  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "playwright.sync_api", module)
    return SimpleNamespace(sync_playwright=sync_playwright, playwright=pw, page=page)


@pytest.fixture
def session():
    s = BrowserSession()
    yield s
    s.close()


@pytest.fixture
def wired_session():
    s = BrowserSession()
    pw, ctx, page = _wire(s)
    yield s, page, ctx, pw
    s.close()


# ===========================================================================
# A. Asyncio fix
# ===========================================================================


class TestAsyncioFix:
    def test_ensure_browser_clears_running_loop(self, session, fake_playwright):
        """A running loop inherited via nest_asyncio is cleared before sync_playwright().start()."""
        loop_was_none_at_start = threading.Event()
        original_start = fake_playwright.sync_playwright.return_value.start

        def intercepted_start():
            if asyncio._get_running_loop() is None:
                loop_was_none_at_start.set()
            return original_start()

        fake_playwright.sync_playwright.return_value.start = intercepted_start

        def run_with_inherited_loop():
            fake_loop = asyncio.new_event_loop()
            asyncio._set_running_loop(fake_loop)
            try:
                session._ensure_browser()
            finally:
                asyncio._set_running_loop(None)
                fake_loop.close()

        executor = ThreadPoolExecutor(max_workers=1)
        try:
            executor.submit(run_with_inherited_loop).result(timeout=5)
        finally:
            executor.shutdown(wait=False)

        assert loop_was_none_at_start.is_set(), "Running loop was NOT cleared before sync_playwright().start()"

    def test_ensure_browser_works_without_running_loop(self, session, fake_playwright):
        session._ensure_browser()

        fake_playwright.sync_playwright.return_value.start.assert_called_once()
        assert session._playwright is fake_playwright.playwright


# ===========================================================================
# B. Launch and lifecycle
# ===========================================================================


class TestLaunch:
    def test_launch_uses_config_and_persistent_profile(self, session, fake_playwright, config):
        session._ensure_browser()

        kwargs = fake_playwright.playwright.chromium.launch_persistent_context.call_args.kwargs
        assert kwargs["user_data_dir"] == config.browser_profile_dir
        assert kwargs["headless"] is True
        assert kwargs["viewport"] == {"width": 1280, "height": 800}
        assert "--disable-blink-features=AutomationControlled" in kwargs["args"]
        assert os.path.isdir(config.browser_profile_dir)

    def test_launch_clears_stale_lock_in_profile(self, session, fake_playwright, config):
        os.makedirs(config.browser_profile_dir)
        lock_path = os.path.join(config.browser_profile_dir, "SingletonLock")
        os.symlink("hostname-999999999", lock_path)

        session._ensure_browser()

        assert not os.path.lexists(lock_path)


class TestBrowserLifecycle:
    def test_ensure_browser_only_launches_once(self, session, fake_playwright):
        session._ensure_browser()
        session._ensure_browser()

        fake_playwright.sync_playwright.return_value.start.assert_called_once()

    def test_close_tears_down_browser(self):
        """close() closes page and context, stops Playwright and shuts down the session thread."""
        s = BrowserSession()
        pw, ctx, page = _wire(s)
        s._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="test")
        s._last_used = time.monotonic()

        s.close()

        page.close.assert_called_once()
        ctx.close.assert_called_once()
        pw.stop.assert_called_once()
        assert s._executor is None
        assert s._page is None and s._context is None and s._playwright is None
        assert s.last_used == 0.0

    def test_close_allows_relaunch(self, session, fake_playwright):
        """After close(), the next call launches a fresh browser."""
        session.run(lambda page: page.title())
        assert fake_playwright.sync_playwright.return_value.start.call_count == 1

        session.close()
        session.run(lambda page: page.title())

        assert fake_playwright.sync_playwright.return_value.start.call_count == 2

    def test_close_on_fresh_session_is_noop(self, session):
        session.close()
        session.close()

        assert session.last_used == 0.0

    def test_executor_created_once(self, session):
        assert session._get_or_create_executor() is session._get_or_create_executor()

    def test_executor_thread_is_named_after_session(self, session):
        name = session.run_on_thread(lambda: threading.current_thread().name)

        assert name.startswith(f"browser-{id(session)}")

    def test_run_on_thread_serializes_calls(self, session):
        """Two calls from different threads run one after the other on the single session thread."""
        order = []

        def task_a():
            order.append("a_start")
            time.sleep(0.05)
            order.append("a_end")

        def task_b():
            order.append("b_start")
            order.append("b_end")

        t1 = threading.Thread(target=lambda: session.run_on_thread(task_a))
        t2 = threading.Thread(target=lambda: session.run_on_thread(task_b))
        t1.start()
        time.sleep(0.01)
        t2.start()
        t1.join(timeout=5)
        t2.join(timeout=5)

        assert order.index("a_end") < order.index("b_start")

    def test_run_on_thread_updates_last_used(self, session):
        session.run_on_thread(lambda: None)

        assert session.last_used > 0.0

    def test_run_on_thread_propagates_exceptions(self, session):
        def boom():
            raise ValueError("bad")

        with pytest.raises(ValueError, match="bad"):
            session.run_on_thread(boom)

    def test_sessions_run_in_parallel(self):
        """Separate sessions have separate threads, so one blocked session does not block another."""
        a, b = BrowserSession(), BrowserSession()
        b_ran = threading.Event()
        a_saw_b: list[bool] = []
        try:
            t = threading.Thread(target=lambda: a_saw_b.append(a.run_on_thread(lambda: b_ran.wait(timeout=5))))
            t.start()
            b.run_on_thread(b_ran.set)
            t.join(timeout=10)
        finally:
            a.close()
            b.close()

        # A shared thread would queue b behind a's wait, so a would time out and see False.
        assert a_saw_b == [True]


class TestCleanupIdle:
    def test_skips_recently_used_session(self, wired_session):
        s, *_ = wired_session
        s._last_used = time.monotonic()

        closed = cleanup_idle(idle_seconds=30)

        assert closed == 0
        assert s._context is not None
        assert s.last_used > 0.0

    def test_closes_stale_session(self, wired_session):
        s, page, ctx, pw = wired_session
        s._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="test")
        s._last_used = time.monotonic() - 60

        closed = cleanup_idle(idle_seconds=30)

        assert closed == 1
        assert s._executor is None
        assert s.last_used == 0.0
        ctx.close.assert_called_once()
        pw.stop.assert_called_once()

    def test_skips_never_used_session(self, session):
        assert cleanup_idle(idle_seconds=0) == 0

    def test_defaults_to_config_idle_timeout(self, config):
        config.browser_idle_timeout = 30
        stale, fresh = BrowserSession(), BrowserSession()
        stale._last_used = time.monotonic() - 60
        fresh._last_used = time.monotonic() - 10

        closed = cleanup_idle()

        assert closed == 1
        assert stale.last_used == 0.0
        assert fresh.last_used > 0.0

    def test_dropped_sessions_are_not_tracked(self):
        s = BrowserSession()
        assert s in session_mod._sessions
        del s

        assert len(session_mod._sessions) == 0


# ===========================================================================
# C. Edge cases
# ===========================================================================


class TestEdgeCases:
    def test_ensure_browser_raises_without_playwright(self, session, monkeypatch, config):
        monkeypatch.setitem(sys.modules, "playwright.sync_api", None)

        with pytest.raises(RuntimeError, match="Playwright is not installed"):
            session._ensure_browser()

    def test_ensure_page_creates_new_if_closed(self, session):
        ctx = _make_mock_context()
        session._context = ctx
        session._playwright = MagicMock()
        closed_page = MagicMock()
        closed_page.is_closed.return_value = True
        session._page = closed_page

        page = session._ensure_page()

        ctx.new_page.assert_called_once()
        assert page is ctx.new_page.return_value
        assert session._page is page

    def test_ensure_page_reuses_open_page(self, session):
        ctx = _make_mock_context()
        session._context = ctx
        session._playwright = MagicMock()
        open_page = MagicMock()
        open_page.is_closed.return_value = False
        session._page = open_page

        assert session._ensure_page() is open_page
        ctx.new_page.assert_not_called()


class TestClearStaleSingletonLock:
    def test_no_lock_file(self, tmp_path):
        assert clear_stale_singleton_lock(str(tmp_path)) is False

    def test_removes_lock_for_dead_pid(self, tmp_path):
        lock_path = tmp_path / "SingletonLock"
        # PID 999999999 is far above any real pid_max, so it is never alive.
        os.symlink("hostname-999999999", str(lock_path))

        assert clear_stale_singleton_lock(str(tmp_path)) is True
        assert not os.path.lexists(str(lock_path))

    def test_keeps_lock_for_live_pid(self, tmp_path):
        lock_path = tmp_path / "SingletonLock"
        os.symlink(f"hostname-{os.getpid()}", str(lock_path))

        assert clear_stale_singleton_lock(str(tmp_path)) is False
        # lexists because the symlink target is not a real path.
        assert os.path.lexists(str(lock_path))

    def test_regular_file_lock_removed(self, tmp_path):
        lock_path = tmp_path / "SingletonLock"
        lock_path.write_text("stale")

        assert clear_stale_singleton_lock(str(tmp_path)) is True
        assert not lock_path.exists()


class TestExecutorThreadSafety:
    def test_concurrent_get_or_create_returns_same_executor(self, session):
        results = []
        barrier = threading.Barrier(5)

        def worker():
            barrier.wait()
            results.append(session._get_or_create_executor())

        threads = [threading.Thread(target=worker) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=5)

        assert len(results) == 5
        assert all(r is results[0] for r in results)


# ===========================================================================
# D. Page operations
# ===========================================================================


class TestPageOperations:
    def test_run_passes_the_page(self, wired_session):
        s, page, *_ = wired_session

        assert s.run(lambda p: p) is page

    def test_run_executes_on_session_thread(self, wired_session):
        s, *_ = wired_session

        name = s.run(lambda _page: threading.current_thread().name)

        assert name.startswith(f"browser-{id(s)}")

    def test_navigate_returns_title_and_status(self, wired_session):
        s, page, *_ = wired_session
        page.title.return_value = "Example"

        assert s.navigate("https://example.com", "load") == ("Example", 200)
        page.goto.assert_called_once_with("https://example.com", wait_until="load", timeout=30000)

    def test_navigate_invalid_wait_until_falls_back(self, wired_session):
        s, page, *_ = wired_session

        s.navigate("https://example.com", wait_until="bogus")

        assert page.goto.call_args.kwargs["wait_until"] == "domcontentloaded"

    def test_navigate_without_response_has_no_status(self, wired_session):
        s, page, *_ = wired_session
        page.goto.return_value = None

        assert s.navigate("about:blank")[1] is None

    def test_text_whole_page_strips_scripts(self, wired_session):
        s, page, *_ = wired_session

        assert s.text() == "body text content"
        assert "script, style, noscript, svg" in page.evaluate.call_args.args[0]

    def test_text_with_selector(self, wired_session):
        s, page, *_ = wired_session

        assert s.text("h1") == "selector text"
        page.query_selector.assert_called_once_with("h1")

    def test_text_selector_not_found_returns_none(self, wired_session):
        s, page, *_ = wired_session
        page.query_selector.return_value = None

        assert s.text("#missing") is None

    def test_links_scope_and_limit(self, wired_session):
        s, page, *_ = wired_session
        page.evaluate.return_value = [{"text": "A", "href": "https://a.test"}]

        assert s.links("nav", 7) == [{"text": "A", "href": "https://a.test"}]
        script = page.evaluate.call_args.args[0]
        assert "document.querySelector('nav')" in script
        assert "slice(0, 7)" in script

    def test_links_default_scope_is_body(self, wired_session):
        s, page, *_ = wired_session
        page.evaluate.return_value = []

        s.links()

        assert "document.querySelector('body')" in page.evaluate.call_args.args[0]

    def test_click_by_selector(self, wired_session):
        s, page, *_ = wired_session
        page.title.return_value = "After"

        assert s.click(selector="#btn", timeout=1234) == "After"
        page.wait_for_selector.assert_called_once_with("#btn", timeout=1234)
        page.click.assert_called_once_with("#btn", timeout=1234)
        page.wait_for_load_state.assert_called_once_with("domcontentloaded", timeout=10000)

    def test_click_by_text(self, wired_session):
        s, page, *_ = wired_session

        s.click(text="Submit")

        page.click.assert_called_once_with("text=Submit", timeout=5000)

    def test_click_requires_selector_or_text(self, session):
        with pytest.raises(ValueError, match="Provide either"):
            session.click()
        assert session.last_used == 0.0

    def test_type_text_without_enter_returns_none(self, wired_session):
        s, page, *_ = wired_session

        assert s.type_text("#q", "hello") is None
        page.wait_for_selector.assert_called_once_with("#q", timeout=5000)
        page.fill.assert_called_once_with("#q", "")
        page.type.assert_called_once_with("#q", "hello", delay=30)
        page.press.assert_not_called()

    def test_type_text_with_enter_returns_title(self, wired_session):
        s, page, *_ = wired_session
        page.title.return_value = "Results"

        assert s.type_text("#q", "hello", clear_first=False, press_enter=True) == "Results"
        page.fill.assert_not_called()
        page.press.assert_called_once_with("#q", "Enter")

    def test_screenshot(self, wired_session):
        s, page, *_ = wired_session

        assert s.screenshot(full_page=True) == page.screenshot.return_value
        page.screenshot.assert_called_once_with(full_page=True)

    def test_operation_errors_propagate(self, wired_session):
        s, page, *_ = wired_session
        page.goto.side_effect = RuntimeError("net::ERR_NAME_NOT_RESOLVED")

        with pytest.raises(RuntimeError, match="ERR_NAME_NOT_RESOLVED"):
            s.navigate("https://doesnotexist.invalid")
