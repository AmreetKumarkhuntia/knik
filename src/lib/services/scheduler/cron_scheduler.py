import asyncio
from datetime import UTC, datetime

from imports import printer as logger
from lib.core.config import Config
from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.workflow_engine import WorkflowEngine


class CronScheduler:
    """Background service that polls the DB for Schedules and triggers Workflows."""

    def __init__(self, ai_client=None):
        self.ai_client = ai_client
        self._running = False
        self._task: asyncio.Task | None = None
        self.config = Config()
        self.engine = WorkflowEngine(ai_client=self.ai_client)

        self._last_run_map: dict[int, datetime] = {}

    def start(self):
        """Start the background poll loop."""
        if self._running:
            return
        logger.info("Starting CronScheduler background loop...")
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())

    def stop(self):
        """Stop the background loop gracefully."""
        if not self._running:
            return
        logger.info("Stopping CronScheduler background loop...")
        self._running = False
        if self._task:
            self._task.cancel()

    async def _poll_loop(self):
        interval = self.config.scheduler_check_interval

        while self._running:
            try:
                await self._check_schedules()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"CronScheduler loop error: {e}")

            await asyncio.sleep(interval)

    async def _check_schedules(self):
        now = datetime.now(UTC)
        current_minute = now.replace(second=0, microsecond=0)

        schedules = await SchedulerDB.list_schedules()

        for schedule in schedules:
            try:
                # We skip evaluating if it ran successfully already this minute
                last_run = self._last_run_map.get(schedule.id)
                if last_run and last_run >= current_minute:
                    continue

                # Run the trigger workflow dynamically
                trigger_wf = await SchedulerDB.get_workflow(schedule.trigger_workflow_id)
                if not trigger_wf:
                    logger.error(
                        f"Trigger workflow {schedule.trigger_workflow_id} not found for schedule {schedule.id}"
                    )
                    continue

                # Execute trigger workflow. We inject current_minute so its logic can evaluate if needed
                logger.info(f"Evaluating schedule ID {schedule.id} -> trigger workflow {schedule.trigger_workflow_id}")
                result = await self.engine.execute_workflow(
                    trigger_wf, inputs={"current_minute": current_minute.isoformat()}
                )

                # Check if it signaled to trigger the target
                should_trigger = False
                for _node_id, output in result.items():
                    if isinstance(output, dict) and output.get("trigger_target") is True:
                        should_trigger = True
                        break

                if should_trigger:
                    logger.info(
                        f"Trigger workflow signaled execution! Triggering Target Workflow ID {schedule.workflow_id}"
                    )
                    asyncio.create_task(self._trigger_workflow(schedule.workflow_id))
                    await SchedulerDB.record_schedule_execution(schedule.id)
                    self._last_run_map[schedule.id] = current_minute
                else:
                    logger.debug(f"Trigger workflow {schedule.trigger_workflow_id} did not signal execution.")

            except Exception as e:
                logger.error(f"Error evaluating schedule {schedule.id}: {e}")

    async def _trigger_workflow(self, workflow_id: str):
        """Background trigger wrapper to prevent failing the loop on unhandled DAG faults."""
        try:
            workflow = await SchedulerDB.get_workflow(workflow_id)
            if not workflow:
                logger.error(f"Scheduled Workflow {workflow_id} not found locally.")
                return

            logger.info(f"Triggering Workflow from Cron: {workflow.name}")
            await self.engine.execute_workflow(workflow)
        except Exception as e:
            logger.error(f"Workflow {workflow_id} failed from Cron Trigger: {e}")
