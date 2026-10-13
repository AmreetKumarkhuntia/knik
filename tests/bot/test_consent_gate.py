"""Tests for the bot consent gate: the Telegram prompt and the broker of pending replies per (chat, user).

The registry's consent semantics are tested in tests/lib/tools/test_registry.py.
"""

import asyncio
import threading
import time

import pytest

from bot.consent import BotConsentGate, ConsentBroker
from lib.tools.consent import ConsentRequest


REQ = ConsentRequest(tool_name="shell", kwargs={"command": "ls"})
PROMPT = "Allow shell(command='ls')? Reply yes (y) / yes all (ya) / no"


class TestConsentBroker:
    def test_single_prompt(self):
        broker = ConsentBroker()
        future = broker.add("chat_1", "alice")

        assert broker.has_pending("chat_1", "alice")
        assert broker.resolve("chat_1", "alice", "yes")
        assert future.result() == "yes"
        assert not broker.has_pending("chat_1", "alice")

    def test_prompts_of_one_user_resolve_in_fifo_order(self):
        broker = ConsentBroker()
        f1, f2, f3 = (broker.add("chat_1", "alice") for _ in range(3))

        broker.resolve("chat_1", "alice", "yes")
        assert f1.result() == "yes"
        assert not f2.done()
        assert not f3.done()

        broker.resolve("chat_1", "alice", "no")
        broker.resolve("chat_1", "alice", "yes_all")
        assert (f2.result(), f3.result()) == ("no", "yes_all")
        assert not broker.has_pending("chat_1", "alice")

    def test_resolve_with_nothing_pending_returns_false(self):
        assert not ConsentBroker().resolve("chat_1", "alice", "yes")

    def test_only_the_requesting_user_can_answer(self):
        broker = ConsentBroker()
        future = broker.add("group", "alice")

        assert not broker.has_pending("group", "bob")
        assert not broker.resolve("group", "bob", "yes")
        assert not future.done()
        assert broker.has_pending("group", "alice")

    def test_chats_are_independent(self):
        broker = ConsentBroker()
        in_dm = broker.add("dm", "alice")
        in_group = broker.add("group", "alice")

        broker.resolve("group", "alice", "no")

        assert in_group.result() == "no"
        assert not in_dm.done()
        assert broker.has_pending("dm", "alice")

    def test_withdraw_removes_an_unanswered_prompt(self):
        broker = ConsentBroker()
        first = broker.add("chat_1", "alice")
        second = broker.add("chat_1", "alice")

        assert broker.withdraw("chat_1", "alice", first)
        assert not broker.withdraw("chat_1", "alice", first)
        assert broker.resolve("chat_1", "alice", "yes")
        assert second.result() == "yes"
        assert not first.done()

    def test_withdraw_after_an_answer_returns_false(self):
        broker = ConsentBroker()
        future = broker.add("chat_1", "alice")
        broker.resolve("chat_1", "alice", "yes")

        assert not broker.withdraw("chat_1", "alice", future)
        assert future.result() == "yes"


@pytest.fixture
def loop():
    """An event loop on its own thread, standing in for the bot's loop while the gate blocks a tool thread."""
    loop = asyncio.new_event_loop()
    thread = threading.Thread(target=loop.run_forever, daemon=True)
    thread.start()
    yield loop
    loop.call_soon_threadsafe(loop.stop)
    thread.join(timeout=2)
    loop.close()


@pytest.fixture
def broker():
    return ConsentBroker()


def _gate(transport, loop, broker, chats: dict[str, str], user_id: str = "alice") -> BotConsentGate:
    return BotConsentGate(
        user_id=user_id, current_chat=lambda: chats.get(user_id), transport=transport, loop=loop, broker=broker
    )


def _answer_when_pending(broker, chat_id, user_id, response) -> threading.Thread:
    def answer():
        for _ in range(200):
            if broker.resolve(chat_id, user_id, response):
                return
            time.sleep(0.01)

    thread = threading.Thread(target=answer, daemon=True)
    thread.start()
    return thread


class TestBotConsentGate:
    def test_timeout_denies_and_leaves_nothing_pending(self, transport, loop, broker):
        gate = _gate(transport, loop, broker, {"alice": "chat_1"})

        result = gate.request_sync(REQ, timeout=0.2)

        assert result == "no"
        assert [(m.chat_id, m.text) for m in transport.messages] == [("chat_1", PROMPT)]
        # A timed-out prompt must not swallow the user's next message as an answer.
        assert not broker.has_pending("chat_1", "alice")

    def test_returns_the_users_answer(self, transport, loop, broker):
        gate = _gate(transport, loop, broker, {"alice": "chat_2"})
        answerer = _answer_when_pending(broker, "chat_2", "alice", "yes_all")

        assert gate.request_sync(REQ, timeout=2.0) == "yes_all"
        answerer.join(timeout=2)

    def test_asks_in_the_chat_the_user_wrote_from_last(self, transport, loop, broker):
        chats = {"alice": "chat_1"}
        gate = _gate(transport, loop, broker, chats)
        chats["alice"] = "chat_2"
        answerer = _answer_when_pending(broker, "chat_2", "alice", "yes")

        assert gate.request_sync(REQ, timeout=2.0) == "yes"
        assert [m.chat_id for m in transport.messages] == ["chat_2"]
        answerer.join(timeout=2)

    def test_without_a_known_chat_it_denies_without_asking(self, transport, loop, broker):
        gate = _gate(transport, loop, broker, {})

        assert gate.request_sync(REQ, timeout=0.2) == "no"
        assert transport.messages == []

    def test_a_prompt_that_cannot_be_sent_is_denied(self, transport, loop, broker):
        async def fail(**kwargs):
            raise RuntimeError("telegram down")

        transport.send_message = fail
        gate = _gate(transport, loop, broker, {"alice": "chat_1"})

        assert gate.request_sync(REQ, timeout=0.2) == "no"
        assert not broker.has_pending("chat_1", "alice")

    def test_an_answer_racing_the_timeout_wins(self, transport, loop, broker, monkeypatch):
        withdraw = broker.withdraw

        def answered_just_before_withdrawal(chat_id, user_id, future):
            broker.resolve(chat_id, user_id, "yes")
            return withdraw(chat_id, user_id, future)

        monkeypatch.setattr(broker, "withdraw", answered_just_before_withdrawal)
        gate = _gate(transport, loop, broker, {"alice": "chat_1"})

        assert gate.request_sync(REQ, timeout=0.05) == "yes"
