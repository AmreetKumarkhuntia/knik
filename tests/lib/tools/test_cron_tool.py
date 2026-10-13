"""Tests for CronTool: cron schedule listing, creation, and removal."""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from lib.services.ai_client.base_tool import BaseTool
from lib.tools import cron_tool as _cron_tool_mod
from lib.tools.cron_tool import CronTool


# ---------------------------------------------------------------------------
# Helpers / Fixtures
# ---------------------------------------------------------------------------


def _make_schedule(
    id=1,
    target_workflow_id="wf-1",
    schedule_description="daily at 9am",
    next_run_at=None,
    recurrence_seconds=86400,
    enabled=True,
):
    """Return a MagicMock that behaves like a schedule model object."""
    s = MagicMock()
    s.id = id
    s.target_workflow_id = target_workflow_id
    s.schedule_description = schedule_description
    s.next_run_at = next_run_at
    s.recurrence_seconds = recurrence_seconds
    s.enabled = enabled
    return s


@pytest.fixture(autouse=True)
def _clear_base_tool_instances(monkeypatch):
    """Reset BaseTool._instances for each test so tests don't leak."""
    monkeypatch.setattr(BaseTool, "_instances", [])


@pytest.fixture(autouse=True)
def _mock_schedule_service(monkeypatch):
    """Replace schedule_service on the loaded cron_tool module with a fresh MagicMock.

    This ensures each test gets a clean MagicMock regardless of what the module
    captured at import time (which may be the real service or another test's stub).
    """
    mock_svc = MagicMock()
    monkeypatch.setattr(_cron_tool_mod, "schedule_service", mock_svc)


@pytest.fixture
def cron_tool():
    """Fresh CronTool instance."""
    return CronTool()


# ===========================================================================
# A. _list_cron_schedules tests
# ===========================================================================


class TestListCronSchedules:
    """Tests for the static _list_cron_schedules method."""

    @patch("lib.tools.cron_tool.run_async")
    def test_empty_list_returns_no_schedules(self, mock_run_async, cron_tool):
        """Returns empty list and total=0 when no schedules exist."""
        mock_run_async.return_value = []

        result = cron_tool._list_cron_schedules()

        assert result["success"] is True
        assert result["schedules"] == []
        assert result["total"] == 0

    @patch("lib.tools.cron_tool.run_async")
    def test_returns_serialized_schedule_with_all_fields(self, mock_run_async, cron_tool):
        """Returns a list of serialized schedules with all expected fields present."""
        dt = datetime(2025, 6, 15, 9, 0, 0)
        schedule = _make_schedule(
            id=42,
            target_workflow_id="wf-abc",
            schedule_description="every Monday at 2pm",
            next_run_at=dt,
            recurrence_seconds=604800,
            enabled=True,
        )
        mock_run_async.return_value = [schedule]

        result = cron_tool._list_cron_schedules()

        assert result["success"] is True
        assert len(result["schedules"]) == 1
        s = result["schedules"][0]
        assert s["id"] == 42
        assert s["target_workflow_id"] == "wf-abc"
        assert s["schedule_description"] == "every Monday at 2pm"
        assert s["next_run_at"] == dt.isoformat()
        assert s["recurrence_seconds"] == 604800
        assert s["enabled"] is True

    @patch("lib.tools.cron_tool.run_async")
    def test_next_run_at_none_serializes_as_none(self, mock_run_async, cron_tool):
        """Schedule with next_run_at=None serializes the field as None."""
        schedule = _make_schedule(next_run_at=None)
        mock_run_async.return_value = [schedule]

        result = cron_tool._list_cron_schedules()

        assert result["schedules"][0]["next_run_at"] is None

    @patch("lib.tools.cron_tool.run_async")
    def test_next_run_at_datetime_serializes_to_isoformat(self, mock_run_async, cron_tool):
        """Schedule with a datetime next_run_at serializes to isoformat string."""
        dt = datetime(2025, 12, 25, 0, 0, 0)
        schedule = _make_schedule(next_run_at=dt)
        mock_run_async.return_value = [schedule]

        result = cron_tool._list_cron_schedules()

        assert result["schedules"][0]["next_run_at"] == "2025-12-25T00:00:00"

    @patch("lib.tools.cron_tool.run_async")
    def test_multiple_schedules_returns_correct_total(self, mock_run_async, cron_tool):
        """Multiple schedules are returned with the correct total count."""
        schedules = [
            _make_schedule(id=1, target_workflow_id="wf-1", schedule_description="daily at 9am"),
            _make_schedule(id=2, target_workflow_id="wf-2", schedule_description="every hour"),
            _make_schedule(id=3, target_workflow_id="wf-3", schedule_description="weekly on Friday"),
        ]
        mock_run_async.return_value = schedules

        result = cron_tool._list_cron_schedules()

        assert result["success"] is True
        assert result["total"] == 3
        assert len(result["schedules"]) == 3
        returned_ids = [s["id"] for s in result["schedules"]]
        assert returned_ids == [1, 2, 3]

    @patch("lib.tools.cron_tool.run_async")
    def test_exception_returns_error_dict(self, mock_run_async, cron_tool):
        """Exception from run_async returns an error dict."""
        mock_run_async.side_effect = RuntimeError("database connection failed")

        result = cron_tool._list_cron_schedules()

        assert "error" in result
        assert "Failed to list schedules" in result["error"]
        assert "database connection failed" in result["error"]


# ===========================================================================
# B. _add_cron_schedule tests
# ===========================================================================


