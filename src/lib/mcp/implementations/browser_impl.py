"""
Browser automation tool implementations for MCP.
Uses Playwright (sync API) to drive a persistent headless Chromium browser session.
"""

import base64
import re

from ...utils.printer import printer


# ---------------------------------------------------------------------------
# Persistent browser session
# ---------------------------------------------------------------------------
# We keep one Browser + Page alive for the lifetime of the process so the AI
# can navigate, interact, and query across multiple tool calls.

_playwright = None
_browser = None
_page = None


def _ensure_browser():
    """Lazily initialise Playwright + Chromium. Called on first browser tool use."""
    global _playwright, _browser, _page

    if _page is not None:
        return _page

    try:
        from playwright.sync_api import sync_playwright  # noqa: PLC0415

        printer.info("🌐 Launching headless Chromium browser...")
        _playwright = sync_playwright().start()
        _browser = _playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        context = _browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        _page = context.new_page()
        printer.success("🌐 Browser ready (headless Chromium)")
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

    printer.info(f"🌐 Navigating to: {url}")
    try:
        page = _ensure_browser()
        valid_states = {"load", "domcontentloaded", "networkidle", "commit"}
        if wait_until not in valid_states:
            wait_until = "domcontentloaded"

        response = page.goto(url, wait_until=wait_until, timeout=30000)
        title = page.title()
        status = response.status if response else "unknown"
        printer.success(f"🌐 Navigated to '{title}' (HTTP {status})")
        return f"✅ Navigated to: {url}\nPage title: {title}\nHTTP status: {status}"
    except Exception as e:
        printer.warning(f"🌐 Navigation error: {e}")
        return f"Error navigating to {url}: {str(e)}"


def browser_get_text(selector: str = None, max_chars: int = 8000) -> str:
    """Extract visible text from the page (or a specific element)."""
    if max_chars is None:
        max_chars = 8000

    printer.info(f"🌐 Extracting text (selector={selector!r}, max_chars={max_chars})")
    try:
        page = _ensure_browser()

        if selector:
            element = page.query_selector(selector)
            if element is None:
                return f"Error: No element found matching selector '{selector}'"
            raw = element.inner_text()
        else:
            # Remove script/style nodes then grab body text
            raw = page.evaluate(
                """() => {
                    const clone = document.body.cloneNode(true);
                    clone.querySelectorAll('script, style, noscript, svg').forEach(el => el.remove());
                    return clone.innerText || clone.textContent;
                }"""
            )

        text = _clean_text(raw or "", max_chars)
        printer.success(f"🌐 Extracted {len(text)} chars of text")
        return text if text else "(No visible text found on page)"
    except Exception as e:
        return f"Error extracting text: {str(e)}"


def browser_get_links(selector: str = None, max_links: int = 50) -> str:
    """Extract all hyperlinks from the page."""
    if max_links is None:
        max_links = 50

    printer.info(f"🌐 Extracting links (selector={selector!r})")
    try:
        page = _ensure_browser()
        scope = selector if selector else "body"

        links = page.evaluate(
            f"""() => {{
                const scope = document.querySelector({repr(scope)}) || document.body;
                const anchors = Array.from(scope.querySelectorAll('a[href]'));
                return anchors.slice(0, {max_links}).map(a => ({{
                    text: (a.innerText || a.textContent || '').trim().slice(0, 120),
                    href: a.href
                }}));
            }}"""
        )

        if not links:
            return "No links found on the current page."

        lines = [f"{i+1}. [{item['text'] or '(no text)'}]({item['href']})" for i, item in enumerate(links)]
        result = "\n".join(lines)
        printer.success(f"🌐 Found {len(links)} links")
        return result
    except Exception as e:
        return f"Error extracting links: {str(e)}"


def browser_click(selector: str = None, text: str = None, timeout: int = 5000) -> str:
    """Click an element by CSS selector or by visible text."""
    if timeout is None:
        timeout = 5000

    printer.info(f"🌐 Clicking: selector={selector!r} text={text!r}")
    try:
        page = _ensure_browser()

        if selector:
            page.wait_for_selector(selector, timeout=timeout)
            page.click(selector, timeout=timeout)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return f"✅ Clicked element: {selector}\nNew page title: {page.title()}"
        elif text:
            # Use Playwright's :text() pseudo-selector
            sel = f"text={text}"
            page.wait_for_selector(sel, timeout=timeout)
            page.click(sel, timeout=timeout)
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return f"✅ Clicked element with text '{text}'\nNew page title: {page.title()}"
        else:
            return "Error: Provide either 'selector' or 'text' to identify what to click."
    except Exception as e:
        return f"Error clicking element: {str(e)}"


def browser_type(selector: str, text: str, clear_first: bool = True, press_enter: bool = False) -> str:
    """Type text into an input field."""
    if clear_first is None:
        clear_first = True
    if press_enter is None:
        press_enter = False

    printer.info(f"🌐 Typing into {selector!r}: {text!r}")
    try:
        page = _ensure_browser()
        page.wait_for_selector(selector, timeout=5000)

        if clear_first:
            page.fill(selector, "")

        page.type(selector, text, delay=30)  # slight delay for realism

        if press_enter:
            page.press(selector, "Enter")
            page.wait_for_load_state("domcontentloaded", timeout=10000)
            return f"✅ Typed '{text}' into {selector} and pressed Enter\nNew page title: {page.title()}"

        return f"✅ Typed '{text}' into {selector}"
    except Exception as e:
        return f"Error typing into element: {str(e)}"


def browser_screenshot(full_page: bool = False) -> str:
    """Capture a screenshot and return it as a base64-encoded PNG."""
    if full_page is None:
        full_page = False

    printer.info(f"🌐 Taking screenshot (full_page={full_page})")
    try:
        page = _ensure_browser()
        png_bytes = page.screenshot(full_page=full_page)
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
