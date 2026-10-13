"""Workflow scheduler facade: runs workflows on demand and, while started, from their schedules.

Creating, changing and deleting workflows and schedules goes through ``workflow_service`` and
``schedule_service``; this class only runs them.
"""

from typing import Any

from lib.utils import printer as logger
from lib.workflows import workflow_service
from lib.workflows.engine import WorkflowEngine
from lib.workflows.errors import NotFoundError
from lib.workflows.loop import CronScheduler
from lib.workflows.nodes import AIClientFactory


class Scheduler:
    """One engine, shared by manual runs and the schedule polling loop."""

    def __init__(self, ai_client_factory: AIClientFactory | None = None):
        """``ai_client_factory`` builds the client for AI nodes; without one they run without tools."""
        self.workflow_engine = WorkflowEngine(ai_client_factory)
        self.cron_scheduler = CronScheduler(self.workflow_engine)

    async def run(self, workflow_id: str, inputs: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute a workflow now and return its node outputs.

        Raises:
            NotFoundError: no workflow has this id.
        """
        logger.info(f"Manual execution triggered for workflow: {workflow_id}")
        workflow = await workflow_service.get_workflow(workflow_id)
        if not workflow:
            raise NotFoundError(f"Workflow {workflow_id} not found.", workflow_id=workflow_id)

        return await self.workflow_engine.execute_workflow(workflow, inputs)

    def start(self) -> None:
        """Start polling for due schedules; a no-op while already started."""
        self.cron_scheduler.start()

    def stop(self) -> None:
        """Stop polling for due schedules; a no-op while stopped."""
        self.cron_scheduler.stop()
