from typing import Any

from imports import printer as logger
from lib.cron import workflow_service
from lib.cron.cron_scheduler import CronScheduler
from lib.cron.engine import WorkflowEngine
from lib.cron.models import Schedule
from lib.services.scheduler.db_client import SchedulerDB


class Scheduler:
    """Main orchestrator for the Workflow Scheduler system."""

    def __init__(self):
        self.workflow_engine = WorkflowEngine()
        self.cron_scheduler = CronScheduler()
        self._running = False

    async def register_workflow(self, workflow: "Any") -> bool:
        """Register a workflow for execution.

        Delegates to workflow_service.create_workflow for new workflows,
        or directly to SchedulerDB for pre-built Workflow objects.
        """
        try:
            await SchedulerDB.create_workflow(workflow)
            logger.info(f"Registered workflow: {workflow.id}")
            return True
        except Exception as e:
            logger.error(f"Failed to register workflow {workflow.id}: {e}")
            return False

    async def get_workflow(self, workflow_id: str):
        """Retrieve a specific workflow."""
        return await workflow_service.get_workflow(workflow_id)

    async def unregister_workflow(self, workflow_id: str) -> bool:
        """Unregister a workflow and delete its schedules."""
        try:
            result = await workflow_service.delete_workflow(workflow_id, cascade=True)
            if "error" in result:
                logger.error(f"Failed to unregister workflow {workflow_id}: {result['error']}")
                return False
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
