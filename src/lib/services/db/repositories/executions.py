"""Workflow executions, their node traces, and the execution analytics queries."""

from datetime import UTC, datetime, timedelta
from typing import Any

from ..connection import PostgresDB
from ..models import ExecutionRecord, NodeExecutionRecord
from .base import json_param, to_model, to_models


class ExecutionDB:
    @staticmethod
    async def create_execution(workflow_id: str, inputs: dict) -> int:
        """Start a 'running' execution and return its id."""
        query = """
            INSERT INTO executions (workflow_id, status, inputs, started_at)
            VALUES (%s, 'running', %s, CURRENT_TIMESTAMP)
            RETURNING id
        """
        return await PostgresDB.fetch_val(query, (workflow_id, json_param(inputs)))

    @staticmethod
    async def complete_execution(
        execution_id: int,
        status: str,
        outputs: dict | None = None,
        error_message: str | None = None,
        duration_ms: int | None = None,
    ) -> None:
        query = """
            UPDATE executions
            SET status = %s,
                outputs = %s,
                error_message = %s,
                completed_at = CURRENT_TIMESTAMP,
                duration_ms = %s
            WHERE id = %s
        """
        outputs_json = json_param(outputs) if outputs else None
        await PostgresDB.execute(query, (status, outputs_json, error_message, duration_ms, execution_id))

    @staticmethod
    async def fail_stale_executions(older_than_seconds: int, error_message: str) -> int:
        """Mark failed every execution still 'running' that started more than `older_than_seconds` ago.

        Returns how many were marked.
        """
        query = """
            UPDATE executions
            SET status = 'failed',
                error_message = %s,
                completed_at = CURRENT_TIMESTAMP
            WHERE status = 'running' AND started_at < CURRENT_TIMESTAMP - make_interval(secs => %s)
        """
        return await PostgresDB.execute(query, (error_message, older_than_seconds))

    @staticmethod
    async def log_node_execution(
        execution_id: int,
        node_id: str,
        node_type: str,
        status: str,
        inputs: dict,
        outputs: dict | None = None,
        error_message: str | None = None,
        duration_ms: int | None = None,
    ) -> None:
        query = """
            INSERT INTO node_executions
            (execution_id, node_id, node_type, status, inputs, outputs, error_message, started_at, completed_at, duration_ms)
            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, %s)
        """
        outputs_json = json_param(outputs) if outputs else None
        await PostgresDB.execute(
            query,
            (execution_id, node_id, node_type, status, json_param(inputs), outputs_json, error_message, duration_ms),
        )

    @staticmethod
    async def get_execution_history(workflow_id: str | None = None) -> list[ExecutionRecord]:
        """The latest 100 executions, optionally of one workflow."""
        if workflow_id:
            rows = await PostgresDB.fetch_all(
                "SELECT * FROM executions WHERE workflow_id = %s ORDER BY started_at DESC LIMIT 100", (workflow_id,)
            )
        else:
            rows = await PostgresDB.fetch_all("SELECT * FROM executions ORDER BY started_at DESC LIMIT 100")
        return to_models(ExecutionRecord.from_row, rows)

    @staticmethod
    async def get_node_executions(execution_id: int) -> list[NodeExecutionRecord]:
        rows = await PostgresDB.fetch_all(
            "SELECT * FROM node_executions WHERE execution_id = %s ORDER BY started_at ASC", (execution_id,)
        )
        return to_models(NodeExecutionRecord.from_row, rows)

    @staticmethod
    async def get_execution_detail(execution_id: int) -> tuple[ExecutionRecord | None, list[NodeExecutionRecord]]:
        """The execution and its node traces in run order; (None, []) when it does not exist."""
        row = await PostgresDB.fetch_one("SELECT * FROM executions WHERE id = %s", (execution_id,))
        execution = to_model(ExecutionRecord.from_row, row)
        if execution is None:
            return None, []
        return execution, await ExecutionDB.get_node_executions(execution_id)

    @staticmethod
    async def get_executions_count(start_date: datetime | None = None, end_date: datetime | None = None) -> int:
        """Executions started in [start_date, end_date]; all of them when start_date is None."""
        if start_date:
            count = await PostgresDB.fetch_val(
                "SELECT COUNT(*) as count FROM executions WHERE started_at >= %s AND started_at <= %s",
                (start_date, end_date),
            )
        else:
            count = await PostgresDB.fetch_val("SELECT COUNT(*) as count FROM executions")
        return count or 0

    @staticmethod
    async def get_active_executions_count() -> int:
        count = await PostgresDB.fetch_val("SELECT COUNT(*) as count FROM executions WHERE status = 'running'")
        return count or 0

    @staticmethod
    async def get_success_rate(start_date: datetime | None = None, end_date: datetime | None = None) -> float:
        """Percentage (0-100, two decimals) of executions with status 'success'; 0.0 when there are none."""
        select = """
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::FLOAT as successful
            FROM executions
        """
        if start_date:
            result = await PostgresDB.fetch_one(
                select + " WHERE started_at >= %s AND started_at <= %s", (start_date, end_date)
            )
        else:
            result = await PostgresDB.fetch_one(select)

        if result and result["total"] > 0:
            return round((result["successful"] / result["total"]) * 100, 2)
        return 0.0

    @staticmethod
    async def get_average_duration(start_date: datetime | None = None, end_date: datetime | None = None) -> float:
        """Mean duration_ms (two decimals) of executions that recorded one; 0.0 when there are none."""
        select = """
            SELECT AVG(duration_ms)::FLOAT as avg_duration
            FROM executions
            WHERE duration_ms IS NOT NULL
        """
        if start_date:
            avg_duration = await PostgresDB.fetch_val(
                select + " AND started_at >= %s AND started_at <= %s", (start_date, end_date)
            )
        else:
            avg_duration = await PostgresDB.fetch_val(select)
        return round(avg_duration or 0, 2)

    @staticmethod
    async def get_recent_executions_summary(limit: int = 100) -> list[dict[str, Any]]:
        """[{id, workflow_id, workflow_name, status, started_at, duration_ms}], newest first."""
        query = """
            SELECT
                e.id,
                e.workflow_id,
                w.name as workflow_name,
                e.status,
                e.started_at,
                e.duration_ms
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            ORDER BY e.started_at DESC
            LIMIT %s
        """
        return await PostgresDB.fetch_all(query, (limit,))

    @staticmethod
    async def get_executions_paginated(
        page: int = 1,
        page_size: int = 50,
        workflow_id: str | None = None,
        status: str | None = None,
    ) -> dict[str, Any]:
        """One page of executions, newest first, as {executions, total, page, page_size, total_pages}.

        Each execution is {id, workflow_id, workflow_name, status, started_at, duration_ms}. A `status` of
        'all' (any case) does not filter.
        """
        where_clauses = []
        params: list[Any] = []

        if workflow_id:
            where_clauses.append("e.workflow_id = %s")
            params.append(workflow_id)

        if status and status.lower() != "all":
            where_clauses.append("e.status = %s")
            params.append(status.lower())

        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        total = await PostgresDB.fetch_val(f"SELECT COUNT(*) as total FROM executions e {where_sql}", tuple(params))
        total = total or 0
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        offset = (page - 1) * page_size

        data_query = f"""
            SELECT
                e.id,
                e.workflow_id,
                w.name as workflow_name,
                e.status,
                e.started_at,
                e.duration_ms
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            {where_sql}
            ORDER BY e.started_at DESC
            LIMIT %s OFFSET %s
        """
        rows = await PostgresDB.fetch_all(data_query, (*params, page_size, offset))

        return {
            "executions": rows,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    async def get_recent_activity(limit: int = 20, hours_back: int = 24) -> list[dict[str, Any]]:
        """Executions started and workflows updated in the last `hours_back` hours, newest first.

        Each row is {activity_type ('execution' | 'update'), id (execution id, None for updates),
        workflow_id, workflow_name, status ('active' for updates), timestamp}.
        """
        start_date = datetime.now(UTC) - timedelta(hours=hours_back)
        query = """
            SELECT
                'execution' as activity_type,
                e.id,
                e.workflow_id,
                w.name as workflow_name,
                e.status,
                e.started_at as timestamp
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE e.started_at >= %s
            UNION ALL
            SELECT
                'update' as activity_type,
                NULL as id,
                w.id as workflow_id,
                w.name as workflow_name,
                'active' as status,
                w.updated_at as timestamp
            FROM workflows w
            WHERE w.updated_at >= %s
            ORDER BY timestamp DESC
            LIMIT %s
        """
        return await PostgresDB.fetch_all(query, (start_date, start_date, limit))
