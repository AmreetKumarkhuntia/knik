import asyncio
import logging
import sys
from pathlib import Path


# Add the 'src' directory to sys.path so 'lib' can be resolved
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from lib.core.config import Config
from lib.services.postgres.db import PostgresDB


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


async def init_db():
    """Initialize the database by running all SQL migrations in order."""
    logger.info("Initializing database migrations...")
    config = Config()

    # We use a context manager to close the pool automatically later,
    # or just initialize and let Python garbage collect upon exit.
    await PostgresDB.initialize(config.scheduler_db_url)

    if not MIGRATIONS_DIR.exists():
        logger.warning(f"Migrations directory not found: {MIGRATIONS_DIR}")
        await PostgresDB.close()
        return

    # Sort migration files alphabetically (e.g. 001_schema.sql, 002_data.sql)
    migration_files = sorted([f for f in MIGRATIONS_DIR.iterdir() if f.suffix == ".sql"])

    for file_path in migration_files:
        logger.info(f"Running migration: {file_path.name}")
        sql = file_path.read_text("utf-8")
        try:
            await PostgresDB.execute(sql)
            logger.info(f"Successfully applied: {file_path.name}")
        except Exception as e:
            logger.error(f"Failed to apply migration {file_path.name}: {e}")
            await PostgresDB.close()
            raise

    logger.info("Database initialization complete.")
    await PostgresDB.close()


if __name__ == "__main__":
    asyncio.run(init_db())
