"""Workflow definitions, plus the per-workflow analytics queries."""

from datetime import datetime
from typing import Any

from ..connection import PostgresDB
from ..models import Workflow
from .base import json_param, to_model, to_models


class WorkflowDB:
    @staticmethod
    async def create_workflow(workflow: Workflow) -> None:
        """Insert the workflow, or overwrite name/description/definition when the id exists."""
        query = """
            INSERT INTO workflows (id, name, description, definition)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                definition = EXCLUDED.definition,
                updated_at = CURRENT_TIMESTAMP
        """
        await PostgresDB.execute(
            query, (workflow.id, workflow.name, workflow.description, json_param(workflow.definition))
        )

    @staticmethod
    async def get_workflow(workflow_id: str) -> Workflow | None:
        row = await PostgresDB.fetch_one("SELECT * FROM workflows WHERE id = %s", (workflow_id,))
        return to_model(Workflow.from_row, row)

    @staticmethod
    async def list_workflows() -> list[Workflow]:
        rows = await PostgresDB.fetch_all("SELECT * FROM workflows ORDER BY created_at DESC")
        return to_models(Workflow.from_row, rows)

    @staticmethod
    async def delete_workflow(workflow_id: str) -> bool:
        return await PostgresDB.execute("DELETE FROM workflows WHERE id = %s", (workflow_id,)) > 0

    @staticmethod
    async def get_workflow_name(workflow_id: str) -> str | None:
        return await PostgresDB.fetch_val("SELECT name FROM workflows WHERE id = %s", (workflow_id,))

    @staticmethod
    async def get_total_workflows() -> int:
        return await PostgresDB.fetch_val("SELECT COUNT(*) AS count FROM workflows") or 0

    @staticmethod
    async def get_workflows_list() -> list[dict[str, Any]]:
        """[{id, name}] sorted by name, for filter dropdowns."""
        return await PostgresDB.fetch_all("SELECT id, name FROM workflows ORDER BY name ASC")

    @staticmethod
    async def get_recent_workflows_summary(limit: int = 20) -> list[dict[str, Any]]:
        """[{id, name, last_executed_at, total_executions, status}], most recently run first.

        `status` is 'active' when the workflow ran in the last 7 days, else 'inactive'.
        """
        query = """
            SELECT
                w.id,
                w.name,
                MAX(e.started_at) as last_executed_at,
                COUNT(e.id) as total_executions,
                CASE
                    WHEN MAX(e.started_at) >= NOW() - INTERVAL '7 days' THEN 'active'
                    ELSE 'inactive'
                END as status
            FROM workflows w
            LEFT JOIN executions e ON w.id = e.workflow_id
            GROUP BY w.id, w.name
            ORDER BY last_executed_at DESC NULLS LAST, w.created_at DESC
            LIMIT %s
        """
        return await PostgresDB.fetch_all(query, (limit,))

    @staticmethod
    async def get_top_workflows(
        limit: int = 10,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """[{id, name, executions, success_rate}] by execution count; counts only runs in the range when given."""
        success_rate_expr = """
            COALESCE(
                ROUND(
                    SUM(CASE WHEN e.status = 'success' THEN 1 ELSE 0 END)::numeric
                    / NULLIF(COUNT(e.id), 0) * 100, 2
                ), 0
            ) as success_rate
        """
        if start_date:
            query = f"""
                SELECT w.id, w.name, COUNT(e.id) as executions, {success_rate_expr}
                FROM workflows w
                LEFT JOIN executions e
                    ON w.id = e.workflow_id
                    AND e.started_at >= %s AND e.started_at <= %s
                GROUP BY w.id, w.name
                ORDER BY executions DESC, w.created_at DESC
                LIMIT %s
            """
            rows = await PostgresDB.fetch_all(query, (start_date, end_date, limit))
        else:
            query = f"""
                SELECT w.id, w.name, COUNT(e.id) as executions, {success_rate_expr}
                FROM workflows w
                LEFT JOIN executions e ON w.id = e.workflow_id
                GROUP BY w.id, w.name
                ORDER BY executions DESC, w.created_at DESC
                LIMIT %s
            """
            rows = await PostgresDB.fetch_all(query, (limit,))

        # ROUND() yields numeric, which psycopg returns as Decimal.
        return [{**row, "success_rate": float(row["success_rate"])} for row in rows]
