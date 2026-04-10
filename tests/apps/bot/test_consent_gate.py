"""Tests for the consent gate: per-invocation approval, FIFO queue, and thread safety."""

import threading
from concurrent.futures import Future
from unittest.mock import MagicMock

from src.apps.bot.consent import BotConsentGate, PendingConsents
from src.lib.services.ai_client.consent import ConsentRequest
from src.lib.services.ai_client.registry.mcp_registry import MCPServerRegistry


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


class StubConsentGate:
    """Gate that returns a fixed response sequence."""

    def __init__(self, responses: list[str]) -> None:
        self._responses = list(responses)
        self._call_count = 0

    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str:
        resp = self._responses[self._call_count] if self._call_count < len(self._responses) else "no"
        self._call_count += 1
        return resp

    @property
    def call_count(self) -> int:
        return self._call_count


def _registry_with_tools(*tool_names: str) -> MCPServerRegistry:
    reg = MCPServerRegistry()
    for name in tool_names:
        reg.register_tool(
            {"name": name, "description": f"Tool {name}"},
            implementation=lambda **kw: {"ok": True, **kw},
        )
    return reg


# ---------------------------------------------------------------------------
# MCPServerRegistry.execute_tool – consent semantics
# ---------------------------------------------------------------------------


class TestExecuteToolConsent:
    def test_yes_approves_single_invocation_only(self):
        """Saying 'yes' should NOT auto-approve the next call to the same tool."""
        reg = _registry_with_tools("shell")
        gate = StubConsentGate(["yes", "yes"])
        reg.set_consent_gate(gate)

        reg.execute_tool("shell", command="ls")
        reg.execute_tool("shell", command="rm -rf /")

        # Both calls must hit the gate — no auto-approval after first 'yes'
        assert gate.call_count == 2

    def test_yes_all_auto_approves_same_tool_name(self):
        """Saying 'yes_all' should auto-approve all future calls to that tool name."""
        reg = _registry_with_tools("shell")
        gate = StubConsentGate(["yes_all"])
        reg.set_consent_gate(gate)

        reg.execute_tool("shell", command="ls")
        reg.execute_tool("shell", command="cat /etc/passwd")
        reg.execute_tool("shell", command="whoami")

        # Only the first call should go through the gate
        assert gate.call_count == 1

    def test_yes_all_does_not_approve_other_tools(self):
        """'yes_all' for tool A should NOT auto-approve tool B."""
        reg = _registry_with_tools("shell", "file_read")
        gate = StubConsentGate(["yes_all", "yes"])
        reg.set_consent_gate(gate)

        reg.execute_tool("shell", command="ls")
        reg.execute_tool("file_read", path="/etc/passwd")

        # shell auto-approved after first yes_all, but file_read still needs consent
        assert gate.call_count == 2

    def test_no_denies_and_does_not_block_next_call(self):
        """Saying 'no' should deny only that call; next call still gets prompted."""
        reg = _registry_with_tools("shell")
        gate = StubConsentGate(["no", "yes"])
        reg.set_consent_gate(gate)

        result1 = reg.execute_tool("shell", command="rm -rf /")
        result2 = reg.execute_tool("shell", command="ls")

        assert "error" in result1
        assert "ok" in result2
        assert gate.call_count == 2

    def test_no_gate_means_no_consent(self):
        """Without a gate, tools execute directly."""
        reg = _registry_with_tools("shell")
        result = reg.execute_tool("shell", command="ls")
        assert result == {"ok": True, "command": "ls"}

    def test_revoke_clears_yes_all_approvals(self):
        """After revoke, previously yes_all'd tools require consent again."""
        reg = _registry_with_tools("shell")
        gate = StubConsentGate(["yes_all", "yes"])
        reg.set_consent_gate(gate)

        reg.execute_tool("shell", command="ls")  # yes_all → auto-approve shell
        reg.revoke_allowed_tools()
        reg.execute_tool("shell", command="whoami")  # should prompt again

        assert gate.call_count == 2


# ---------------------------------------------------------------------------
# MCPServerRegistry – thread safety
# ---------------------------------------------------------------------------


class TestRegistryThreadSafety:
    def test_concurrent_execute_tool_does_not_crash(self):
        """Multiple threads calling execute_tool should not raise."""
        reg = _registry_with_tools("shell")
        # Gate that always approves
        gate = StubConsentGate(["yes"] * 50)
        reg.set_consent_gate(gate)

        errors: list[Exception] = []

        def worker(i: int) -> None:
            try:
                reg.execute_tool("shell", command=f"echo {i}")
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=5)

        assert not errors, f"Errors in threads: {errors}"


