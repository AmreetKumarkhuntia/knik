"""Browser tools for the AI: a thin adapter that formats results from the browser service."""

import base64
import math
import re

from lib.services import browser as browser_service
from lib.tools.base_tool import BaseTool
from lib.utils.printer import printer


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


class BrowserTool(BaseTool):
    """Each instance owns one browser session, i.e. one browser per user/conversation."""

    consent_required_for = frozenset(
        {
            "browser_navigate",
            "browser_get_text",
            "browser_get_links",
            "browser_click",
            "browser_type",
            "browser_screenshot",
        }
    )

    def __init__(self) -> None:
        super().__init__()
        self._session = browser_service.BrowserSession()

    @property
    def name(self) -> str:
        return "browser"

    def cleanup(self) -> None:
        self._session.close()

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
        chunk = max(1, chunk or 1)

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
        printer.info(f"Navigating to: {url}")
        try:
            title, status = self._session.navigate(url, wait_until)
        except Exception as e:
            printer.warning(f"Navigation error: {e}")
            return f"Error navigating to {url}: {str(e)}"
        status_text = status if status is not None else "unknown"
        printer.success(f"Navigated to '{title}' (HTTP {status_text})")
        return f"Navigated to: {url}\nPage title: {title}\nHTTP status: {status_text}"

    def _get_text(self, selector: str | None = None, max_chars: int = 8000, chunk: int = 1) -> str:
        printer.info(f"Extracting text (selector={selector!r}, max_chars={max_chars}, chunk={chunk})")
        try:
            raw = self._session.text(selector)
            if raw is None:
                return f"Error: No element found matching selector '{selector}'"
            text = self._clean_text(raw or "", max_chars, chunk)
            printer.success(f"Extracted {len(text)} chars of text (chunk {chunk})")
            return text if text else "(No visible text found on page)"
        except Exception as e:
            return f"Error extracting text: {str(e)}"

    def _get_links(self, selector: str | None = None, max_links: int = 50) -> str:
        printer.info(f"Extracting links (selector={selector!r})")
        try:
            links = self._session.links(selector, max_links)
            if not links:
                return "No links found on the current page."
            lines = [f"{i + 1}. [{item['text'] or '(no text)'}]({item['href']})" for i, item in enumerate(links)]
            printer.success(f"Found {len(links)} links")
            return "\n".join(lines)
        except Exception as e:
            return f"Error extracting links: {str(e)}"

    def _click(self, selector: str | None = None, text: str | None = None, timeout: int = 5000) -> str:
        printer.info(f"Clicking: selector={selector!r} text={text!r}")
        if not selector and not text:
            return "Error: Provide either 'selector' or 'text' to identify what to click."
        try:
            title = self._session.click(selector=selector, text=text, timeout=timeout)
        except Exception as e:
            return f"Error clicking element: {str(e)}"
        if selector:
            return f"Clicked element: {selector}\nNew page title: {title}"
        return f"Clicked element with text '{text}'\nNew page title: {title}"

    def _type(self, selector: str, text: str, clear_first: bool = True, press_enter: bool = False) -> str:
        printer.info(f"Typing into {selector!r}: {text!r}")
        try:
            title = self._session.type_text(selector, text, clear_first=clear_first, press_enter=press_enter)
        except Exception as e:
            return f"Error typing into element: {str(e)}"
        if press_enter:
            return f"Typed '{text}' into {selector} and pressed Enter\nNew page title: {title}"
        return f"Typed '{text}' into {selector}"

    def _screenshot(self, full_page: bool = False) -> str:
        printer.info(f"Taking screenshot (full_page={full_page})")
        try:
            png_bytes = self._session.screenshot(full_page)
            b64 = base64.b64encode(png_bytes).decode("utf-8")
            size_kb = len(png_bytes) // 1024
            printer.success(f"Screenshot captured ({size_kb} KB)")
            return f"Screenshot captured ({size_kb} KB).\nBase64 PNG:\n{b64}"
        except Exception as e:
            return f"Error taking screenshot: {str(e)}"
