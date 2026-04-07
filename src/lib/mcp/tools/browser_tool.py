from __future__ import annotations

import base64
import contextlib
import math
import os
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import TYPE_CHECKING

from lib.services.ai_client.base_tool import BaseTool
from lib.utils.printer import printer

from ...core.config import Config


BROWSER_DEFINITIONS = [
    {
        "name": "browser_navigate",
        "description": (
            "Open a URL in the browser. "
            "Use this to visit websites like LinkedIn, Indeed, Google, or any other site. "
            "Returns the page title and a short status message. "
            "The browser window is visible by default so the user can interact with it (e.g. sign in). "
            "Always call this first before using other browser tools."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "Full URL to navigate to (e.g. 'https://www.indeed.com').",
                },
                "wait_until": {
                    "type": "string",
                    "description": "When to consider navigation done: 'load', 'domcontentloaded', or 'networkidle'.",
                    "default": "domcontentloaded",
                },
            },
            "required": ["url"],
        },
    },
    {
        "name": "browser_get_text",
        "description": (
            "Extract all visible text from the current browser page. "
            "Use after browser_navigate. Returns cleaned, readable text — great for reading job descriptions, "
            "article content, or any page information. "
            "If text exceeds max_chars, use the chunk parameter to retrieve subsequent portions."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": (
                        "Optional CSS selector to limit text extraction to a specific element "
                        "(e.g. 'main', '#job-description', '.content'). "
                        "If omitted, extracts text from the entire page body."
                    ),
                    "default": None,
                },
                "max_chars": {
                    "type": "integer",
                    "description": "Maximum number of characters to return per chunk. Default 8000.",
                    "default": 8000,
                },
                "chunk": {
                    "type": "integer",
                    "description": (
                        "Which chunk of text to return (1-indexed). Each chunk contains up to max_chars characters. "
                        "Default is 1 (first chunk). Use higher values to read subsequent portions of long pages."
                    ),
                    "default": 1,
                },
            },
            "required": [],
        },
    },
    {
        "name": "browser_get_links",
        "description": (
            "Extract all hyperlinks (anchor tags) from the current browser page. "
            "Returns a list of {text, href} pairs. "
            "Useful for finding job listing links, navigation menus, or any clickable links on a page."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "Optional CSS selector to limit link extraction to a specific section.",
                    "default": None,
                },
                "max_links": {
                    "type": "integer",
                    "description": "Maximum number of links to return. Default 50.",
                    "default": 50,
                },
            },
            "required": [],
        },
    },
    {
        "name": "browser_click",
        "description": (
            "Click an element on the current page. "
            "You can target by CSS selector (e.g. 'button.apply-btn') or by visible text (e.g. 'Apply Now'). "
            "Use this to click job listings, submit forms, open menus, or press buttons."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector of the element to click (e.g. 'button#submit', 'a.job-link').",
                    "default": None,
                },
                "text": {
                    "type": "string",
                    "description": (
                        "Visible text of the element to click. "
                        "Used when you don't know the CSS selector. "
                        "Provide EITHER selector OR text."
                    ),
                    "default": None,
                },
                "timeout": {
                    "type": "integer",
                    "description": "Maximum milliseconds to wait for element. Default 5000.",
                    "default": 5000,
                },
            },
            "required": [],
        },
    },
    {
        "name": "browser_type",
        "description": (
            "Type text into an input field on the current page. "
            "Use this to fill search boxes, form fields, email/password inputs, etc. "
            "Target the field with a CSS selector (e.g. 'input[name=\"q\"]', '#email')."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector of the input element to type into.",
                },
                "text": {
                    "type": "string",
                    "description": "Text to type into the field.",
                },
                "clear_first": {
                    "type": "boolean",
                    "description": "Whether to clear existing text in the field before typing. Default true.",
                    "default": True,
                },
                "press_enter": {
                    "type": "boolean",
                    "description": "Whether to press Enter after typing (useful for search boxes). Default false.",
                    "default": False,
                },
            },
            "required": ["selector", "text"],
        },
    },
    {
        "name": "browser_screenshot",
        "description": (
            "Take a screenshot of the current browser page and return it as a base64-encoded PNG string. "
            "Useful for visually verifying what is displayed on a page, "
            "checking form states, or confirming navigation succeeded."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "full_page": {
                    "type": "boolean",
                    "description": "Whether to capture the full scrollable page or just the visible viewport. Default false.",
                    "default": False,
                },
            },
            "required": [],
        },
    },
]


if TYPE_CHECKING:
    from playwright.sync_api import BrowserContext as BrowserContext
    from playwright.sync_api import Page as Page
    from playwright.sync_api import Playwright


