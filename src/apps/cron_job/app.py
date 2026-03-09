import asyncio
import contextlib
import signal

from imports import printer as logger
from lib.core.config import Config
from lib.services.postgres.db import PostgresDB
from lib.services.scheduler.scheduler import Scheduler


class CronJobApp:
    """Standalone background service for Knik Workflow Scheduler."""

    def __init__(self):
        self.config = Config()
        self.scheduler = Scheduler()

    async def run(self):
        """Run the application until interrupted."""
        logger.info("Initializing Cron Job Service...")

        # Initialize Database Map
        await PostgresDB.initialize()

        # Setup graceful shutdown handlers
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
            # Wait until a stop signal is received
            await stop_event.wait()
        except asyncio.CancelledError:
            logger.info("Cron service cancelled")
        finally:
            logger.info("Shutting down Cron Job Service...")
            self.scheduler.stop()
            await PostgresDB.close()
            logger.info("Shutdown complete.")


def main():
    """Main entry logic for running the cron job app."""
    app = CronJobApp()
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(app.run())


if __name__ == "__main__":
    main()
