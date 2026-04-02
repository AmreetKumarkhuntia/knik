from __future__ import annotations

import contextlib
import os
import threading
from typing import TYPE_CHECKING

from ...core.config import Config
from ...utils.printer import printer
from .manager import ToolSessionManager
from .resources import SessionResource, SessionResourceFactory


if TYPE_CHECKING:
    from playwright.sync_api import BrowserContext, Page, Playwright


class BrowserResource(SessionResource):
    def __init__(self, page: Page) -> None:
        self.page = page

    def close(self) -> None:
        with contextlib.suppress(Exception):
            if not self.page.is_closed():
                self.page.close()


class BrowserResourceFactory(SessionResourceFactory):
    requires_dedicated_thread = True
    max_workers = 1

    def __init__(self) -> None:
        self._playwright: Playwright | None = None
        self._browser_context: BrowserContext | None = None
        self._lock = threading.Lock()

    def create(self, conversation_id: str) -> BrowserResource:
        self._ensure_browser()
        page = self._browser_context.new_page()
        printer.info(f"[BrowserResourceFactory] Opened new browser tab for conv={conversation_id}")
        return BrowserResource(page)

    def shutdown(self) -> None:
        with contextlib.suppress(Exception):
            if self._browser_context is not None:
                self._browser_context.close()
        with contextlib.suppress(Exception):
            if self._playwright is not None:
                self._playwright.stop()
        self._browser_context = None
        self._playwright = None

    def _ensure_browser(self) -> None:
        if self._browser_context is not None:
            return

        with self._lock:
            if self._browser_context is not None:
                return

            try:
                from playwright.sync_api import sync_playwright  # noqa: PLC0415

                cfg = Config()
                headless = cfg.browser_headless
                profile_dir = cfg.browser_profile_dir

                os.makedirs(profile_dir, exist_ok=True)

                mode = "headless" if headless else "headful"
                printer.info(f"[BrowserResourceFactory] Launching {mode} Chromium (profile: {profile_dir})...")

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
                printer.success(f"[BrowserResourceFactory] Browser ready ({mode}, profile: {profile_dir})")

            except ImportError as err:
                raise RuntimeError(
                    "Playwright is not installed. Run: pip install playwright && playwright install chromium"
                ) from err


ToolSessionManager.get_instance().register_resource_factory("browser", BrowserResourceFactory())
