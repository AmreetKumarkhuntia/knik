"""Browser automation: persistent Chromium sessions over Playwright (imported lazily on first launch)."""

from .session import BrowserSession, cleanup_idle, clear_stale_singleton_lock


__all__ = ["BrowserSession", "cleanup_idle", "clear_stale_singleton_lock"]
