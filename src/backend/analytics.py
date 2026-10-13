"""Presentation for the analytics routes: named date ranges, camelCase summaries and "5m ago" activity items."""

from datetime import UTC, datetime, timedelta


def get_date_range(time_range: str) -> tuple[datetime | None, datetime | None]:
    """(start, end) in UTC for today, 7days, 30days or 90days; (None, None) for "all" so queries run unbounded."""
    end_date = datetime.now(UTC)
    if time_range == "today":
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "7days":
        start_date = end_date - timedelta(days=7)
    elif time_range == "30days":
        start_date = end_date - timedelta(days=30)
    elif time_range == "90days":
        start_date = end_date - timedelta(days=90)
    elif time_range == "all":
        return None, None
    else:
        raise ValueError(f"Invalid time_range: {time_range}")
    return start_date, end_date


def workflow_summary(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "lastExecutedAt": row["last_executed_at"],
        "totalExecutions": row["total_executions"],
        "status": row["status"],
    }


def execution_summary(row: dict) -> dict:
    return {
        "id": row["id"],
        "workflowId": row["workflow_id"],
        "workflowName": row["workflow_name"],
        "status": row["status"],
        "startedAt": row["started_at"],
        "durationMs": row["duration_ms"],
    }


def executions_page(page: dict) -> dict:
    # Replacing an existing key keeps its position, so the response keeps the repository's key order.
    return {**page, "executions": [execution_summary(r) for r in page["executions"]]}


def activity_item(row: dict) -> dict:
    activity_type = row["activity_type"]
    status = row["status"]

    if activity_type == "execution":
        if status == "success":
            act_type = "success"
            title = f"{row['workflow_name']} Executed Successfully"
        elif status == "failed":
            act_type = "error"
            title = f"{row['workflow_name']} Failed"
        else:
            act_type = "info"
            title = f"{row['workflow_name']} Started"
    else:
        act_type = "update"
        title = f"{row['workflow_name']} Updated"

    time_ago = datetime.now(UTC) - row["timestamp"]
    if time_ago.total_seconds() < 60:
        time_str = "Just now"
    elif time_ago.total_seconds() < 3600:
        time_str = f"{int(time_ago.total_seconds() / 60)}m ago"
    elif time_ago.total_seconds() < 86400:
        time_str = f"{int(time_ago.total_seconds() / 3600)}h ago"
    else:
        time_str = f"{int(time_ago.total_seconds() / 86400)}d ago"

    return {
        "id": f"{activity_type}_{row['id'] or row['workflow_id']}_{row['timestamp'].timestamp()}",
        "type": act_type,
        "title": title,
        "description": time_str,
        "time": time_str,
    }