# ---------------------------------------------------------------------------
# PendingConsents – FIFO queue behaviour
# ---------------------------------------------------------------------------


class TestPendingConsentsFIFO:
    def setup_method(self):
        # Clear class-level state between tests
        PendingConsents._pending.clear()

    def test_single_future(self):
        fut: Future[str] = Future()
        PendingConsents.add("chat_1", fut)

        assert PendingConsents.has_pending("chat_1")
        PendingConsents.resolve("chat_1", "yes")
        assert fut.result() == "yes"
        assert not PendingConsents.has_pending("chat_1")

    def test_fifo_ordering(self):
        """Multiple futures for the same chat resolve in FIFO order."""
        f1: Future[str] = Future()
        f2: Future[str] = Future()
        f3: Future[str] = Future()

        PendingConsents.add("chat_1", f1)
        PendingConsents.add("chat_1", f2)
        PendingConsents.add("chat_1", f3)

        PendingConsents.resolve("chat_1", "yes")
        assert f1.result() == "yes"
        assert not f2.done()
        assert not f3.done()

        PendingConsents.resolve("chat_1", "no")
        assert f2.result() == "no"

        PendingConsents.resolve("chat_1", "yes_all")
        assert f3.result() == "yes_all"

        assert not PendingConsents.has_pending("chat_1")

    def test_resolve_empty_returns_false(self):
        assert not PendingConsents.resolve("no_such_chat", "yes")

    def test_resolve_done_future_returns_false(self):
        """If the front Future is already done (e.g. timed out), resolve returns False."""
        fut: Future[str] = Future()
        fut.set_result("timed_out")
        PendingConsents.add("chat_1", fut)

        assert not PendingConsents.resolve("chat_1", "yes")

    def test_different_chats_are_independent(self):
        fa: Future[str] = Future()
        fb: Future[str] = Future()
        PendingConsents.add("chat_a", fa)
        PendingConsents.add("chat_b", fb)

        PendingConsents.resolve("chat_a", "no")
        assert fa.result() == "no"
        assert not fb.done()
        assert PendingConsents.has_pending("chat_b")


# ---------------------------------------------------------------------------
# BotConsentGate – returns str (not bool)
# ---------------------------------------------------------------------------


class TestBotConsentGateReturnType:
    def test_request_sync_returns_string_on_timeout(self):
        """BotConsentGate.request_sync must return 'no' (str) when consent times out."""
        import asyncio

        loop = asyncio.new_event_loop()
        # Run the loop in a background thread so run_coroutine_threadsafe works
        loop_thread = threading.Thread(target=loop.run_forever, daemon=True)
        loop_thread.start()

        async def fake_send(**kwargs):
            return None

        messaging = MagicMock()
        messaging.send_message = fake_send

        gate = BotConsentGate(
            chat_id="chat_1",
            messaging_client=messaging,
            loop=loop,
            provider="telegram",
        )

        req = ConsentRequest(tool_name="shell", kwargs={"command": "ls"})

        # No one calls resolve, so the consent future will time out → "no"
        result = gate.request_sync(req, timeout=0.2)
        assert isinstance(result, str)
        assert result == "no"

        loop.call_soon_threadsafe(loop.stop)
        loop_thread.join(timeout=2)
        loop.close()

    def test_request_sync_returns_resolved_value(self):
        """BotConsentGate.request_sync returns the value resolved by PendingConsents."""
        import asyncio

        PendingConsents._pending.clear()

        loop = asyncio.new_event_loop()
        loop_thread = threading.Thread(target=loop.run_forever, daemon=True)
        loop_thread.start()

        async def fake_send(**kwargs):
            return None

        messaging = MagicMock()
        messaging.send_message = fake_send

        gate = BotConsentGate(
            chat_id="chat_2",
            messaging_client=messaging,
            loop=loop,
            provider="telegram",
        )

        req = ConsentRequest(tool_name="file_read", kwargs={"path": "/tmp"})

        # Resolve from another thread after a short delay
        def resolver():
            import time

            time.sleep(0.1)
            PendingConsents.resolve("chat_2", "yes_all")

        t = threading.Thread(target=resolver, daemon=True)
        t.start()

        result = gate.request_sync(req, timeout=2.0)
        assert result == "yes_all"

        t.join(timeout=2)
        loop.call_soon_threadsafe(loop.stop)
        loop_thread.join(timeout=2)
        loop.close()
