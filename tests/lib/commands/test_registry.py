"""Tests for the command registry and dispatcher the apps share."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from lib.commands.models import CommandResult
from lib.commands.registry import CommandDispatcher, CommandRegistry


def _handler(message: str = "ok") -> AsyncMock:
    return AsyncMock(return_value=CommandResult(success=True, message=message))


class TestCommandRegistry:
    def test_names_are_case_insensitive(self):
        registry = CommandRegistry()
        registry.register("Status", "Show status", _handler())

        assert registry.list_commands() == ["status"]
        assert registry.get("STATUS") is registry.get("status")
        assert registry.get_definitions()[0].name == "status"

    def test_aliases_resolve_to_their_command(self):
        registry = CommandRegistry(aliases={"Start": "NEW"})
        registry.register("new", "Start fresh", _handler())

        assert registry.get("start") is registry.get("new")
        assert registry.list_commands() == ["new"]

    def test_registering_again_replaces_the_command_in_place(self):
        registry = CommandRegistry()
        first, replacement = _handler("first"), _handler("replacement")
        registry.register("new", "Start", first)
        registry.register("help", "Help", _handler())
        registry.register("new", "Start over", replacement)

        assert registry.list_commands() == ["new", "help"]
        assert registry.get("new").handler is replacement
        assert registry.get("new").definition.description == "Start over"

    def test_unknown_name_is_none(self):
        assert CommandRegistry().get("nope") is None


@pytest.fixture
def registry():
    return CommandRegistry()


@pytest.fixture
def service():
    return MagicMock(name="command_service")


@pytest.fixture
def dispatcher(registry, service):
    return CommandDispatcher(registry, service)


class TestCommandDispatcher:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("/Model  gemini-2.5-pro ", ("model", "gemini-2.5-pro")),
            ("  /status", ("status", "")),
            ("/resume  #1  extra", ("resume", "#1  extra")),
            ("hello", None),
            ("/", None),
            ("/   ", None),
            ("", None),
        ],
    )
    def test_parse(self, dispatcher, text, expected):
        assert dispatcher.parse(text) == expected

    @pytest.mark.asyncio
    async def test_dispatch_calls_the_handler_with_service_args_and_user(self, dispatcher, registry, service):
        handler = _handler("done")
        registry.register("ping", "Ping", handler)

        result = await dispatcher.dispatch("/PING now please", "user_1")

        assert result.message == "done"
        handler.assert_awaited_once_with(command_service=service, args="now please", user_id="user_1")

    @pytest.mark.asyncio
    @pytest.mark.parametrize("text", ["/nope", "plain text", "/"])
    async def test_dispatch_leaves_anything_else_alone(self, dispatcher, registry, text):
        registry.register("ping", "Ping", _handler())

        assert await dispatcher.dispatch(text, "user_1") is None
        assert not dispatcher.handles(text)

    @pytest.mark.asyncio
    async def test_a_raising_handler_becomes_a_failed_result(self, dispatcher, registry):
        registry.register("boom", "Boom", AsyncMock(side_effect=RuntimeError("kaput")))

        result = await dispatcher.dispatch("/boom", "user_1")

        assert (result.success, result.message) == (False, "Error executing command: kaput")

    def test_handles_aliases(self, service):
        registry = CommandRegistry(aliases={"start": "new"})
        registry.register("new", "Start", _handler())

        assert CommandDispatcher(registry, service).handles("/start")