class TestAddCronSchedule:
    """Tests for the static _add_cron_schedule method."""

    @patch("lib.tools.cron_tool.run_async")
    def test_successful_creation_returns_result(self, mock_run_async, cron_tool):
        """Successful creation returns the result dict from run_async."""
        expected = {"success": True, "schedule_id": 7, "next_run_at": "2025-07-01T09:00:00"}
        mock_run_async.return_value = expected

        result = cron_tool._add_cron_schedule("wf-123", "daily at 9am")

        assert result is expected

    @patch("lib.tools.cron_tool.run_async")
    def test_passes_correct_args_to_create_schedule(self, mock_run_async, cron_tool):
        """Verifies schedule_service.create_schedule is called with the correct arguments."""
        mock_run_async.return_value = {"success": True}

        cron_tool._add_cron_schedule("wf-abc", "every 6 hours", "America/New_York")

        # run_async is called with the coroutine from schedule_service.create_schedule(...)
        mock_run_async.assert_called_once()
        # The argument to run_async is the return value of schedule_service.create_schedule(...)
        _cron_tool_mod.schedule_service.create_schedule.assert_called_once_with(
            "wf-abc", "every 6 hours", "America/New_York"
        )

    @patch("lib.tools.cron_tool.run_async")
    def test_default_timezone_is_utc(self, mock_run_async, cron_tool):
        """When timezone is not specified, defaults to 'UTC'."""
        mock_run_async.return_value = {"success": True}

        cron_tool._add_cron_schedule("wf-xyz", "every Monday at 2pm")

        _cron_tool_mod.schedule_service.create_schedule.assert_called_once_with("wf-xyz", "every Monday at 2pm", "UTC")

    @patch("lib.tools.cron_tool.run_async")
    def test_custom_timezone_passed_through(self, mock_run_async, cron_tool):
        """Custom timezone is passed through to schedule_service.create_schedule."""
        mock_run_async.return_value = {"success": True}

        cron_tool._add_cron_schedule("wf-1", "daily at noon", "Asia/Kolkata")

        _cron_tool_mod.schedule_service.create_schedule.assert_called_once_with("wf-1", "daily at noon", "Asia/Kolkata")

    @patch("lib.tools.cron_tool.run_async")
    def test_exception_returns_error_with_details(self, mock_run_async, cron_tool):
        """Exception returns error dict with both 'error' and 'details' keys."""
        mock_run_async.side_effect = ValueError("invalid schedule description")

        result = cron_tool._add_cron_schedule("wf-bad", "not a real schedule")

        assert "error" in result
        assert "Failed to add schedule" in result["error"]
        assert "invalid schedule description" in result["error"]
        assert "details" in result
        assert result["details"] == "An unexpected error occurred"


# ===========================================================================
# C. _remove_cron_schedule tests
# ===========================================================================


class TestRemoveCronSchedule:
    """Tests for the static _remove_cron_schedule method."""

    @patch("lib.tools.cron_tool.run_async")
    def test_successful_removal_returns_result(self, mock_run_async, cron_tool):
        """Successful removal returns the result dict from run_async."""
        expected = {"success": True, "message": "Schedule 5 removed"}
        mock_run_async.return_value = expected

        result = cron_tool._remove_cron_schedule(5)

        assert result is expected

    @patch("lib.tools.cron_tool.run_async")
    def test_passes_correct_schedule_id_to_delete(self, mock_run_async, cron_tool):
        """Verifies schedule_service.delete_schedule is called with the correct ID."""
        mock_run_async.return_value = {"success": True}

        cron_tool._remove_cron_schedule(42)

        _cron_tool_mod.schedule_service.delete_schedule.assert_called_once_with(42)

    @patch("lib.tools.cron_tool.run_async")
    def test_exception_returns_error_dict(self, mock_run_async, cron_tool):
        """Exception returns an error dict with the failure message."""
        mock_run_async.side_effect = RuntimeError("schedule not found")

        result = cron_tool._remove_cron_schedule(999)

        assert "error" in result
        assert "Failed to remove schedule" in result["error"]
        assert "schedule not found" in result["error"]

    @patch("lib.tools.cron_tool.run_async")
    def test_integer_id_passed_through(self, mock_run_async, cron_tool):
        """Integer schedule_id is passed through correctly without coercion."""
        mock_run_async.return_value = {"success": True}

        cron_tool._remove_cron_schedule(0)

        _cron_tool_mod.schedule_service.delete_schedule.assert_called_once_with(0)
        # Confirm it's actually an int
        call_args = _cron_tool_mod.schedule_service.delete_schedule.call_args
        assert isinstance(call_args[0][0], int)


# ===========================================================================
# D. Definitions and implementations tests
# ===========================================================================


class TestDefinitionsAndImplementations:
    """Verify tool registration metadata."""

    def test_get_definitions_returns_three_definitions(self, cron_tool):
        """get_definitions returns exactly 3 tool definitions."""
        defs = cron_tool.get_definitions()

        assert len(defs) == 3
        names = {d["name"] for d in defs}
        assert names == {"list_cron_schedules", "add_cron_schedule", "remove_cron_schedule"}

    def test_get_implementations_returns_three_entries(self, cron_tool):
        """get_implementations returns a dict with 3 callable entries."""
        impls = cron_tool.get_implementations()

        assert len(impls) == 3
        assert set(impls.keys()) == {"list_cron_schedules", "add_cron_schedule", "remove_cron_schedule"}
        for key, func in impls.items():
            assert callable(func), f"{key} is not callable"

    def test_name_property_returns_cron(self, cron_tool):
        """The name property returns 'cron'."""
        assert cron_tool.name == "cron"
