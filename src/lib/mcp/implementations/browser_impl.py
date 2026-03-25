"""
Browser automation tool implementations for MCP.
Uses Playwright (sync API) to drive a persistent Chromium browser session.
Supports headful (default) and headless modes with persistent profile storage
so cookies, logins, and sessions survive across restarts.

All Playwright operations are pinned to a single dedicated thread via a
ThreadPoolExecutor(max_workers=1) to avoid Playwright's thread-affinity
errors when called from async frameworks like FastAPI/uvicorn.
"""

import atexit
import base64
import os
import re
from concurrent.futures import ThreadPoolExecutor

from ...core.config import Config
from ...utils.printer import printer


# ---------------------------------------------------------------------------
# Dedicated browser thread
# ---------------------------------------------------------------------------
# Playwright's sync API binds to the thread that created it.  In an async
# server (FastAPI/uvicorn) successive tool calls may land on different
# threads, causing "cannot switch to a different thread" errors.
#
# We solve this by running *every* Playwright operation on a single,
# dedicated background thread via a 1-worker ThreadPoolExecutor.

_browser_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="pw")


def _run_on_browser_thread(fn, *args, **kwargs):
    """Submit *fn* to the dedicated Playwright thread and block until done."""
    future = _browser_executor.submit(fn, *args, **kwargs)
    return future.result()


# ---------------------------------------------------------------------------
# Persistent browser session (accessed ONLY from _browser_executor thread)
# ---------------------------------------------------------------------------
# We keep one Browser context + Page alive for the lifetime of the process so
# the AI can navigate, interact, and query across multiple tool calls.
# A persistent context is used so that cookies / localStorage / sessions are
# stored to disk and survive process restarts.

_playwright = None
_context = None  # BrowserContext (persistent)
_page = None


def _close_browser():
    """Cleanly shut down the browser, flushing session data to disk."""
    global _playwright, _context, _page

    def _shutdown():
        global _playwright, _context, _page
        try:
            if _context is not None:
                _context.close()
            if _playwright is not None:
                _playwright.stop()
        except Exception:
            pass  # best-effort cleanup during shutdown
        finally:
            _context = None
            _page = None
            _playwright = None

    try:
        _run_on_browser_thread(_shutdown)
    except RuntimeError:
        # Executor already shut down — do best-effort cleanup inline
        _shutdown()

    _browser_executor.shutdown(wait=False)


def _ensure_browser():
    """Lazily initialise Playwright + Chromium.  Runs on the browser thread."""
    global _playwright, _context, _page

    if _page is not None:
        return _page

    try:
        from playwright.sync_api import sync_playwright  # noqa: PLC0415

        cfg = Config()
        headless = cfg.browser_headless
        profile_dir = cfg.browser_profile_dir

        # Ensure the profile directory exists
        os.makedirs(profile_dir, exist_ok=True)

        mode = "headless" if headless else "headful"
        printer.info(f"Launching {mode} Chromium browser (profile: {profile_dir})...")

        _playwright = sync_playwright().start()
        _context = _playwright.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=headless,
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
        )

        # Persistent contexts may already have a blank page open
        _page = _context.pages[0] if _context.pages else _context.new_page()

        # Register cleanup so session data is flushed on exit
        atexit.register(_close_browser)

        printer.success(f"Browser ready ({mode}, profile: {profile_dir})")
        return _page
    except ImportError as err:
        raise RuntimeError(
            "Playwright is not installed. Run: pip install playwright && playwright install chromium"
        ) from err


def _clean_text(raw: str, max_chars: int) -> str:
    """Strip excessive whitespace and truncate."""
    text = re.sub(r"\n{3,}", "\n\n", raw)
    text = re.sub(r" {2,}", " ", text)
    text = text.strip()
    if len(text) > max_chars:
        text = text[:max_chars] + f"\n\n[... truncated — {len(text) - max_chars} more characters]"
    return text


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------


def browser_navigate(url: str, wait_until: str = "domcontentloaded") -> str:
    """Navigate to a URL and return the page title."""
    if wait_until is None:
        wait_until = "domcontentloaded"

    def _inner():
        page = _ensure_browser()
        valid_states = {"load", "domcontentloaded", "networkidle", "commit"}
        wstate = wait_until if wait_until in valid_states else "domcontentloaded"
        response = page.goto(url, wait_until=wstate, timeout=30000)
        title = page.title()
        status = response.status if response else "unknown"
        return title, status

    printer.info(f"🌐 Navigating to: {url}")
    try:
        title, status = _run_on_browser_thread(_inner)
        printer.success(f"🌐 Navigated to '{title}' (HTTP {status})")
        return f"✅ Navigated to: {url}\nPage title: {title}\nHTTP status: {status}"
    except Exception as e:
        printer.warning(f"🌐 Navigation error: {e}")
        return f"Error navigating to {url}: {str(e)}"


