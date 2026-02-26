import json

from lib.services.postgres.db import PostgresDB
from lib.services.scheduler.models import ExecutionRecord, Schedule, Workflow


class SchedulerDB:
    """Data access layer for Workflow, Schedule, and executions."""

    @staticmethod
    async def initialize() -> None:
        """Initialize the database pool."""
        await PostgresDB.initialize()

    @staticmethod
    async def create_workflow(workflow: Workflow) -> None:
        """Insert a workflow record."""
        definition_json = json.dumps(workflow.definition)
        query = """
            INSERT INTO workflows (id, name, description, definition)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
                definition = EXCLUDED.definition,
                updated_at = CURRENT_TIMESTAMP
        """
        await PostgresDB.execute(query, (workflow.id, workflow.name, workflow.description, definition_json))

    @staticmethod
    async def get_workflow(workflow_id: str) -> Workflow | None:
        """Retrieve a workflow by ID."""
        query = "SELECT * FROM workflows WHERE id = %s"
        row = await PostgresDB.fetch_one(query, (workflow_id,))
        return Workflow.from_row(row) if row else None

    @staticmethod
    async def list_workflows() -> list[Workflow]:
        """List all workflows."""
        query = "SELECT * FROM workflows ORDER BY created_at DESC"
        rows = await PostgresDB.fetch_all(query)
        return [Workflow.from_row(row) for row in rows]

    @staticmethod
    async def delete_workflow(workflow_id: str) -> None:
        """Delete a workflow."""
        query = "DELETE FROM workflows WHERE id = %s"
        await PostgresDB.execute(query, (workflow_id,))

    @staticmethod
    async def create_schedule(schedule: Schedule) -> int | None:
        """Create a new schedule."""
        query = """
            INSERT INTO schedules (workflow_id, cron_expression, enabled, timezone)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """
        id_val = await PostgresDB.fetch_val(
            query,
            (
                schedule.workflow_id,
                schedule.cron_expression,
                schedule.enabled,
                schedule.timezone,
            ),
        )
        return id_val

    @staticmethod
    async def list_schedules() -> list[Schedule]:
        """List all active schedules."""
        query = "SELECT * FROM schedules WHERE enabled = true"
        rows = await PostgresDB.fetch_all(query)
        return [Schedule.from_row(row) for row in rows]

    @staticmethod
    async def toggle_schedule(schedule_id: int, enabled: bool) -> None:
        """Enable or disable a schedule."""
        query = "UPDATE schedules SET enabled = %s WHERE id = %s"
        await PostgresDB.execute(query, (enabled, schedule_id))

    @staticmethod
    async def delete_schedule(schedule_id: int) -> None:
        """Delete a schedule."""
        query = "DELETE FROM schedules WHERE id = %s"
        await PostgresDB.execute(query, (schedule_id,))

    @staticmethod
    async def create_execution(workflow_id: str, inputs: dict) -> int | None:
        """Start tracking a new execution."""
        inputs_json = json.dumps(inputs)
        query = """
            INSERT INTO executions (workflow_id, status, inputs, started_at)
            VALUES (%s, 'running', %s, CURRENT_TIMESTAMP)
            RETURNING id
        """
        return await PostgresDB.fetch_val(query, (workflow_id, inputs_json))

    @staticmethod
    async def complete_execution(
        execution_id: int,
        status: str,
        outputs: dict | None = None,
        error_message: str | None = None,
        duration_ms: int | None = None,
    ) -> None:
        """Mark an execution as completed or failed."""
        outputs_json = json.dumps(outputs) if outputs else None
        query = """
            UPDATE executions
            SET status = %s,
                outputs = %s,
                error_message = %s,
                completed_at = CURRENT_TIMESTAMP,
                duration_ms = %s
            WHERE id = %s
        """
        await PostgresDB.execute(query, (status, outputs_json, error_message, duration_ms, execution_id))

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
        """Log the execution of an individual node."""
        inputs_json = json.dumps(inputs)
        outputs_json = json.dumps(outputs) if outputs else None
        query = """
            INSERT INTO node_executions
            (execution_id, node_id, node_type, status, inputs, outputs, error_message, started_at, completed_at, duration_ms)
            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, %s)
        """
        await PostgresDB.execute(
            query,
            (
                execution_id,
                node_id,
                node_type,
                status,
                inputs_json,
                outputs_json,
                error_message,
                duration_ms,
            ),
        )

    @staticmethod
    async def get_execution_history(workflow_id: str | None = None) -> list[ExecutionRecord]:
        """Fetch historical executions, optionally scoped to a workflow."""
        if workflow_id:
            query = "SELECT * FROM executions WHERE workflow_id = %s ORDER BY started_at DESC LIMIT 100"
            rows = await PostgresDB.fetch_all(query, (workflow_id,))
        else:
            query = "SELECT * FROM executions ORDER BY started_at DESC LIMIT 100"
            rows = await PostgresDB.fetch_all(query)

        return [ExecutionRecord.from_row(row) for row in rows]
