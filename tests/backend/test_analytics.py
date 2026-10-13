"""Analytics presentation: date ranges, camelCase summaries and activity items built from repository rows."""

from datetime import UTC, datetime, timedelta

import pytest

from backend.analytics import activity_item, execution_summary, executions_page, get_date_range, workflow_summary


def _execution_row(**overrides) -> dict:
    return {
        "id": 7,
        "workflow_id": "w1",
        "workflow_name": "Nightly",
        "status": "success",
        "started_at": datetime(2026, 1, 1, tzinfo=UTC),
        "duration_ms": 120,
        **overrides,
    }


def test_get_date_range():
    start, end = get_date_range("today")
    assert start is not None and end is not None
    assert (start.hour, start.minute, start.second, start.microsecond) == (0, 0, 0, 0)
    assert start.date() == end.date()

    start, end = get_date_range("7days")
    assert start is not None and end is not None
    assert end - start == timedelta(days=7)

    assert get_date_range("all") == (None, None)
    with pytest.raises(ValueError, match="Invalid time_range"):
        get_date_range("yesterday")


def test_summaries_use_camel_case_keys():
    started = datetime(2026, 1, 1, tzinfo=UTC)
    assert workflow_summary(
        {"id": "w1", "name": "Nightly", "last_executed_at": started, "total_executions": 3, "status": "active"}
    ) == {"id": "w1", "name": "Nightly", "lastExecutedAt": started, "totalExecutions": 3, "status": "active"}
    assert execution_summary(_execution_row()) == {
        "id": 7,
        "workflowId": "w1",
        "workflowName": "Nightly",
        "status": "success",
        "startedAt": started,
        "durationMs": 120,
    }


def test_executions_page_keeps_key_order():
    page = {"executions": [_execution_row()], "total": 1, "page": 1, "page_size": 50, "total_pages": 1}
    presented = executions_page(page)
    assert list(presented) == ["executions", "total", "page", "page_size", "total_pages"]
    assert presented["executions"] == [execution_summary(_execution_row())]


@pytest.mark.parametrize(
    ("activity_type", "status", "expected_type", "expected_title"),
    [
        ("execution", "success", "success", "Nightly Executed Successfully"),
        ("execution", "failed", "error", "Nightly Failed"),
        ("execution", "running", "info", "Nightly Started"),
        ("update", "active", "update", "Nightly Updated"),
    ],
)
def test_activity_item_type_and_title(activity_type, status, expected_type, expected_title):
    timestamp = datetime.now(UTC)
    row = {
        "activity_type": activity_type,
        "id": 7 if activity_type == "execution" else None,
        "workflow_id": "w1",
        "workflow_name": "Nightly",
        "status": status,
        "timestamp": timestamp,
    }
    item = activity_item(row)
    assert (item["type"], item["title"]) == (expected_type, expected_title)
    expected_ref = 7 if activity_type == "execution" else "w1"
    assert item["id"] == f"{activity_type}_{expected_ref}_{timestamp.timestamp()}"


@pytest.mark.parametrize(
    ("age", "expected"),
    [
        (timedelta(seconds=5), "Just now"),
        (timedelta(minutes=5, seconds=10), "5m ago"),
        (timedelta(hours=3, minutes=1), "3h ago"),
        (timedelta(days=2, hours=1), "2d ago"),
    ],
)
def test_activity_item_relative_time(age, expected):
    row = {
        "activity_type": "update",
        "id": None,
        "workflow_id": "w1",
        "workflow_name": "Nightly",
        "status": "active",
        "timestamp": datetime.now(UTC) - age,
    }
    item = activity_item(row)
    assert item["description"] == item["time"] == expected