def browser_get_text(selector: str = None, max_chars: int = 8000) -> str:
    """Extract visible text from the page (or a specific element)."""
    if max_chars is None:
        max_chars = 8000

    def _inner():
        page = _ensure_browser()
        if selector:
            element = page.query_selector(selector)
            if element is None:
                return None  # sentinel: element not found
            return element.inner_text()
        else:
            return page.evaluate(
                """() => {
                    const clone = document.body.cloneNode(true);
                    clone.querySelectorAll('script, style, noscript, svg').forEach(el => el.remove());
                    return clone.innerText || clone.textContent;
                }"""
            )

    printer.info(f"🌐 Extracting text (selector={selector!r}, max_chars={max_chars})")
    try:
        raw = _run_on_browser_thread(_inner)
        if raw is None:
            return f"Error: No element found matching selector '{selector}'"
        text = _clean_text(raw or "", max_chars)
        printer.success(f"🌐 Extracted {len(text)} chars of text")
        return text if text else "(No visible text found on page)"
    except Exception as e:
        return f"Error extracting text: {str(e)}"


def browser_get_links(selector: str = None, max_links: int = 50) -> str:
    """Extract all hyperlinks from the page."""
    if max_links is None:
        max_links = 50

    def _inner():
        page = _ensure_browser()
        scope = selector if selector else "body"
        return page.evaluate(
            f"""() => {{
                const scope = document.querySelector({repr(scope)}) || document.body;
                const anchors = Array.from(scope.querySelectorAll('a[href]'));
                return anchors.slice(0, {max_links}).map(a => ({{
                    text: (a.innerText || a.textContent || '').trim().slice(0, 120),
                    href: a.href
                }}));
            }}"""
        )

    printer.info(f"🌐 Extracting links (selector={selector!r})")
    try:
        links = _run_on_browser_thread(_inner)
        if not links:
            return "No links found on the current page."
        lines = [f"{i + 1}. [{item['text'] or '(no text)'}]({item['href']})" for i, item in enumerate(links)]
        result = "\n".join(lines)
        printer.success(f"🌐 Found {len(links)} links")
        return result
    except Exception as e:
        return f"Error extracting links: {str(e)}"


def browser_click(selector: str = None, text: str = None, timeout: int = 5000) -> str:
    """Click an element by CSS selector or by visible text."""
    if timeout is None:
        timeout = 5000

    def _inner():
        page = _ensure_browser()
        if selector:
            page.wait_for_selector(selector, timeout=timeout)
            page.click(selector, timeout=timeout)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return f"✅ Clicked element: {selector}\nNew page title: {page.title()}"
        elif text:
            sel = f"text={text}"
            page.wait_for_selector(sel, timeout=timeout)
            page.click(sel, timeout=timeout)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return f"✅ Clicked element with text '{text}'\nNew page title: {page.title()}"
        else:
            return "Error: Provide either 'selector' or 'text' to identify what to click."

    printer.info(f"🌐 Clicking: selector={selector!r} text={text!r}")
    try:
        return _run_on_browser_thread(_inner)
    except Exception as e:
        return f"Error clicking element: {str(e)}"


def browser_type(selector: str, text: str, clear_first: bool = True, press_enter: bool = False) -> str:
    """Type text into an input field."""
    if clear_first is None:
        clear_first = True
    if press_enter is None:
        press_enter = False

    def _inner():
        page = _ensure_browser()
        page.wait_for_selector(selector, timeout=5000)
        if clear_first:
            page.fill(selector, "")
        page.type(selector, text, delay=30)
        if press_enter:
            page.press(selector, "Enter")
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return f"✅ Typed '{text}' into {selector} and pressed Enter\nNew page title: {page.title()}"
        return f"✅ Typed '{text}' into {selector}"

    printer.info(f"🌐 Typing into {selector!r}: {text!r}")
    try:
        return _run_on_browser_thread(_inner)
    except Exception as e:
        return f"Error typing into element: {str(e)}"


def browser_screenshot(full_page: bool = False) -> str:
    """Capture a screenshot and return it as a base64-encoded PNG."""
    if full_page is None:
        full_page = False

    def _inner():
        page = _ensure_browser()
        return page.screenshot(full_page=full_page)

    printer.info(f"🌐 Taking screenshot (full_page={full_page})")
    try:
        png_bytes = _run_on_browser_thread(_inner)
        b64 = base64.b64encode(png_bytes).decode("utf-8")
        size_kb = len(png_bytes) // 1024
        printer.success(f"🌐 Screenshot captured ({size_kb} KB)")
        return f"Screenshot captured ({size_kb} KB).\nBase64 PNG:\n{b64}"
    except Exception as e:
        return f"Error taking screenshot: {str(e)}"


BROWSER_IMPLEMENTATIONS = {
    "browser_navigate": browser_navigate,
    "browser_get_text": browser_get_text,
    "browser_get_links": browser_get_links,
    "browser_click": browser_click,
    "browser_type": browser_type,
    "browser_screenshot": browser_screenshot,
}
