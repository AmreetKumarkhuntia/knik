"""Background CRON scheduler for periodic schedule polling."""

import asyncio
import contextlib
from datetime import UTC, datetime

from lib.core.config import Config
from lib.services.db import DB_OUTAGE_ERRORS, ExecutionDB, Schedule, ScheduleDB, WorkflowDB
from lib.utils import printer as logger
from lib.workflows.engine import WorkflowEngine
from lib.workflows.schedule_parser import calculate_next_run


# How long stop() waits for the poll in progress, and then for the cancelled runs to record their executions.
STOP_TIMEOUT = 10.0


class CronScheduler:
    """Background service that polls the DB for Schedules and triggers Workflows."""

    def __init__(self, engine: WorkflowEngine | None = None):
        """Run due workflows on ``engine``; the default one runs AI nodes without tools."""
        self._running = False
        self._task: asyncio.Task | None = None
        self._stopping = asyncio.Event()
        self.config = Config()
        self.engine = engine or WorkflowEngine()

        self._runs: set[asyncio.Task] = set()
        self._run_slots = asyncio.Semaphore(max(1, self.config.scheduler_max_concurrent))
        self._recovered = False
        self._poll_count = 0
        self._db_unavailable = False

    def start(self):
        """Start the background polling loop."""
        if self._running:
            return
        logger.info("Starting CronScheduler background loop...")
        self._running = True
        self._stopping.clear()
        self._task = asyncio.create_task(self._poll_loop())

    async def stop(self) -> None:
        """Stop polling, then cancel the scheduled runs in flight and wait for them to record their executions.

        Each wait is bounded by STOP_TIMEOUT, so an unreachable database cannot hold up shutdown.
        """
        if not self._running:
            return
        logger.info("Stopping CronScheduler background loop...")
        self._running = False
        self._stopping.set()

        if self._task:
            # Let the poll in progress finish instead of cancelling it between claiming an occurrence and starting it.
            _, pending = await asyncio.wait({self._task}, timeout=STOP_TIMEOUT)
            if pending:
                self._task.cancel()

        runs = set(self._runs)
        for run in runs:
            run.cancel()
        if runs:
            _, pending = await asyncio.wait(runs, timeout=STOP_TIMEOUT)
            if pending:
                logger.warning(
                    f"CronScheduler: {len(pending)} cancelled run(s) still not recorded after {STOP_TIMEOUT}s"
                )

    async def _poll_loop(self):
        """Main polling loop that periodically checks for due schedules."""
        interval = self.config.scheduler_check_interval
        # Log heartbeat every ~1 minute (or at least every interval)
        heartbeat_frequency = max(1, 60 // interval)

        while self._running:
            self._poll_count += 1
            try:
                if not self._recovered:
                    await self._fail_abandoned_executions()
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

            await self._sleep(interval)

    async def _sleep(self, seconds: float) -> None:
        """Wait between polls; stop() ends the wait early."""
        with contextlib.suppress(TimeoutError):
            await asyncio.wait_for(self._stopping.wait(), seconds)

    async def _fail_abandoned_executions(self) -> None:
        """Mark failed the executions a stopped worker left 'running'.

        Only those older than the staleness threshold: the backend records its manual runs as 'running' too, and
        one of those may still be in progress.
        """
        stale_after = self.config.scheduler_stale_execution_seconds
        error = f"Abandoned: still running at worker startup, more than {stale_after}s after it started"
        try:
            count = await ExecutionDB.fail_stale_executions(stale_after, error)
        except DB_OUTAGE_ERRORS:
            raise  # tried again on the next poll
        except Exception as e:
            logger.error(f"CronScheduler: could not fail abandoned executions: {e}")
            count = 0
        self._recovered = True
        if count:
            logger.warning(f"CronScheduler: marked {count} abandoned execution(s) failed")

    async def _check_schedules(self, schedules: list[Schedule] | None = None):
        """Trigger the schedules that are due, each due occurrence once however many pollers see it."""
        now = datetime.now(UTC)

        if schedules is None:
            schedules = await ScheduleDB.list_schedules(enabled_only=True)

        for schedule in schedules:
            # Once stopping, leave the rest due for the next start instead of claiming runs that stop() would cancel.
            if self._stopping.is_set():
                break
            if not schedule.enabled or not schedule.next_run_at or schedule.next_run_at > now:
                continue
            # Claim only what this worker can start now: the rest stay due, for a worker with a free slot or for this
            # one once a run ends, instead of queueing here to run late, one after another.
            if self._run_slots.locked():
                logger.debug("CronScheduler: every run slot is busy, leaving the remaining due schedules unclaimed")
                break
            try:
                await self._fire(schedule, schedule.next_run_at, now)
            except Exception as e:
                logger.error(f"Error processing schedule {schedule.id}: {e}")

    async def _fire(self, schedule: Schedule, due_at: datetime, now: datetime) -> None:
        """Take a free run slot, claim the occurrence due at ``due_at`` and, if this poller got it, start the workflow."""
        next_run = None
        if schedule.recurrence_seconds:
            next_run = calculate_next_run(due_at, schedule.recurrence_seconds, schedule.timezone, now)

        await self._run_slots.acquire()
        try:
            claimed = await ScheduleDB.claim_due_run(schedule.id, due_at, next_run)
        except BaseException:
            self._run_slots.release()
            raise
        if not claimed:
            self._run_slots.release()
            logger.debug(f"Schedule ID {schedule.id}: the run due at {due_at} was already claimed")
            return

        run = asyncio.create_task(self._trigger_workflow(schedule.target_workflow_id))
        self._runs.add(run)
        # The run's slot is freed by a done callback, not inside the run: a task cancelled before its first step
        # never executes its body.
        run.add_done_callback(self._run_done)

        logger.info(
            f"Schedule ID {schedule.id} triggered at {due_at}. "
            f"Executing Target Workflow ID {schedule.target_workflow_id}"
        )
        if next_run:
            logger.info(f"Schedule ID {schedule.id} next run: {next_run}")
        else:
            logger.info(f"Schedule ID {schedule.id} was a one-shot schedule and is now disabled")

    def _run_done(self, run: asyncio.Task) -> None:
        """Forget a finished run and free its slot."""
        self._runs.discard(run)
        self._run_slots.release()

    async def _trigger_workflow(self, workflow_id: str):
        """Run a scheduled workflow in the slot _fire took for it; failures are logged, never raised into the loop."""
        try:
            workflow = await WorkflowDB.get_workflow(workflow_id)
            if not workflow:
                logger.error(f"Scheduled Workflow {workflow_id} not found locally.")
                return

            logger.info(f"Triggering Workflow from Cron: {workflow.name}")
            await self.engine.execute_workflow(workflow)
        except asyncio.CancelledError:
            logger.warning(f"Scheduled run of workflow {workflow_id} cancelled")
            raise
        except Exception as e:
            logger.error(f"Workflow {workflow_id} failed from Cron Trigger: {e}")
