"""Tests for TelegramClient. python-telegram-bot's Bot and Application are replaced, so nothing reaches the network."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from telegram import BotCommand as TelegramBotCommand
from telegram.error import InvalidToken

from lib.services.telegram.client import TelegramClient
from lib.services.telegram.models import BotCommand


TOKEN = "123456:TEST"


def _sent(message_id: int) -> MagicMock:
    message = MagicMock()
    message.message_id = message_id
    return message


@pytest.fixture
def bot():
    bot = MagicMock()
    bot.send_message = AsyncMock(return_value=_sent(42))
    bot.send_message_draft = AsyncMock()
    bot.set_my_commands = AsyncMock()
    return bot


@pytest.fixture
def client(bot):
    with patch("lib.services.telegram.client.Bot", return_value=bot):
        yield TelegramClient(bot_token=TOKEN)


@pytest.fixture
def unconfigured():
    config = MagicMock(telegram_bot_token=None)
    with patch("lib.services.telegram.client.Config", return_value=config):
        yield TelegramClient()


@pytest.fixture
def printer():
    with patch("lib.services.telegram.client.printer") as printer:
        yield printer


async def _stream(*chunks: str):
    for chunk in chunks:
        yield chunk


class FakeUpdater:
    def __init__(self, fail_on_start: bool = False) -> None:
        self.running = False
        self.fail_on_start = fail_on_start
        self.polling_kwargs: dict | None = None
        self.stopped = False

    async def start_polling(self, **kwargs) -> None:
        if self.fail_on_start:
            raise RuntimeError("polling failed")
        self.polling_kwargs = kwargs
        self.running = True

    async def stop(self) -> None:
        if not self.running:
            raise RuntimeError("This Updater is not running!")
        self.running = False
        self.stopped = True


class FakeApplication:
    """Mirrors the PTB lifecycle checks: stop() raises unless start() ran."""

    def __init__(self, fail_on_initialize: bool = False, fail_on_polling: bool = False) -> None:
        self.bot = MagicMock()
        self.bot.shutdown = AsyncMock()
        self.updater = FakeUpdater(fail_on_start=fail_on_polling)
        self.running = False
        self.handlers: list = []
        self.error_handlers: list = []
        self.fail_on_initialize = fail_on_initialize
        self.stopped = False
        self.shut_down = False

    def add_handler(self, handler) -> None:
        self.handlers.append(handler)

    def add_error_handler(self, callback) -> None:
        self.error_handlers.append(callback)

    async def initialize(self) -> None:
        if self.fail_on_initialize:
            raise InvalidToken("rejected")

    async def start(self) -> None:
        self.running = True

    async def stop(self) -> None:
        if not self.running:
            raise RuntimeError("This Application is not running!")
        self.running = False
        self.stopped = True

    async def shutdown(self) -> None:
        self.shut_down = True


class FakeBuilder:
    def __init__(self, app: FakeApplication) -> None:
        self._app = app

    def build(self) -> FakeApplication:
        return self._app

    def __getattr__(self, name):
        return lambda *args, **kwargs: self


@pytest.fixture
def application():
    def _install(app: FakeApplication):
        application_cls = MagicMock()
        application_cls.builder.return_value = FakeBuilder(app)
        return application_cls

    return _install


class TestChunkText:
    def test_short_text_unchanged(self, client):
        assert client.chunk_text("Hello") == ["Hello"]

    def test_exact_max_len_unchanged(self, client):
        text = "x" * 4096
        assert client.chunk_text(text) == [text]

    def test_splits_long_text(self, client):
        chunks = client.chunk_text("x" * 5000)
        assert len(chunks) == 2
        assert all(len(c) <= 4096 for c in chunks)

    def test_splits_at_newline(self, client):
        chunks = client.chunk_text("line1\n" + "x" * 4100)
        assert len(chunks) >= 2
        assert chunks[0].startswith("line1")

    def test_custom_max_length_keeps_all_text(self, client):
        client.max_message_length = 100
        text = "A" * 250
        chunks = client.chunk_text(text)
        assert len(chunks) == 3
        assert "".join(chunks) == text

    def test_find_split_point_prefers_newline(self):
        text = "First line\nSecond line\nThird line"
        pos = TelegramClient._find_split_point(text, 25)
        assert text[pos - 1] == "\n"

    def test_find_split_point_falls_back_to_hard_split(self):
        assert TelegramClient._find_split_point("A" * 300, 100) == 100


class TestSendMessage:
    @pytest.mark.asyncio
    async def test_sends_and_returns_message_id(self, client, bot):
        result = await client.send_message("123", "Hello", reply_to_message_id="7")

        assert result.success is True
        assert result.message_id == "42"
        bot.send_message.assert_awaited_once_with(chat_id=123, text="Hello", reply_to_message_id="7")

    @pytest.mark.asyncio
    async def test_long_text_is_chunked_and_last_id_returned(self, client, bot):
        client.max_message_length = 10
        bot.send_message.side_effect = [_sent(1), _sent(2)]

        result = await client.send_message("123", "A" * 15)

        assert bot.send_message.await_count == 2
        assert result.message_id == "2"

    @pytest.mark.asyncio
    async def test_failure_returns_error_result(self, client, bot, printer):
        bot.send_message.side_effect = RuntimeError("network down")

        result = await client.send_message("123", "Hello")

        assert result.success is False
        assert result.error == "network down"
        printer.error.assert_called_once()

    @pytest.mark.asyncio
    async def test_unconfigured_returns_error_result(self, unconfigured):
        result = await unconfigured.send_message("123", "Hello")
        assert result.success is False
        assert unconfigured.is_configured() is False


class TestSendStream:
    @pytest.mark.asyncio
    async def test_private_chat_streams_drafts_then_sends_final_message(self, client, bot):
        result = await client.send_stream("123", _stream("Hello", " world", "!"))

        assert result.success is True
        assert result.message_id == "42"
        bot.send_message_draft.assert_awaited()
        assert bot.send_message_draft.await_args.kwargs["chat_id"] == 123
        bot.send_message.assert_awaited_once_with(chat_id=123, text="Hello world!")

    @pytest.mark.asyncio
    async def test_drafts_are_throttled(self, client, bot):
        await client.send_stream("123", _stream("a", "b", "c", "d"))

        # The chunks arrive within one debounce window, so only the first one becomes a draft.
        assert bot.send_message_draft.await_count == 1

    @pytest.mark.asyncio
    async def test_group_chat_skips_drafts(self, client, bot):
        result = await client.send_stream("-100123", _stream("Hello"))

        assert result.success is True
        bot.send_message_draft.assert_not_called()
        bot.send_message.assert_awaited_once_with(chat_id=-100123, text="Hello")

    @pytest.mark.asyncio
    async def test_draft_failure_is_logged_once_and_final_message_still_sent(self, client, bot, printer):
        bot.send_message_draft.side_effect = RuntimeError("draft rejected")

        with patch("lib.services.telegram.client._DRAFT_DEBOUNCE", 0.0):
            result = await client.send_stream("123", _stream("a", "b", "c"))

        assert result.success is True
        assert bot.send_message_draft.await_count == 3
        printer.warning.assert_called_once()
        assert "draft rejected" in printer.warning.call_args.args[0]
        bot.send_message.assert_awaited_once_with(chat_id=123, text="abc")

    @pytest.mark.asyncio
    async def test_empty_stream_sends_nothing(self, client, bot):
        result = await client.send_stream("123", _stream())

        assert result.success is True
        assert result.message_id is None
        bot.send_message.assert_not_called()

    @pytest.mark.asyncio
    async def test_whitespace_only_stream_sends_nothing(self, client, bot):
        # Telegram rejects a message with no visible text ("Bad Request: message text is empty").
        result = await client.send_stream("123", _stream("\n", " \n"))

        assert result.success is True
        assert result.message_id is None
        bot.send_message.assert_not_called()

    @pytest.mark.asyncio
    async def test_long_text_is_sent_in_chunks(self, client, bot):
        client.max_message_length = 10
        bot.send_message.side_effect = [_sent(1), _sent(2)]

        result = await client.send_stream("123", _stream("A" * 15))

        assert result.success is True
        assert result.message_id == "2"
        assert bot.send_message.await_count == 2

    @pytest.mark.asyncio
    async def test_final_send_failure_returns_error_result(self, client, bot, printer):
        bot.send_message.side_effect = RuntimeError("network down")

        result = await client.send_stream("123", _stream("Hello"))

        assert result.success is False
        assert result.error == "network down"

    @pytest.mark.asyncio
    async def test_unconfigured_returns_error_result(self, unconfigured):
        result = await unconfigured.send_stream("123", _stream("hi"))
        assert result.success is False


class TestRegisterCommands:
    @pytest.mark.asyncio
    async def test_converts_to_telegram_commands(self, client, bot):
        await client.register_commands([BotCommand("new", "Start fresh"), BotCommand("help", "Show help")])

        bot.set_my_commands.assert_awaited_once_with(
            [TelegramBotCommand("new", "Start fresh"), TelegramBotCommand("help", "Show help")]
        )

    @pytest.mark.asyncio
    async def test_failure_is_logged_not_raised(self, client, bot, printer):
        bot.set_my_commands.side_effect = InvalidToken("Unauthorized")

        await client.register_commands([BotCommand("new", "Start fresh")])

        printer.warning.assert_called_once()
        assert "set_my_commands" in printer.warning.call_args.args[0]

    @pytest.mark.asyncio
    async def test_unconfigured_does_nothing(self, unconfigured):
        await unconfigured.register_commands([BotCommand("new", "Start fresh")])


def _update(text: str | None, chat_id: int = 123, sender_id: int = 456) -> MagicMock:
    update = MagicMock()
    update.message.chat_id = chat_id
    update.message.message_id = 9
    update.message.text = text
    update.message.from_user.id = sender_id
    update.message.from_user.full_name = "Test User"
    update.message.date.timestamp.return_value = 1234567890.0
    update.to_dict.return_value = {"update_id": 1}
    return update


class TestIncomingUpdates:
    @pytest.fixture
    def received(self, client):
        messages = []

        async def capture(message):
            messages.append(message)

        client._on_message = capture
        return messages

    @pytest.mark.asyncio
    async def test_text_message_becomes_incoming_message(self, client, received):
        await client._handle_message(_update("Hello"), MagicMock())

        assert len(received) == 1
        message = received[0]
        assert message.chat_id == "123"
        assert message.message_id == "9"
        assert message.text == "Hello"
        assert message.sender_id == "456"
        assert message.sender_name == "Test User"
        assert message.timestamp == 1234567890.0
        assert message.raw == {"update_id": 1}

    @pytest.mark.asyncio
    async def test_start_command_is_rewritten_to_new(self, client, received):
        await client._handle_command(_update("/start"), MagicMock())

        assert received[0].text == "/new"

    @pytest.mark.asyncio
    async def test_update_without_text_is_ignored(self, client, received):
        await client._handle_message(_update(None), MagicMock())

        assert received == []

    @pytest.mark.asyncio
    async def test_error_handler_logs_the_traceback(self, client, printer):
        def failing_handler():
            raise RuntimeError("handler blew up")

        context = MagicMock()
        try:
            failing_handler()
        except RuntimeError as e:
            context.error = e

        await client._handle_error(None, context)

        printer.error.assert_called_once()
        logged = printer.error.call_args.args[0]
        assert "RuntimeError: handler blew up" in logged
        assert "in failing_handler" in logged


class TestLifecycle:
    @pytest.mark.asyncio
    async def test_stop_without_start_does_not_raise(self, client):
        await client.stop()

    @pytest.mark.asyncio
    async def test_start_unconfigured_raises(self, unconfigured):
        with pytest.raises(RuntimeError, match="not configured"):
            await unconfigured.start(AsyncMock())

    @pytest.mark.asyncio
    async def test_start_wires_handlers_and_polls(self, client, application):
        app = FakeApplication()
        with (
            patch("lib.services.telegram.client.Application", application(app)),
            patch("lib.services.telegram.client.AIORateLimiter"),
        ):
            await client.start(AsyncMock())

        assert len(app.handlers) == 2
        assert app.error_handlers == [client._handle_error]
        assert app.updater.polling_kwargs == {"drop_pending_updates": True}

        await client.stop()

        assert app.updater.stopped and app.stopped and app.shut_down
        app.bot.shutdown.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_failed_initialize_cleans_up_and_stop_does_not_raise(self, client, application):
        app = FakeApplication(fail_on_initialize=True)
        with (
            patch("lib.services.telegram.client.Application", application(app)),
            patch("lib.services.telegram.client.AIORateLimiter"),
            pytest.raises(InvalidToken),
        ):
            await client.start(AsyncMock())

        assert app.shut_down
        app.bot.shutdown.assert_awaited_once()
        await client.stop()

    @pytest.mark.asyncio
    async def test_failed_polling_stops_the_started_application(self, client, application):
        app = FakeApplication(fail_on_polling=True)
        with (
            patch("lib.services.telegram.client.Application", application(app)),
            patch("lib.services.telegram.client.AIORateLimiter"),
            pytest.raises(RuntimeError, match="polling failed"),
        ):
            await client.start(AsyncMock())

        assert app.stopped and app.shut_down
        await client.stop()

    @pytest.mark.asyncio
    async def test_rejected_token_with_real_application(self, bot):
        # Real PTB Application; only the token check is stubbed, so no request leaves the process.
        with (
            patch("lib.services.telegram.client.Bot", return_value=bot),
            patch("telegram.ext.ExtBot.initialize", AsyncMock(side_effect=InvalidToken("rejected"))),
        ):
            client = TelegramClient(bot_token=TOKEN)
            with pytest.raises(InvalidToken):
                await client.start(AsyncMock())
            await client.stop()
