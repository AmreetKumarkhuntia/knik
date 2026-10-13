"""Persistent Chromium sessions driven through Playwright's sync API, one dedicated thread per session."""

from __future__ import annotations

import asyncio
import contextlib
import os
import threading
import time
import weakref
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from typing import TYPE_CHECKING, Any

from lib.core.config import Config
from lib.utils.printer import printer


if TYPE_CHECKING:
    from playwright.sync_api import BrowserContext, Page, Playwright


_WAIT_STATES = frozenset({"load", "domcontentloaded", "networkidle", "commit"})
_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
_LAUNCH_ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
_TEARDOWN_TIMEOUT_SECONDS = 10

_PAGE_TEXT_JS = """() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, svg').forEach(el => el.remove());
    return clone.innerText || clone.textContent;
}"""

# Weak so a session nobody holds any more is not kept alive just for idle cleanup.
_sessions: weakref.WeakSet[BrowserSession] = weakref.WeakSet()
_sessions_lock = threading.Lock()


def clear_stale_singleton_lock(profile_dir: str) -> bool:
    """Remove a Chromium SingletonLock left by an unclean shutdown; return True when one was removed.

    Chromium writes SingletonLock as a symlink to ``{hostname}-{pid}``. When that PID is no longer
    running the lock is orphaned and blocks the next launch with the same profile.
    """
    lock_path = os.path.join(profile_dir, "SingletonLock")
    if not os.path.lexists(lock_path):
        return False

    try:
        if os.path.islink(lock_path):
            parts = os.readlink(lock_path).rsplit("-", 1)
            if len(parts) == 2:
                try:
                    pid = int(parts[1])
                    os.kill(pid, 0)
                    printer.warning(f"[browser] SingletonLock held by live PID {pid}; leaving it")
                    return False
                except (ProcessLookupError, ValueError, PermissionError):
                    pass

        os.remove(lock_path)
        printer.info(f"[browser] Removed stale SingletonLock ({lock_path})")
        return True
    except Exception as exc:
        printer.warning(f"[browser] Could not clean up SingletonLock: {exc}")
        return False


