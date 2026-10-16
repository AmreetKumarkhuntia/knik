"""Workflow scheduler process."""

import asyncio
import contextlib
import signal

from imports import DB_ERRORS, Config, PostgresDB, Scheduler, SettingsDB, build_workflow_client
from imports import printer as logger


class WorkerApp:
    """Runs the workflow scheduler loop until SIGINT or SIGTERM."""

    def __init__(self):
        self.config = Config()
        self.scheduler = Scheduler(ai_client_factory=build_workflow_client)

    async def run(self):
        """Run the application until interrupted."""
        logger.info("Initializing worker...")

        try:
            await PostgresDB.initialize()
            overrides = await SettingsDB.get_all()
        except DB_ERRORS as e:
            # Queries reconnect on their own once Postgres is back, so keep the loop running.
            logger.warning(f"PostgresDB unavailable, continuing with env settings: {e}")
            overrides = {}
        # shortcut: settings saved in the web app reach the worker on its next restart only, poll or notify when live updates matter
        self.config = self.config.with_overrides(overrides)
        Config.install(self.config)

        loop = asyncio.get_running_loop()
        stop_event = asyncio.Event()

        def signal_handler():
            logger.info("Shutdown signal received")
            stop_event.set()

        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, signal_handler)

        logger.info("Starting Scheduler Background Loop...")
        self.scheduler.start()

        try:
            await stop_event.wait()
        except asyncio.CancelledError:
            logger.info("Worker cancelled")
        finally:
            logger.info("Shutting down worker...")
            await self.scheduler.stop()
            await PostgresDB.close()
            logger.info("Shutdown complete.")


def main() -> None:
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(WorkerApp().run())


if __name__ == "__main__":
    main()
