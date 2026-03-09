import asyncio
from datetime import UTC, datetime, timedelta

from imports import printer as logger
from lib.core.config import Config
from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.workflow_engine import WorkflowEngine


class CronScheduler:
    """Background service that polls the DB for Schedules and triggers Workflows."""

    def __init__(self):
        self._running = False
        self._task: asyncio.Task | None = None
        self.config = Config()
        self.engine = WorkflowEngine()

        self._last_run_map: dict[int, datetime] = {}
        self._poll_count = 0

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
        # Log heartbeat every ~1 minute (or at least every interval)
        heartbeat_frequency = max(1, 60 // interval)

        while self._running:
            self._poll_count += 1
            try:
                schedules = await SchedulerDB.list_schedules()
                if self._poll_count % heartbeat_frequency == 0:
                    logger.info(f"CronScheduler heartbeat: {len(schedules)} active schedules polling...")

                await self._check_schedules(schedules)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"CronScheduler loop error: {e}")

            await asyncio.sleep(interval)

    async def _check_schedules(self, schedules: list | None = None):
        now = datetime.now(UTC)

        if schedules is None:
            schedules = await SchedulerDB.list_schedules()

        for schedule in schedules:
            try:
                if not schedule.enabled or not schedule.next_run_at:
                    continue

                if schedule.next_run_at <= now:
                    logger.info(
                        f"Schedule ID {schedule.id} triggered at {schedule.next_run_at}. "
                        f"Executing Target Workflow ID {schedule.target_workflow_id}"
                    )

                    asyncio.create_task(self._trigger_workflow(schedule.target_workflow_id))

                    if schedule.recurrence_seconds:
                        next_run = now + timedelta(seconds=schedule.recurrence_seconds)
                        await SchedulerDB.update_schedule_next_run(schedule.id, next_run)
                        logger.info(f"Schedule ID {schedule.id} next run: {next_run}")

                    await SchedulerDB.record_schedule_execution(schedule.id)

            except Exception as e:
                logger.error(f"Error processing schedule {schedule.id}: {e}")

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
