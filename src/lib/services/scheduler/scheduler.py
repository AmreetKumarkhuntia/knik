from typing import Any

from imports import printer as logger
from lib.services.scheduler.cron_scheduler import CronScheduler
from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Schedule, Workflow
from lib.services.scheduler.workflow_engine import WorkflowEngine


class Scheduler:
    """Main orchestrator for the Workflow Scheduler system."""

    def __init__(self):
        self.workflow_engine = WorkflowEngine()
        self.cron_scheduler = CronScheduler()
        self._running = False

    async def register_workflow(self, workflow: Workflow) -> bool:
        """Register a workflow for execution."""
        try:
            await SchedulerDB.create_workflow(workflow)
            logger.info(f"Registered workflow: {workflow.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to register workflow {workflow.id}: {e}")
            return False

    async def get_workflow(self, workflow_id: str) -> Workflow | None:
        """Retrieve a specific workflow."""
        return await SchedulerDB.get_workflow(workflow_id)

    async def unregister_workflow(self, workflow_id: str) -> bool:
        """Unregister a workflow and delete its schedules/history."""
        try:
            await SchedulerDB.delete_workflow(workflow_id)
            logger.info(f"Unregistered workflow: {workflow_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to unregister workflow {workflow_id}: {e}")
            return False

    async def add_schedule(self, schedule: Schedule) -> int | None:
        """Add a cron schedule."""
        schedule_id = await SchedulerDB.create_schedule(schedule)
        if schedule_id:
            logger.info(f"Added schedule ID {schedule_id} with target workflow {schedule.target_workflow_id}")
        return schedule_id

    async def remove_schedule(self, schedule_id: int) -> bool:
        """Remove a cron schedule."""
        try:
            await SchedulerDB.delete_schedule(schedule_id)
            logger.info(f"Removed schedule ID {schedule_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to remove schedule {schedule_id}: {e}")
            return False

    async def execute_workflow(self, workflow_id: str, inputs: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute a workflow manually by ID."""
        logger.info(f"Manual execution triggered for workflow: {workflow_id}")
        workflow = await self.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found.")

        result = await self.workflow_engine.execute_workflow(workflow, inputs)
        return result

    def start(self) -> None:
        """Start the background cron loop."""
        if not self._running:
            self.cron_scheduler.start()
            self._running = True

    def stop(self) -> None:
        """Stop the background cron loop."""
        if self._running:
            self.cron_scheduler.stop()
            self._running = False

    def is_running(self) -> bool:
        """Check if the scheduler is running."""
        return self._running