class BrowserTool(BaseTool):
    """One browser instance per tool instance (= one per user/conversation).

    Each instance owns its own ThreadPoolExecutor (single worker), its own
    Playwright handle, and its own persistent browser context.  All Playwright
    objects are created and used exclusively on that one thread, so there is
    never a cross-thread access violation.
    """

    @property
    def name(self) -> str:
        return "browser"

    def __init__(self) -> None:
        super().__init__()
        self._page: Page | None = None
        self._playwright: Playwright | None = None
        self._browser_context: BrowserContext | None = None
        self._executor: ThreadPoolExecutor | None = None
        self._lock: threading.Lock = threading.Lock()
        self._last_used: float = 0.0

    def _get_or_create_executor(self) -> ThreadPoolExecutor:
        """Uses double-checked locking so the executor is always created before
        any Playwright work is submitted to it.
        """
        if self._executor is None:
            with self._lock:
                if self._executor is None:
                    self._executor = ThreadPoolExecutor(
                        max_workers=1,
                        thread_name_prefix=f"browser-{id(self)}",
                    )
        return self._executor

    def _ensure_browser(self) -> None:
        """Must be called from *inside* the dedicated executor thread (i.e. from
        within a function passed to run_on_thread).  That guarantees all
        Playwright objects are owned by the same thread for their entire life.
        """
        if self._browser_context is not None:
            return
        try:
            from playwright.sync_api import sync_playwright

            cfg = Config()
            headless = cfg.browser_headless
            profile_dir = cfg.browser_profile_dir

            os.makedirs(profile_dir, exist_ok=True)

            mode = "headless" if headless else "headful"
            printer.info(f"[BrowserTool] Launching {mode} Chromium (profile: {profile_dir})...")

            self._playwright = sync_playwright().start()
            self._browser_context = self._playwright.chromium.launch_persistent_context(
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
            printer.success(f"[BrowserTool] Browser ready ({mode}, profile: {profile_dir})")
        except ImportError as err:
            raise RuntimeError(
                "Playwright is not installed. Run: pip install playwright && playwright install chromium"
            ) from err

    def _ensure_page(self) -> None:
        """Safe to call only from within run_on_thread (i.e. on the dedicated
        executor thread).
        """
        self._ensure_browser()
        if self._page is None or self._page.is_closed():
            self._page = self._browser_context.new_page()

    def run_on_thread(self, fn, *args, **kwargs):
        """The executor is created (via double-checked lock) before the first
        submission, so sync_playwright is always initialised on the same
        persistent thread that handles all subsequent calls.
        """
        self._last_used = time.monotonic()
        executor = self._get_or_create_executor()
        return executor.submit(fn, *args, **kwargs).result()

    def cleanup(self) -> None:
        executor = self._executor
        if executor is not None:
            # Run teardown on the browser thread so Playwright objects are
            # closed by the thread that owns them.
            with contextlib.suppress(Exception):
                executor.submit(self._teardown_on_thread).result(timeout=10)
            with contextlib.suppress(Exception):
                executor.shutdown(wait=False)
            self._executor = None
        self._last_used = 0.0

    def _teardown_on_thread(self) -> None:
        """Close Playwright resources — must run on the browser thread."""
        with contextlib.suppress(Exception):
            if self._page is not None and not self._page.is_closed():
                self._page.close()
        self._page = None
        with contextlib.suppress(Exception):
            if self._browser_context is not None:
                self._browser_context.close()
        self._browser_context = None
        with contextlib.suppress(Exception):
            if self._playwright is not None:
                self._playwright.stop()
        self._playwright = None

    @classmethod
    def cleanup_idle(cls, idle_seconds: int) -> None:
        """Called periodically by the bot's auto-cleaner background task."""
        from lib.services.ai_client.base_tool import BaseTool as _BaseTool

        threshold = time.monotonic() - idle_seconds
        for instance in list(_BaseTool._instances):
            if not isinstance(instance, cls):
                continue
            if instance._last_used > 0 and instance._last_used < threshold:
                printer.info(
                    f"[BrowserTool] Closing idle browser session (idle {time.monotonic() - instance._last_used:.0f}s)"
                )
                with contextlib.suppress(Exception):
                    instance.cleanup()

    def get_definitions(self):
        return BROWSER_DEFINITIONS

    def get_implementations(self):
        return {
            "browser_navigate": self._navigate,
            "browser_get_text": self._get_text,
            "browser_get_links": self._get_links,
            "browser_click": self._click,
            "browser_type": self._type,
            # "browser_screenshot": self._screenshot,
        }

    @staticmethod
    def _clean_text(raw: str, max_chars: int, chunk: int = 1) -> str:
        text = re.sub(r"\n{3,}", "\n\n", raw)
        text = re.sub(r" {2,}", " ", text)
        text = text.strip()

        total_chars = len(text)
        if total_chars == 0:
            return ""

        total_chunks = math.ceil(total_chars / max_chars)
        chunk = max(1, chunk)

        if chunk > total_chunks:
            return f"[No content at chunk {chunk}. Total chunks available: {total_chunks} (total {total_chars} chars)]"

        start = (chunk - 1) * max_chars
        end = min(chunk * max_chars, total_chars)
        chunk_text = text[start:end]

        header = f"[Chunk {chunk}/{total_chunks} | chars {start + 1}-{end} of {total_chars}]"
        result = f"{header}\n\n{chunk_text}"

        if chunk < total_chunks:
            result += f"\n\n[Use chunk={chunk + 1} to continue reading]"

        return result

    def _navigate(self, url: str, wait_until: str = "domcontentloaded") -> str:
        def _inner():
            self._ensure_page()
            page = self._page
            valid_states = {"load", "domcontentloaded", "networkidle", "commit"}
            wstate = wait_until if wait_until in valid_states else "domcontentloaded"
            response = page.goto(url, wait_until=wstate, timeout=30000)
            title = page.title()
            status = response.status if response else "unknown"
            return title, status

        printer.info(f"Navigating to: {url}")
        try:
            title, status = self.run_on_thread(_inner)
            printer.success(f"Navigated to '{title}' (HTTP {status})")
            return f"Navigated to: {url}\nPage title: {title}\nHTTP status: {status}"
        except Exception as e:
            printer.warning(f"Navigation error: {e}")
            return f"Error navigating to {url}: {str(e)}"

    def _get_text(self, selector: str | None = None, max_chars: int = 8000, chunk: int = 1) -> str:
        def _inner():
            self._ensure_page()
            page = self._page
            if selector:
                element = page.query_selector(selector)
                if element is None:
                    return None
                return element.inner_text()
            else:
                return page.evaluate(
                    """() => {
                        const clone = document.body.cloneNode(true);
                        clone.querySelectorAll('script, style, noscript, svg').forEach(el => el.remove());
                        return clone.innerText || clone.textContent;
                    }"""
                )

        printer.info(f"Extracting text (selector={selector!r}, max_chars={max_chars}, chunk={chunk})")
        try:
            raw = self.run_on_thread(_inner)
            if raw is None:
                return f"Error: No element found matching selector '{selector}'"
            text = self._clean_text(raw or "", max_chars, chunk)
            printer.success(f"Extracted {len(text)} chars of text (chunk {chunk})")
            return text if text else "(No visible text found on page)"
        except Exception as e:
            return f"Error extracting text: {str(e)}"

    def _get_links(self, selector: str | None = None, max_links: int = 50) -> str:
        def _inner():
            self._ensure_page()
            page = self._page
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

        printer.info(f"Extracting links (selector={selector!r})")
        try:
            links = self.run_on_thread(_inner)
            if not links:
                return "No links found on the current page."
            lines = [f"{i + 1}. [{item['text'] or '(no text)'}]({item['href']})" for i, item in enumerate(links)]
            result = "\n".join(lines)
            printer.success(f"Found {len(links)} links")
            return result
        except Exception as e:
            return f"Error extracting links: {str(e)}"

    def _click(self, selector: str | None = None, text: str | None = None, timeout: int = 5000) -> str:
        def _inner():
            self._ensure_page()
            page = self._page
            if selector:
                page.wait_for_selector(selector, timeout=timeout)
                page.click(selector, timeout=timeout)
                page.wait_for_load_state("domcontentloaded", timeout=10000)
                return f"Clicked element: {selector}\nNew page title: {page.title()}"
            elif text:
                sel = f"text={text}"
                page.wait_for_selector(sel, timeout=timeout)
                page.click(sel, timeout=timeout)
                page.wait_for_load_state("domcontentloaded", timeout=10000)
                return f"Clicked element with text '{text}'\nNew page title: {page.title()}"
            else:
                return "Error: Provide either 'selector' or 'text' to identify what to click."

        printer.info(f"Clicking: selector={selector!r} text={text!r}")
        try:
            return self.run_on_thread(_inner)
        except Exception as e:
            return f"Error clicking element: {str(e)}"

    def _type(self, selector: str, text: str, clear_first: bool = True, press_enter: bool = False) -> str:
        def _inner():
            self._ensure_page()
            page = self._page
            page.wait_for_selector(selector, timeout=5000)
            if clear_first:
                page.fill(selector, "")
            page.type(selector, text, delay=30)
            if press_enter:
                page.press(selector, "Enter")
                page.wait_for_load_state("domcontentloaded", timeout=10000)
                return f"Typed '{text}' into {selector} and pressed Enter\nNew page title: {page.title()}"
            return f"Typed '{text}' into {selector}"

        printer.info(f"Typing into {selector!r}: {text!r}")
        try:
            return self.run_on_thread(_inner)
        except Exception as e:
            return f"Error typing into element: {str(e)}"

    def _screenshot(self, full_page: bool = False) -> str:
        def _inner():
            self._ensure_page()
            page = self._page
            return page.screenshot(full_page=full_page)

        printer.info(f"Taking screenshot (full_page={full_page})")
        try:
            png_bytes = self.run_on_thread(_inner)
            b64 = base64.b64encode(png_bytes).decode("utf-8")
            size_kb = len(png_bytes) // 1024
            printer.success(f"Screenshot captured ({size_kb} KB)")
            return f"Screenshot captured ({size_kb} KB).\nBase64 PNG:\n{b64}"
        except Exception as e:
            return f"Error taking screenshot: {str(e)}"