class BrowserSession:
    """One persistent Chromium context and page, launched lazily on first use.

    Playwright's sync objects may only be touched by the thread that created them, so all work for
    a session runs on its own single-worker executor and calls from other threads queue behind it.
    """

    def __init__(self) -> None:
        self._playwright: Playwright | None = None
        self._context: BrowserContext | None = None
        self._page: Page | None = None
        self._executor: ThreadPoolExecutor | None = None
        self._lock = threading.Lock()
        self._last_used = 0.0
        with _sessions_lock:
            _sessions.add(self)

    @property
    def last_used(self) -> float:
        """``time.monotonic()`` of the last call, or 0.0 when the session is closed or unused."""
        return self._last_used

    def run_on_thread(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        self._last_used = time.monotonic()
        return self._get_or_create_executor().submit(fn, *args, **kwargs).result()

    def run[T](self, fn: Callable[[Page], T]) -> T:
        """Run ``fn(page)`` on the session thread, launching the browser first if needed."""
        return self.run_on_thread(lambda: fn(self._ensure_page()))

    def navigate(self, url: str, wait_until: str = "domcontentloaded") -> tuple[str, int | None]:
        """Open ``url`` and return ``(title, http_status)``; status is None when there was no response."""
        state = wait_until if wait_until in _WAIT_STATES else "domcontentloaded"

        def _navigate(page: Page) -> tuple[str, int | None]:
            response = page.goto(url, wait_until=state, timeout=30000)
            return page.title(), response.status if response else None

        return self.run(_navigate)

    def text(self, selector: str | None = None) -> str | None:
        """Visible text of ``selector`` (or the whole body); None when the selector matches nothing."""

        def _text(page: Page) -> str | None:
            if selector:
                element = page.query_selector(selector)
                return None if element is None else element.inner_text()
            return page.evaluate(_PAGE_TEXT_JS)

        return self.run(_text)

    def links(self, selector: str | None = None, max_links: int = 50) -> list[dict[str, str]]:
        """Up to ``max_links`` ``{text, href}`` anchors inside ``selector`` (or the whole body)."""
        scope = selector if selector else "body"
        script = f"""() => {{
            const scope = document.querySelector({scope!r}) || document.body;
            const anchors = Array.from(scope.querySelectorAll('a[href]'));
            return anchors.slice(0, {max_links}).map(a => ({{
                text: (a.innerText || a.textContent || '').trim().slice(0, 120),
                href: a.href
            }}));
        }}"""
        return self.run(lambda page: page.evaluate(script))

    def click(self, selector: str | None = None, text: str | None = None, timeout: int = 5000) -> str:
        """Click by CSS ``selector`` or, failing that, by visible ``text``; return the resulting page title."""
        if not selector and not text:
            raise ValueError("Provide either 'selector' or 'text' to identify what to click.")
        target = selector if selector else f"text={text}"

        def _click(page: Page) -> str:
            page.wait_for_selector(target, timeout=timeout)
            page.click(target, timeout=timeout)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return page.title()

        return self.run(_click)

    def type_text(self, selector: str, text: str, clear_first: bool = True, press_enter: bool = False) -> str | None:
        """Type into ``selector``; return the new page title when Enter was pressed, otherwise None."""

        def _type(page: Page) -> str | None:
            page.wait_for_selector(selector, timeout=5000)
            if clear_first:
                page.fill(selector, "")
            page.type(selector, text, delay=30)
            if not press_enter:
                return None
            page.press(selector, "Enter")
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return page.title()

        return self.run(_type)

    def screenshot(self, full_page: bool = False) -> bytes:
        return self.run(lambda page: page.screenshot(full_page=full_page))

    def close(self) -> None:
        """Close the page, browser and Playwright, and stop the session thread. Safe to call repeatedly."""
        executor = self._executor
        if executor is not None:
            # Teardown runs on the session thread because that thread owns the Playwright objects.
            with contextlib.suppress(Exception):
                executor.submit(self._teardown_on_thread).result(timeout=_TEARDOWN_TIMEOUT_SECONDS)
            with contextlib.suppress(Exception):
                executor.shutdown(wait=False)
            self._executor = None
        self._last_used = 0.0

    def _get_or_create_executor(self) -> ThreadPoolExecutor:
        # Double-checked so concurrent first calls share one thread, and Playwright is always started on it.
        if self._executor is None:
            with self._lock:
                if self._executor is None:
                    self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix=f"browser-{id(self)}")
        return self._executor

    def _ensure_browser(self) -> BrowserContext:
        """Launch Chromium with the persistent profile. Must run on the session thread."""
        if self._context is not None:
            return self._context
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as err:
            raise RuntimeError(
                "Playwright is not installed. Run: pip install playwright && playwright install chromium"
            ) from err

        cfg = Config()
        headless = cfg.browser_headless
        profile_dir = cfg.browser_profile_dir

        os.makedirs(profile_dir, exist_ok=True)
        clear_stale_singleton_lock(profile_dir)

        mode = "headless" if headless else "headful"
        printer.info(f"[browser] Launching {mode} Chromium (profile: {profile_dir})...")

        # nest_asyncio (applied by lib.utils.async_utils.run_async inside a running loop) can leave a
        # running loop visible on this worker thread, and Playwright's sync API refuses to start
        # when it sees one. This thread never runs asyncio itself, so clearing it is safe.
        asyncio._set_running_loop(None)
        self._playwright = sync_playwright().start()
        self._context = self._playwright.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=headless,
            viewport={"width": 1280, "height": 800},
            user_agent=_USER_AGENT,
            args=_LAUNCH_ARGS,
        )
        printer.success(f"[browser] Browser ready ({mode}, profile: {profile_dir})")
        return self._context

    def _ensure_page(self) -> Page:
        """Return the open page, creating one if it was never opened or got closed. Must run on the session thread."""
        context = self._ensure_browser()
        if self._page is None or self._page.is_closed():
            self._page = context.new_page()
        return self._page

    def _teardown_on_thread(self) -> None:
        with contextlib.suppress(Exception):
            if self._page is not None and not self._page.is_closed():
                self._page.close()
        self._page = None
        with contextlib.suppress(Exception):
            if self._context is not None:
                self._context.close()
        self._context = None
        with contextlib.suppress(Exception):
            if self._playwright is not None:
                self._playwright.stop()
        self._playwright = None


def cleanup_idle(idle_seconds: int | None = None) -> int:
    """Close every session unused for longer than ``idle_seconds``; return how many were closed.

    ``idle_seconds`` defaults to ``Config.browser_idle_timeout``.
    """
    if idle_seconds is None:
        idle_seconds = Config().browser_idle_timeout
    now = time.monotonic()
    threshold = now - idle_seconds
    with _sessions_lock:
        sessions = list(_sessions)

    closed = 0
    for session in sessions:
        last_used = session.last_used
        if 0 < last_used < threshold:
            printer.info(f"[browser] Closing idle browser session (idle {now - last_used:.0f}s)")
            with contextlib.suppress(Exception):
                session.close()
            closed += 1
    return closed
