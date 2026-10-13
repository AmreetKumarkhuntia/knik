"""LRU cache for AIClient instances keyed by conversation ID."""

from __future__ import annotations

from collections import OrderedDict
from collections.abc import Callable
from typing import TYPE_CHECKING

from ...utils.printer import printer


if TYPE_CHECKING:
    from .client import AIClient

_DEFAULT_MAX_SIZE = 200


class AIClientCache:
    """Thread-unsafe LRU cache mapping conversation_id -> AIClient.

    Not thread-safe by design — callers in async contexts should protect
    access with an asyncio.Lock if concurrent mutation is possible.

    A client that leaves the cache (evicted, removed, replaced or cleared) is handed to ``on_release``;
    by default its tools are cleaned up there and then. An owner whose clients may still be in use by a
    request passes its own ``on_release`` to defer that. One client can sit under two keys, so it is only
    released when its last key goes.
    """

    def __init__(self, max_size: int = _DEFAULT_MAX_SIZE, on_release: Callable[[AIClient], None] | None = None) -> None:
        self._max_size = max_size
        self._cache: OrderedDict[str, AIClient] = OrderedDict()
        self._on_release = on_release or cleanup_client_tools

    def get(self, key: str) -> AIClient | None:
        if key not in self._cache:
            return None
        self._cache.move_to_end(key)
        return self._cache[key]

    def set(self, key: str, client: AIClient) -> None:
        previous = self._cache.get(key)
        if previous is not None:
            self._cache.move_to_end(key)
        self._cache[key] = client
        if previous is not None and previous is not client:
            self._release(previous)
        if len(self._cache) > self._max_size:
            _key, evicted = self._cache.popitem(last=False)
            self._release(evicted)

    def remove(self, key: str) -> None:
        client = self._cache.pop(key, None)
        if client is not None:
            self._release(client)

    def clear(self) -> None:
        """Empty the cache, releasing every client once."""
        clients = {id(client): client for client in self._cache.values()}
        self._cache.clear()
        for client in clients.values():
            self._on_release(client)

    def holds(self, client: AIClient) -> bool:
        """Whether the client is cached under any key."""
        return any(cached is client for cached in self._cache.values())

    def __len__(self) -> int:
        return len(self._cache)

    def _release(self, client: AIClient) -> None:
        if not self.holds(client):
            self._on_release(client)


def cleanup_client_tools(client: AIClient) -> None:
    """Clean up the client's tools (closing its browser, for example); a failure is logged, not raised."""
    registry = client.tool_registry
    if registry is None:
        return
    try:
        registry.cleanup_tools()
    except Exception as e:
        printer.warning(f"[AIClientCache] tool cleanup failed: {e}")
