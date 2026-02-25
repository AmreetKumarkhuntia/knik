from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from psycopg import AsyncConnection
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from imports import printer as logger
from lib.core.config import Config


class PostgresDB:
    """
    Asynchronous generic PostgreSQL database service using psycopg-pool.
    """

    _pool: AsyncConnectionPool | None = None

    @classmethod
    async def initialize(cls, dsn: str | None = None) -> None:
        """Initialize the global async connection pool."""
        if cls._pool is not None:
            return

        config = Config()
        conn_string = dsn or config.scheduler_db_url

        logger.info("Initializing Postgres async connection pool...")
        cls._pool = AsyncConnectionPool(
            conninfo=conn_string,
            min_size=1,
            max_size=10,
            kwargs={"row_factory": dict_row, "autocommit": False},
            open=False,
        )
        await cls._pool.open()

    @classmethod
    async def close(cls) -> None:
        """Close the global async connection pool."""
        if cls._pool is not None:
            logger.info("Closing Postgres async connection pool...")
            await cls._pool.close()
            cls._pool = None

    @classmethod
    @asynccontextmanager
    async def get_connection(cls) -> AsyncGenerator[AsyncConnection, None]:
        """
        Yields an open async connection from the pool.
        Commit happens automatically on success. Rollbacks on exception.
        """
        if cls._pool is None:
            raise RuntimeError("PostgresDB is not initialized. Call initialize() first.")

        async with cls._pool.connection() as conn:
            try:
                yield conn
                # If autocommit is false, we can commit explicitly upon success context exit
                if not conn.autocommit:
                    await conn.commit()
            except Exception:
                if not conn.autocommit:
                    await conn.rollback()
                raise

    @classmethod
    async def execute(cls, query: str, params: tuple | dict | None = None) -> None:
        """Execute a query without returning rows (e.g., INSERT, UPDATE, DELETE)."""
        async with cls.get_connection() as conn, conn.cursor() as cur:
            await cur.execute(query, params)

    @classmethod
    async def fetch_one(cls, query: str, params: tuple | dict | None = None) -> dict[str, Any] | None:
        """Execute a query and return a single row as a dictionary."""
        async with cls.get_connection() as conn, conn.cursor() as cur:
            await cur.execute(query, params)
            return await cur.fetchone()

    @classmethod
    async def fetch_all(cls, query: str, params: tuple | dict | None = None) -> list[dict[str, Any]]:
        """Execute a query and return all matching rows as a list of dictionaries."""
        async with cls.get_connection() as conn, conn.cursor() as cur:
            await cur.execute(query, params)
            return await cur.fetchall()

    @classmethod
    async def fetch_val(cls, query: str, params: tuple | dict | None = None) -> Any:
        """Execute a query and return the first column of the first row."""
        row = await cls.fetch_one(query, params)
        if row:
            return next(iter(row.values()))
        return None
