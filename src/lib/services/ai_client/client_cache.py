"""LRU cache for AIClient instances keyed by conversation ID."""

from __future__ import annotations

from collections import OrderedDict
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from .client import AIClient

_DEFAULT_MAX_SIZE = 200


class AIClientCache:
    """Thread-unsafe LRU cache mapping conversation_id -> AIClient.

    Not thread-safe by design — callers in async contexts should protect
    access with an asyncio.Lock if concurrent mutation is possible.
    """

    def __init__(self, max_size: int = _DEFAULT_MAX_SIZE) -> None:
        self._max_size = max_size
        self._cache: OrderedDict[str, AIClient] = OrderedDict()

    def get(self, key: str) -> AIClient | None:
        if key not in self._cache:
            return None
        self._cache.move_to_end(key)
        return self._cache[key]

    def set(self, key: str, client: AIClient) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = client
        if len(self._cache) > self._max_size:
            self._cache.popitem(last=False)

    def remove(self, key: str) -> None:
        self._cache.pop(key, None)

    def __len__(self) -> int:
        return len(self._cache)
