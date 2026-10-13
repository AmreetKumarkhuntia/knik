"""Async PostgreSQL connection pool shared by every repository."""

import asyncio
import math
import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import psycopg
import psycopg_pool
from psycopg import AsyncConnection
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from lib.core.config import Config
from lib.utils.printer import printer


# While there is no pool, reconnect at most this often so a down server is not hammered per query.
RETRY_INTERVAL = 30.0


class DatabaseUnavailable(RuntimeError):  # noqa: N818 - name fixed by the services/db API
    """There is no connection pool: opening one failed (Postgres down, unreachable or misconfigured) or is throttled.

    An outage that starts after the pool has opened surfaces as psycopg.OperationalError (PoolTimeout included)
    instead; catch DB_OUTAGE_ERRORS to cover both.
    """


# What a caller catches when it should degrade instead of failing (e.g. chat without persistence).
DB_ERRORS = (DatabaseUnavailable, psycopg.Error, psycopg_pool.PoolTimeout)

# The subset of DB_ERRORS that means "Postgres cannot be reached", as opposed to a bad query.
# PoolTimeout is an OperationalError.
DB_OUTAGE_ERRORS = (DatabaseUnavailable, psycopg.OperationalError)


def _config_conninfo(config: Config) -> str:
    params = {
        "host": config.db_host,
        "port": config.db_port,
        "user": config.db_user,
        "password": config.db_pass,
        "dbname": config.db_name,
    }
    return make_conninfo(**{k: v for k, v in params.items() if v})


def _with_connect_timeout(conninfo: str, timeout: float) -> str:
    if "connect_timeout" in conninfo_to_dict(conninfo):
        return conninfo
    # libpq accepts only whole seconds here.
    return make_conninfo(conninfo, connect_timeout=math.ceil(timeout))


def redact(conninfo: str) -> str:
    """The connection string with its password masked, for logs."""
    try:
        params = conninfo_to_dict(conninfo)
    except psycopg.ProgrammingError:
        return "<unparseable connection string>"
    if "password" in params:
        params["password"] = "***"
    return make_conninfo(**params)


class PostgresDB:
    """Process-wide async connection pool behind classmethods."""

    _pool: AsyncConnectionPool | None = None
    _conninfo: str | None = None
    _last_attempt: float | None = None
    # The loop that called initialize(). An async pool works only on the loop it was opened on, so a
    # reconnect requested from another loop (a tool thread's run_async) is refused instead of opening there.
    _owner_loop: asyncio.AbstractEventLoop | None = None
    # The open in progress, shared by every caller that needs a pool while it runs.
    _opening: asyncio.Task | None = None

    @classmethod
    async def initialize(cls, dsn: str | None = None, **kwargs) -> None:
        """Open the pool (from `dsn`, libpq keyword `kwargs`, or Config); raise DatabaseUnavailable on failure."""
        if cls._pool is not None:
            return
        config = Config()
        if dsn:
            conninfo = dsn
        elif kwargs:
            conninfo = make_conninfo(**kwargs)
        else:
            conninfo = _config_conninfo(config)
        cls._conninfo = _with_connect_timeout(conninfo, config.db_connect_timeout)
        cls._owner_loop = asyncio.get_running_loop()
        await cls._open_shared()

    @classmethod
    async def _open_shared(cls) -> None:
        """Run _open() once for all concurrent callers; each of them sees its result."""
        task = cls._opening
        # A task left behind by a loop that has since closed can never finish; start a fresh one.
        if task is None or task.get_loop() is not asyncio.get_running_loop():
            task = cls._opening = asyncio.ensure_future(cls._open())
        try:
            await asyncio.shield(task)
        finally:
            if task.done() and cls._opening is task:
                cls._opening = None

    @classmethod
    async def _open(cls) -> None:
        config = Config()
        # The timeout bounds both the first connection and each wait for a free connection, so a dead
        # server surfaces as DatabaseUnavailable / PoolTimeout in seconds instead of stalling callers.
        timeout = config.db_connect_timeout
        conninfo = cls._conninfo or _with_connect_timeout(_config_conninfo(config), timeout)
        cls._last_attempt = time.monotonic()
        printer.info(f"Initializing Postgres async connection pool for url: {redact(conninfo)}")
        pool = AsyncConnectionPool(
            conninfo=conninfo,
            min_size=config.db_pool_min_size,
            max_size=config.db_pool_max_size,
            timeout=timeout,
            kwargs={"row_factory": dict_row, "autocommit": False},
            # Replaces connections broken by a server restart before handing them out.
            check=AsyncConnectionPool.check_connection,
            open=False,
        )
        try:
            await pool.open(wait=True, timeout=timeout)
        except (psycopg.Error, psycopg_pool.PoolTimeout) as e:
            await pool.close()
            printer.warning(f"Postgres unavailable at {redact(conninfo)}: {e}")
            raise DatabaseUnavailable(f"Postgres unavailable: {e}") from e

        if cls._pool is not None:
            # A concurrent caller opened a pool while this one was connecting.
            await pool.close()
            return
        cls._pool = pool

    @classmethod
    async def close(cls) -> None:
        # The reconnect throttle is for failed attempts; after a deliberate close the next query reopens at once.
        cls._last_attempt = None
        cls._owner_loop = None
        cls._opening = None
        if cls._pool is not None:
            printer.info("Closing Postgres async connection pool...")
            pool, cls._pool = cls._pool, None
            await pool.close()

    @classmethod
    async def _require_pool(cls) -> AsyncConnectionPool:
        if cls._pool is None:
            if cls._owner_loop is not None and asyncio.get_running_loop() is not cls._owner_loop:
                raise DatabaseUnavailable("Postgres unavailable; reconnecting is left to the application's event loop")
            if cls._opening is None and cls._last_attempt is not None:
                elapsed = time.monotonic() - cls._last_attempt
                if elapsed < RETRY_INTERVAL:
                    raise DatabaseUnavailable(
                        f"Postgres unavailable; next reconnect attempt in {RETRY_INTERVAL - elapsed:.0f}s"
                    )
            await cls._open_shared()
        pool = cls._pool
        if pool is None:
            raise DatabaseUnavailable("Postgres connection pool was closed")
        return pool

    @classmethod
    @asynccontextmanager
    async def get_connection(cls) -> AsyncGenerator[AsyncConnection, None]:
        """Yield a pooled connection; commits on success and rolls back on exception."""
        pool = await cls._require_pool()
        async with pool.connection() as conn:
            try:
                yield conn
                if not conn.autocommit:
                    await conn.commit()
            except Exception:
                if not conn.autocommit:
                    await conn.rollback()
                raise

    @classmethod
    async def execute(cls, query: str, params: tuple | dict | None = None) -> int:
        """Run a statement and return the number of rows it affected."""
        async with cls.get_connection() as conn, conn.cursor() as cur:
            await cur.execute(query, params)
            return cur.rowcount

    @classmethod
    async def fetch_one(cls, query: str, params: tuple | dict | None = None) -> dict[str, Any] | None:
        async with cls.get_connection() as conn, conn.cursor() as cur:
            await cur.execute(query, params)
            return await cur.fetchone()

    @classmethod
    async def fetch_all(cls, query: str, params: tuple | dict | None = None) -> list[dict[str, Any]]:
        async with cls.get_connection() as conn, conn.cursor() as cur:
            await cur.execute(query, params)
            return await cur.fetchall()

    @classmethod
    async def fetch_val(cls, query: str, params: tuple | dict | None = None) -> Any:
        """The first column of the first row, or None when there are no rows."""
        row = await cls.fetch_one(query, params)
        if row:
            return next(iter(row.values()))
        return None
