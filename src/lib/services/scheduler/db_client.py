import json
from datetime import UTC, datetime, timedelta

from lib.services.postgres.db import PostgresDB
from lib.services.scheduler.models import ExecutionRecord, NodeExecutionRecord, Schedule, Workflow
from lib.utils import printer


is_initialized = False


class SchedulerDB:
    """Data access layer for Workflow, Schedule, and executions."""

    @staticmethod
    async def initialize() -> None:
        """Initialize the database pool."""
        global is_initialized
        if is_initialized:
            return
        printer.info("Initializing SchedulerDB connection pool...")
        await PostgresDB.initialize()
        is_initialized = True

    @staticmethod
    async def check_initialized() -> None:
        """Check if the database has been initialized."""
        if not is_initialized:
            await SchedulerDB.initialize()

    @staticmethod
    async def create_workflow(workflow: Workflow) -> None:
        """Insert a workflow record."""
        await SchedulerDB.check_initialized()
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
        await SchedulerDB.check_initialized()
        query = "SELECT * FROM workflows WHERE id = %s"
        row = await PostgresDB.fetch_one(query, (workflow_id,))
        return Workflow.from_row(row) if row else None

    @staticmethod
    async def list_workflows() -> list[Workflow]:
        """List all workflows."""
        await SchedulerDB.check_initialized()
        query = "SELECT * FROM workflows ORDER BY created_at DESC"
        rows = await PostgresDB.fetch_all(query)
        return [Workflow.from_row(row) for row in rows]

    @staticmethod
    async def delete_workflow(workflow_id: str) -> None:
        """Delete a workflow."""
        await SchedulerDB.check_initialized()
        query = "DELETE FROM workflows WHERE id = %s"
        await PostgresDB.execute(query, (workflow_id,))

    @staticmethod
    async def create_schedule(schedule: Schedule) -> int | None:
        """Create a new schedule."""
        await SchedulerDB.check_initialized()
        query = """
            INSERT INTO schedules (
                target_workflow_id,
                enabled,
                timezone,
                schedule_description,
                next_run_at,
                recurrence_seconds,
                created_at,
                updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """
        id_val = await PostgresDB.fetch_val(
            query,
            (
                schedule.target_workflow_id,
                schedule.enabled,
                schedule.timezone,
                schedule.schedule_description,
                schedule.next_run_at,
                schedule.recurrence_seconds,
            ),
        )
        return id_val

    @staticmethod
    async def update_schedule_next_run(schedule_id: int, next_run_at: datetime) -> None:
        """Update next_run_at for a schedule."""
        await SchedulerDB.check_initialized()
        query = """
            UPDATE schedules
            SET next_run_at = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        await PostgresDB.execute(query, (next_run_at, schedule_id))

    @staticmethod
    async def list_schedules() -> list[Schedule]:
        """List all active schedules."""
        await SchedulerDB.check_initialized()
        query = "SELECT * FROM schedules WHERE enabled = true"
        rows = await PostgresDB.fetch_all(query)
        return [Schedule.from_row(row) for row in rows]

    @staticmethod
    async def toggle_schedule(schedule_id: int, enabled: bool) -> Schedule | None:
        """Enable or disable a schedule."""
        await SchedulerDB.check_initialized()
        query = """
            UPDATE schedules
            SET enabled = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING *
        """
        row = await PostgresDB.fetch_one(query, (enabled, schedule_id))
        return Schedule.from_row(row) if row else None

    @staticmethod
    async def delete_schedule(schedule_id: int) -> None:
        """Delete a schedule."""
        await SchedulerDB.check_initialized()
        query = "DELETE FROM schedules WHERE id = %s"
        await PostgresDB.execute(query, (schedule_id,))

    @staticmethod
    async def create_execution(workflow_id: str, inputs: dict) -> int | None:
        """Start tracking a new execution."""
        await SchedulerDB.check_initialized()
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
        await SchedulerDB.check_initialized()
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
        await SchedulerDB.check_initialized()
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
        await SchedulerDB.check_initialized()
        if workflow_id:
            query = "SELECT * FROM executions WHERE workflow_id = %s ORDER BY started_at DESC LIMIT 100"
            rows = await PostgresDB.fetch_all(query, (workflow_id,))
        else:
            query = "SELECT * FROM executions ORDER BY started_at DESC LIMIT 100"
            rows = await PostgresDB.fetch_all(query)

        return [ExecutionRecord.from_row(row) for row in rows]

    @staticmethod
    async def record_schedule_execution(schedule_id: int) -> None:
        """Record the timestamp when a schedule successfully triggered a target workflow."""
        await SchedulerDB.check_initialized()
        query = (
            "UPDATE schedules SET last_executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
        )
        await PostgresDB.execute(query, (schedule_id,))

    @staticmethod
    async def get_node_executions(execution_id: int) -> list[NodeExecutionRecord]:
        """Fetch all node execution records for a given execution."""
        await SchedulerDB.check_initialized()
        query = "SELECT * FROM node_executions WHERE execution_id = %s ORDER BY started_at ASC"
        rows = await PostgresDB.fetch_all(query, (execution_id,))
        return [NodeExecutionRecord.from_row(row) for row in rows]

    @staticmethod
    def get_date_range(time_range: str) -> tuple[datetime | None, datetime]:
        """Returns (start_date, end_date) tuple for given time range in UTC.

        Supported time ranges: 'today', '7days', '30days', '90days', 'all'
        """
        end_date = datetime.now(UTC)

        ranges = {
            "today": (end_date.replace(hour=0, minute=0, second=0, microsecond=0), end_date),
            "7days": (end_date - timedelta(days=7), end_date),
            "30days": (end_date - timedelta(days=30), end_date),
            "90days": (end_date - timedelta(days=90), end_date),
            "all": (None, end_date),
        }

        return ranges.get(time_range, ranges["today"])

    @staticmethod
    async def get_total_workflows() -> int:
        """Get total count of workflows."""
        await SchedulerDB.check_initialized()
        query = "SELECT COUNT(*) as count FROM workflows"
        result = await PostgresDB.fetch_one(query)
        return result["count"] if result else 0

    @staticmethod
    async def get_executions_count(start_date: datetime | None = None, end_date: datetime | None = None) -> int:
        """Get count of executions within the specified date range."""
        await SchedulerDB.check_initialized()

        if start_date:
            query = "SELECT COUNT(*) as count FROM executions WHERE started_at >= %s AND started_at <= %s"
            result = await PostgresDB.fetch_one(query, (start_date, end_date))
        else:
            query = "SELECT COUNT(*) as count FROM executions"
            result = await PostgresDB.fetch_one(query)

        return result["count"] if result else 0

    @staticmethod
    async def get_success_rate(start_date: datetime | None = None, end_date: datetime | None = None) -> float:
        """Calculate success rate as percentage of successful executions."""
        await SchedulerDB.check_initialized()

        if start_date:
            query = """
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::FLOAT as successful
                FROM executions
                WHERE started_at >= %s AND started_at <= %s
            """
            result = await PostgresDB.fetch_one(query, (start_date, end_date))
        else:
            query = """
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::FLOAT as successful
                FROM executions
            """
            result = await PostgresDB.fetch_one(query)

        if result and result["total"] > 0:
            return round((result["successful"] / result["total"]) * 100, 2)
        return 0.0

    @staticmethod
    async def get_top_workflows(
        limit: int = 10, start_date: datetime | None = None, end_date: datetime | None = None
    ) -> list[dict]:
        """Get top performing workflows sorted by execution count in date range."""
        await SchedulerDB.check_initialized()

        if start_date:
            query = """
                SELECT
                    w.id,
                    w.name,
                    COUNT(e.id) as executions,
                    SUM(CASE WHEN e.status = 'success' THEN 1 ELSE 0 END)::FLOAT /
                        NULLIF(COUNT(e.id), 0) * 100 as success_rate
                FROM workflows w
                LEFT JOIN executions e ON w.id = e.workflow_id
                    AND e.started_at >= %s AND e.started_at <= %s
                GROUP BY w.id, w.name
                HAVING COUNT(e.id) > 0
                ORDER BY executions DESC
                LIMIT %s
            """
            rows = await PostgresDB.fetch_all(query, (start_date, end_date, limit))
        else:
            query = """
                SELECT
                    w.id,
                    w.name,
                    COUNT(e.id) as executions,
                    SUM(CASE WHEN e.status = 'success' THEN 1 ELSE 0 END)::FLOAT /
                        NULLIF(COUNT(e.id), 0) * 100 as success_rate
                FROM workflows w
                LEFT JOIN executions e ON w.id = e.workflow_id
                GROUP BY w.id, w.name
                HAVING COUNT(e.id) > 0
                ORDER BY executions DESC
                LIMIT %s
            """
            rows = await PostgresDB.fetch_all(query, (limit,))

        return [
            {
                "id": row["id"],
                "name": row["name"],
                "executions": row["executions"],
                "success_rate": round(row["success_rate"] or 0, 2),
            }
            for row in rows
        ]

    @staticmethod
    async def get_recent_activity(limit: int = 20, hours_back: int = 24) -> list[dict]:
        """Get recent activity combining executions and workflow updates."""
        await SchedulerDB.check_initialized()

        start_date = datetime.now(UTC) - timedelta(hours=hours_back)

        query = """
            SELECT
                'execution' as activity_type,
                e.id,
                e.workflow_id,
                e.status,
                e.started_at as timestamp,
                e.error_message,
                w.name as workflow_name
            FROM executions e
            JOIN workflows w ON e.workflow_id = w.id
            WHERE e.started_at >= %s

            UNION ALL

            SELECT
                'update' as activity_type,
                NULL::integer as id,
                w.id as workflow_id,
                'updated' as status,
                w.updated_at as timestamp,
                NULL as error_message,
                w.name as workflow_name
            FROM workflows w
            WHERE w.updated_at >= %s AND w.created_at != w.updated_at

            ORDER BY timestamp DESC
            LIMIT %s
        """

        rows = await PostgresDB.fetch_all(query, (start_date, start_date, limit))

        activities = []
        for row in rows:
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

            activities.append(
                {
                    "id": f"{activity_type}_{row['id'] or row['workflow_id']}_{row['timestamp'].timestamp()}",
                    "type": act_type,
                    "title": title,
                    "description": time_str,
                    "time": time_str,
                }
            )

        return activities
