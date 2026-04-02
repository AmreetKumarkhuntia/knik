import base64
import math
import re

from ...services.tool_session import browser_resource as _browser_resource  # noqa: F401
from ...services.tool_session.manager import ToolSessionManager, current_conversation_id
from ...utils.printer import printer


def _get_page():
    conv_id = current_conversation_id.get(None) or "__global__"
    return ToolSessionManager.get_instance().get_page(conv_id)


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


def browser_navigate(url: str, wait_until: str = "domcontentloaded") -> str:
    def _inner():
        page = _get_page()
        valid_states = {"load", "domcontentloaded", "networkidle", "commit"}
        wstate = wait_until if wait_until in valid_states else "domcontentloaded"
        response = page.goto(url, wait_until=wstate, timeout=30000)
        title = page.title()
        status = response.status if response else "unknown"
        return title, status

    printer.info(f"🌐 Navigating to: {url}")
    try:
        conv_id = current_conversation_id.get(None) or "__global__"
        title, status = ToolSessionManager.get_instance().run_on_thread("browser", _inner)
        printer.success(f"🌐 Navigated to '{title}' (HTTP {status}) [conv={conv_id}]")
        return f"✅ Navigated to: {url}\nPage title: {title}\nHTTP status: {status}"
    except Exception as e:
        printer.warning(f"🌐 Navigation error: {e}")
        return f"Error navigating to {url}: {str(e)}"


def browser_get_text(selector: str = None, max_chars: int = 8000, chunk: int = 1) -> str:
    def _inner():
        page = _get_page()
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

    printer.info(f"🌐 Extracting text (selector={selector!r}, max_chars={max_chars}, chunk={chunk})")
    try:
        raw = ToolSessionManager.get_instance().run_on_thread("browser", _inner)
        if raw is None:
            return f"Error: No element found matching selector '{selector}'"
        text = _clean_text(raw or "", max_chars, chunk)
        printer.success(f"🌐 Extracted {len(text)} chars of text (chunk {chunk})")
        return text if text else "(No visible text found on page)"
    except Exception as e:
        return f"Error extracting text: {str(e)}"


def browser_get_links(selector: str = None, max_links: int = 50) -> str:
    def _inner():
        page = _get_page()
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
        links = ToolSessionManager.get_instance().run_on_thread("browser", _inner)
        if not links:
            return "No links found on the current page."
        lines = [f"{i + 1}. [{item['text'] or '(no text)'}]({item['href']})" for i, item in enumerate(links)]
        result = "\n".join(lines)
        printer.success(f"🌐 Found {len(links)} links")
        return result
    except Exception as e:
        return f"Error extracting links: {str(e)}"


def browser_click(selector: str = None, text: str = None, timeout: int = 5000) -> str:
    def _inner():
        page = _get_page()
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
        return ToolSessionManager.get_instance().run_on_thread("browser", _inner)
    except Exception as e:
        return f"Error clicking element: {str(e)}"


def browser_type(selector: str, text: str, clear_first: bool = True, press_enter: bool = False) -> str:
    def _inner():
        page = _get_page()
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
        return ToolSessionManager.get_instance().run_on_thread("browser", _inner)
    except Exception as e:
        return f"Error typing into element: {str(e)}"


def browser_screenshot(full_page: bool = False) -> str:
    def _inner():
        page = _get_page()
        return page.screenshot(full_page=full_page)

    printer.info(f"🌐 Taking screenshot (full_page={full_page})")
    try:
        png_bytes = ToolSessionManager.get_instance().run_on_thread("browser", _inner)
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
    # "browser_screenshot": browser_screenshot,
}
