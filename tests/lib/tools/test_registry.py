"""Tests for ToolRegistry: consent semantics, thread safety, registration from the catalog and shutdown cleanup."""

import gc
import threading
import weakref

import pytest

from lib.services.ai_client.factory import ClientSettings
from lib.tools import registry as registry_mod
from lib.tools.base_tool import BaseTool
from lib.tools.browser_tool import BrowserTool
from lib.tools.consent import ConsentRequest
from lib.tools.index import build_workflow_client, create_tool_registry, get_all_tools, register_all_tools
from lib.tools.registry import ToolRegistry, cleanup_all_tools
from lib.tools.text_tool import TextTool


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _isolated_live_registries(monkeypatch):
    monkeypatch.setattr(registry_mod, "_live_registries", weakref.WeakSet())


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


class CountingTool(BaseTool):
    consent_required_for = frozenset({"shell"})

    @property
    def name(self) -> str:
        return "counting"

    def __init__(self) -> None:
        self.cleanups = 0

    def get_definitions(self):
        return []

    def get_implementations(self):
        return {}

    def cleanup(self) -> None:
        self.cleanups += 1


def _registry_with_tools(*tool_names: str) -> ToolRegistry:
    reg = ToolRegistry()
    for name in tool_names:
        reg.register_tool(
            {"name": name, "description": f"Tool {name}"},
            implementation=lambda **kw: {"ok": True, **kw},
        )
    return reg


# ---------------------------------------------------------------------------
# ToolRegistry.execute_tool – consent semantics
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
# ToolRegistry – thread safety
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
# register_all_tools / create_tool_registry
# ---------------------------------------------------------------------------


def _names(registry: ToolRegistry) -> set[str]:
    return {tool["name"] for tool in registry.get_tools()}


class TestCreateToolRegistry:
    def test_registers_every_implemented_tool(self):
        registry = create_tool_registry()

        assert {"word_count", "run_shell_command", "browser_navigate"} <= _names(registry)
        # browser_screenshot is defined but has no implementation, so it is not offered to the AI.
        assert "browser_screenshot" not in _names(registry)
        assert len(registry.get_tools()) == len(get_all_tools()) - 1

    def test_disabled_tool_names_are_left_out(self):
        registry = create_tool_registry(disabled={"run_shell_command", "word_count"})

        names = _names(registry)
        assert "run_shell_command" not in names
        assert "word_count" not in names
        assert "extract_emails" in names
        assert len(names) == len(_names(create_tool_registry())) - 2

    def test_a_group_with_every_tool_disabled_is_not_kept(self):
        browser_tools = [d["name"] for d in BrowserTool().get_definitions()]

        registry = create_tool_registry(disabled=browser_tools)

        kept = {type(tool) for tool in registry.get_tool_instances()}
        assert BrowserTool not in kept
        assert TextTool in kept

    def test_register_all_tools_returns_the_count(self):
        registry = ToolRegistry()

        count = register_all_tools(registry, disabled=["calculate"])

        assert count == len(registry.get_tools())
        assert "calculate" not in _names(registry)

    def test_consent_gate_is_attached(self):
        gate = StubConsentGate(["no"])
        registry = create_tool_registry(consent_gate=gate)

        result = registry.execute_tool("run_shell_command", command="echo hi")

        assert result == {"error": "Permission denied for run_shell_command"}
        assert gate.call_count == 1

    def test_tools_outside_consent_rules_skip_the_gate(self):
        gate = StubConsentGate([])
        registry = create_tool_registry(consent_gate=gate)

        result = registry.execute_tool("reverse_string", text="abc")

        assert result == "cba"
        assert gate.call_count == 0


def test_workflow_client_gets_a_fresh_tool_registry_only_when_tools_are_wanted():
    settings = ClientSettings(provider="mock")

    first = build_workflow_client(settings, True)
    second = build_workflow_client(settings, True)

    assert isinstance(first.tool_registry, ToolRegistry)
    assert first.tool_registry is not second.tool_registry
    assert len(first.tool_registry.get_tools()) == len(_names(create_tool_registry()))
    assert build_workflow_client(settings, False).tool_registry is None


# ---------------------------------------------------------------------------
# cleanup_tools / cleanup_all_tools
# ---------------------------------------------------------------------------


class TestCleanup:
    def test_cleanup_tools_cleans_owned_tools_and_revokes_approvals(self):
        registry = _registry_with_tools("shell")
        gate = StubConsentGate(["yes_all", "yes"])
        registry.set_consent_gate(gate)
        tool = CountingTool()
        registry.add_tool_instance(tool)
        registry.execute_tool("shell", command="ls")

        registry.cleanup_tools()
        registry.execute_tool("shell", command="ls")

        assert tool.cleanups == 1
        assert gate.call_count == 2

    def test_cleanup_all_tools_reaches_every_live_registry(self):
        first, second = ToolRegistry(), ToolRegistry()
        first_tool, second_tool = CountingTool(), CountingTool()
        first.add_tool_instance(first_tool)
        second.add_tool_instance(second_tool)

        cleanup_all_tools()

        assert (first_tool.cleanups, second_tool.cleanups) == (1, 1)

    def test_a_dropped_registry_is_collected_and_skipped(self):
        kept = ToolRegistry()
        kept_tool = CountingTool()
        kept.add_tool_instance(kept_tool)

        dropped = ToolRegistry()
        dropped_tool = CountingTool()
        dropped.add_tool_instance(dropped_tool)
        dropped_ref = weakref.ref(dropped)
        del dropped
        gc.collect()

        cleanup_all_tools()

        assert dropped_ref() is None
        assert list(registry_mod._live_registries) == [kept]
        assert (kept_tool.cleanups, dropped_tool.cleanups) == (1, 0)

    def test_registry_holding_langchain_tools_is_still_collected(self):
        registry = create_tool_registry(disabled=[d["name"] for d in BrowserTool().get_definitions()])
        registry.create_langchain_tools()
        ref = weakref.ref(registry)

        del registry
        gc.collect()

        assert ref() is None

    def test_one_failing_tool_does_not_stop_the_others(self):
        class FailingTool(CountingTool):
            def cleanup(self) -> None:
                raise RuntimeError("boom")

        registry = ToolRegistry()
        good = CountingTool()
        registry.add_tool_instance(FailingTool())
        registry.add_tool_instance(good)

        cleanup_all_tools()

        assert good.cleanups == 1
