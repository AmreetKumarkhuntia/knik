"""Tests for AIClientCache: LRU order, and tool cleanup when a client leaves the cache."""

from types import SimpleNamespace
from unittest.mock import MagicMock

from lib.services.ai_client.client_cache import AIClientCache


def _client():
    return SimpleNamespace(tool_registry=MagicMock())


def test_get_refreshes_recency_so_the_least_recent_is_evicted():
    cache = AIClientCache(max_size=2)
    a, b, c = _client(), _client(), _client()
    cache.set("a", a)
    cache.set("b", b)
    assert cache.get("a") is a

    cache.set("c", c)

    assert cache.get("b") is None
    assert (cache.get("a"), cache.get("c")) == (a, c)
    assert len(cache) == 2


def test_evicted_client_has_its_tools_cleaned_up():
    cache = AIClientCache(max_size=1)
    a, b = _client(), _client()
    cache.set("a", a)

    cache.set("b", b)

    a.tool_registry.cleanup_tools.assert_called_once_with()
    b.tool_registry.cleanup_tools.assert_not_called()


def test_removed_client_has_its_tools_cleaned_up():
    cache = AIClientCache()
    a = _client()
    cache.set("a", a)

    cache.remove("a")
    cache.remove("a")
    cache.remove("never-there")

    a.tool_registry.cleanup_tools.assert_called_once_with()
    assert len(cache) == 0


def test_replaced_client_is_cleaned_up_but_setting_the_same_one_again_is_not():
    cache = AIClientCache()
    a, b = _client(), _client()
    cache.set("k", a)
    cache.set("k", a)
    a.tool_registry.cleanup_tools.assert_not_called()

    cache.set("k", b)

    a.tool_registry.cleanup_tools.assert_called_once_with()
    assert cache.get("k") is b


def test_client_under_two_keys_is_released_only_with_its_last_key():
    cache = AIClientCache()
    a = _client()
    cache.set("draft", a)
    cache.set("conversation-1", a)

    cache.remove("draft")
    a.tool_registry.cleanup_tools.assert_not_called()

    cache.remove("conversation-1")
    a.tool_registry.cleanup_tools.assert_called_once_with()


def test_client_without_tools_and_failing_cleanup_do_not_raise():
    cache = AIClientCache(max_size=1)
    failing = _client()
    failing.tool_registry.cleanup_tools.side_effect = RuntimeError("boom")
    cache.set("plain", SimpleNamespace(tool_registry=None))
    cache.set("failing", failing)

    cache.remove("failing")

    failing.tool_registry.cleanup_tools.assert_called_once_with()
