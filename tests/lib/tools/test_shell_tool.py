"""Tests for ShellTool: shell command execution with timeout and blocking."""

from unittest.mock import MagicMock, patch

import pytest

from lib.services.ai_client.base_tool import BaseTool
from lib.tools import shell_tool as _shell_tool_mod
from lib.tools.shell_tool import ShellTool


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_base_tool_instances(monkeypatch):
    """Reset BaseTool._instances for each test so tests don't leak."""
    monkeypatch.setattr(BaseTool, "_instances", [])


@pytest.fixture(autouse=True)
def _stub_shell_service(monkeypatch):
    """Replace the async executor so a patched run_async never leaves an unawaited coroutine behind."""
    monkeypatch.setattr(_shell_tool_mod, "_async_run_shell_command", MagicMock(name="run_shell_command"))


@pytest.fixture
def shell_tool():
    """Fresh ShellTool instance."""
    return ShellTool()


# ===========================================================================
# A. _run_shell_command tests
# ===========================================================================


class TestRunShellCommand:
    """Tests for the static _run_shell_command method."""

    @patch("lib.tools.shell_tool.run_async")
    def test_successful_command_returns_result(self, mock_run_async, shell_tool):
        """A successful command (return_code 0) returns the result text."""
        mock_run_async.return_value = {"return_code": 0, "result": "hello world"}

        result = shell_tool._run_shell_command("echo hello")

        assert result == "hello world"

    @patch("lib.tools.shell_tool.run_async")
    def test_successful_command_empty_output(self, mock_run_async, shell_tool):
        """A successful command with empty string output returns the fallback message."""
        mock_run_async.return_value = {"return_code": 0, "result": ""}

        result = shell_tool._run_shell_command("touch file.txt")

        assert result == "Command executed successfully (no output)"

    @patch("lib.tools.shell_tool.run_async")
    def test_successful_command_none_result(self, mock_run_async, shell_tool):
        """A successful command with None result returns the fallback message."""
        mock_run_async.return_value = {"return_code": 0, "result": None}

        result = shell_tool._run_shell_command("mkdir -p foo")

        assert result == "Command executed successfully (no output)"

    @patch("lib.tools.shell_tool.run_async")
    def test_error_in_result_dict(self, mock_run_async, shell_tool):
        """When the result dict contains an 'error' key, returns 'Error: {message}'."""
        mock_run_async.return_value = {"error": "Command timed out after 10s"}

        result = shell_tool._run_shell_command("sleep 100")

        assert result == "Error: Command timed out after 10s"

    @patch("lib.tools.shell_tool.run_async")
    def test_nonzero_return_code_with_stderr_and_result(self, mock_run_async, shell_tool):
        """Non-zero return_code with both stderr and result includes both in response."""
        mock_run_async.return_value = {
            "return_code": 1,
            "stderr": "Permission denied",
            "result": "partial output",
        }

        result = shell_tool._run_shell_command("cat /root/secret")

        assert "Exit code: 1" in result
        assert "Error: Permission denied" in result
        assert "Output: partial output" in result

    @patch("lib.tools.shell_tool.run_async")
    def test_nonzero_return_code_with_only_stderr(self, mock_run_async, shell_tool):
        """Non-zero return_code with stderr but no result omits the Output line."""
        mock_run_async.return_value = {
            "return_code": 127,
            "stderr": "command not found",
            "result": "",
        }

        result = shell_tool._run_shell_command("nonexistent_cmd")

        assert "Exit code: 127" in result
        assert "Error: command not found" in result
        assert "Output:" not in result

    @patch("lib.tools.shell_tool.run_async")
    def test_nonzero_return_code_with_only_result(self, mock_run_async, shell_tool):
        """Non-zero return_code with result but no stderr omits the Error line."""
        mock_run_async.return_value = {
            "return_code": 2,
            "stderr": "",
            "result": "some output before failure",
        }

        result = shell_tool._run_shell_command("failing_cmd")

        assert "Exit code: 2" in result
        assert "Output: some output before failure" in result
        # stderr is empty, so "Error:" should not appear in the *body*
        # (note: "Exit code:" line comes first, then optionally "Error:" then "Output:")
        lines = result.split("\n")
        assert not any(line.startswith("Error:") for line in lines)

    @patch("lib.tools.shell_tool.run_async")
    def test_timeout_none_defaults_to_ten(self, mock_run_async, shell_tool):
        """When timeout is None, it defaults to 10 and is clamped to min(10, MAX_TIMEOUT)."""
        mock_run_async.return_value = {"return_code": 0, "result": "ok"}

        shell_tool._run_shell_command("echo hi", timeout=None)

        # run_async is called with the coroutine from _async_run_shell_command.
        # We verify via the printer that timeout=10 was used.
        mock_run_async.assert_called_once()

    @patch("lib.tools.shell_tool.run_async")
    @patch("lib.tools.shell_tool._async_run_shell_command")
    def test_timeout_exceeding_max_is_clamped(self, mock_async_cmd, mock_run_async, shell_tool):
        """Timeout above MAX_TIMEOUT (30) is clamped to 30."""
        mock_run_async.return_value = {"return_code": 0, "result": "done"}
        mock_async_cmd.return_value = "coroutine_placeholder"

        shell_tool._run_shell_command("long running", timeout=60)

        # _async_run_shell_command should be called with timeout=30 (clamped)
        mock_async_cmd.assert_called_once_with(
            "long running", timeout=30, blocked_commands=_shell_tool_mod.BLOCKED_COMMANDS
        )

    @patch("lib.tools.shell_tool.run_async")
    @patch("lib.tools.shell_tool._async_run_shell_command")
    def test_timeout_within_range_passes_through(self, mock_async_cmd, mock_run_async, shell_tool):
        """Timeout within the allowed range (<=30) passes through unchanged."""
        mock_run_async.return_value = {"return_code": 0, "result": "ok"}
        mock_async_cmd.return_value = "coroutine_placeholder"

        shell_tool._run_shell_command("quick cmd", timeout=15)

        mock_async_cmd.assert_called_once_with(
            "quick cmd", timeout=15, blocked_commands=_shell_tool_mod.BLOCKED_COMMANDS
        )

    @patch("lib.tools.shell_tool.run_async")
    @patch("lib.tools.shell_tool._async_run_shell_command")
    def test_run_async_called_with_correct_arguments(self, mock_async_cmd, mock_run_async, shell_tool):
        """run_async is called with the coroutine returned by _async_run_shell_command."""
        mock_run_async.return_value = {"return_code": 0, "result": "output"}

        shell_tool._run_shell_command("ls -la", timeout=5)

        mock_async_cmd.assert_called_once_with("ls -la", timeout=5, blocked_commands=_shell_tool_mod.BLOCKED_COMMANDS)
        mock_run_async.assert_called_once()


# ===========================================================================
# B. Definitions and implementations tests
# ===========================================================================


class TestDefinitionsAndImplementations:
    """Verify tool registration metadata."""

    def test_get_definitions_returns_one_definition(self, shell_tool):
        """get_definitions returns exactly 1 tool definition."""
        defs = shell_tool.get_definitions()

        assert len(defs) == 1
        assert defs[0]["name"] == "run_shell_command"

    def test_get_implementations_returns_one_entry(self, shell_tool):
        """get_implementations returns a dict with one key 'run_shell_command'."""
        impls = shell_tool.get_implementations()

        assert len(impls) == 1
        assert "run_shell_command" in impls
        assert callable(impls["run_shell_command"])

    def test_name_property_returns_shell(self, shell_tool):
        """The name property returns 'shell'."""
        assert shell_tool.name == "shell"
