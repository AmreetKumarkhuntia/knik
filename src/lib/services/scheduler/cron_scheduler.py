import asyncio
from datetime import UTC, datetime

from croniter import croniter

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

        picked_up = 0
        skipped = 0

        for schedule in schedules:
            try:
                last_run = self._last_run_map.get(schedule.id)
                if last_run and last_run >= current_minute:
                    skipped += 1
                    continue

                if croniter.match(schedule.cron_expression, current_minute):
                    logger.info(f"Cron match for Schedule ID {schedule.id} -> Workflow ID {schedule.workflow_id}")
                    asyncio.create_task(self._trigger_workflow(schedule.workflow_id))
                    self._last_run_map[schedule.id] = current_minute
                    picked_up += 1
                else:
                    skipped += 1

            except Exception as e:
                logger.error(f"Error evaluating schedule {schedule.id}: {e}")
                skipped += 1

        if schedules:
            logger.info(f"Evaluated {len(schedules)} schedules: picked up {picked_up}, skipped {skipped}")

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
