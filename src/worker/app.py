"""Workflow scheduler process."""

import asyncio
import contextlib
import signal

from imports import DB_ERRORS, Config, PostgresDB, Scheduler
from imports import printer as logger


class WorkerApp:
    """Runs the workflow scheduler loop until SIGINT or SIGTERM."""

    def __init__(self):
        self.config = Config()
        self.scheduler = Scheduler()

    async def run(self):
        """Run the application until interrupted."""
        logger.info("Initializing worker...")

        try:
            await PostgresDB.initialize()
        except DB_ERRORS as e:
            # Queries reconnect on their own once Postgres is back, so keep the loop running.
            logger.warning(f"PostgresDB unavailable, continuing without it: {e}")

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
            self.scheduler.stop()
            await PostgresDB.close()
            logger.info("Shutdown complete.")


def main() -> None:
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(WorkerApp().run())


if __name__ == "__main__":
    main()
