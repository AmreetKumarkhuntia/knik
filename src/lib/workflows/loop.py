"""Background CRON scheduler for periodic schedule polling."""

import asyncio
from datetime import UTC, datetime, timedelta

from lib.core.config import Config
from lib.services.db import DB_OUTAGE_ERRORS, ScheduleDB, WorkflowDB
from lib.utils import printer as logger
from lib.workflows.engine import WorkflowEngine


class CronScheduler:
    """Background service that polls the DB for Schedules and triggers Workflows."""

    def __init__(self, engine: WorkflowEngine | None = None):
        """Run due workflows on ``engine``; the default one runs AI nodes without tools."""
        self._running = False
        self._task: asyncio.Task | None = None
        self.config = Config()
        self.engine = engine or WorkflowEngine()

        self._last_run_map: dict[int, datetime] = {}
        self._poll_count = 0
        self._db_unavailable = False

    def start(self):
        """Start the background polling loop."""
        if self._running:
            return
        logger.info("Starting CronScheduler background loop...")
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())

    def stop(self):
        """Stop the background polling loop."""
        if not self._running:
            return
        logger.info("Stopping CronScheduler background loop...")
        self._running = False
        if self._task:
            self._task.cancel()

    async def _poll_loop(self):
        """Main polling loop that periodically checks for due schedules."""
        interval = self.config.scheduler_check_interval
        # Log heartbeat every ~1 minute (or at least every interval)
        heartbeat_frequency = max(1, 60 // interval)

        while self._running:
            self._poll_count += 1
            try:
                schedules = await ScheduleDB.list_schedules(enabled_only=True)
                if self._db_unavailable:
                    self._db_unavailable = False
                    logger.info("CronScheduler: Postgres is reachable again, resuming schedules")
                if self._poll_count % heartbeat_frequency == 0:
                    logger.info(f"CronScheduler heartbeat: {len(schedules)} active schedules polling...")

                await self._check_schedules(schedules)
            except asyncio.CancelledError:
                break
            except DB_OUTAGE_ERRORS as e:
                # Logged once per outage, whether Postgres was down at startup or went away later; the pool
                # reconnects on its own when it is back. Query errors still go to the generic branch below.
                if not self._db_unavailable:
                    self._db_unavailable = True
                    logger.warning(f"CronScheduler: schedules paused, {e}")
            except Exception as e:
                logger.error(f"CronScheduler loop error: {e}")

            await asyncio.sleep(interval)

    async def _check_schedules(self, schedules: list | None = None):
        """Check and trigger schedules that are due."""
        now = datetime.now(UTC)

        if schedules is None:
            schedules = await ScheduleDB.list_schedules(enabled_only=True)

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
                        await ScheduleDB.update_schedule_next_run(schedule.id, next_run)
                        logger.info(f"Schedule ID {schedule.id} next run: {next_run}")

                    await ScheduleDB.record_schedule_execution(schedule.id)

            except Exception as e:
                logger.error(f"Error processing schedule {schedule.id}: {e}")

    async def _trigger_workflow(self, workflow_id: str):
        """Background trigger wrapper to prevent failing the loop on unhandled DAG faults."""
        try:
            workflow = await WorkflowDB.get_workflow(workflow_id)
            if not workflow:
                logger.error(f"Scheduled Workflow {workflow_id} not found locally.")
                return

            logger.info(f"Triggering Workflow from Cron: {workflow.name}")
            await self.engine.execute_workflow(workflow)
        except Exception as e:
            logger.error(f"Workflow {workflow_id} failed from Cron Trigger: {e}")
