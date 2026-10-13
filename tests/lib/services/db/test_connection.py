"""PostgresDB: failing fast without a server, throttled reconnects, and the query helpers against a real database."""

import asyncio
import time

import psycopg
import psycopg_pool
import pytest

from lib.services.db import connection
from lib.services.db.connection import DB_ERRORS, DatabaseUnavailable, PostgresDB, redact
from tests.db_support import requires_db


UNREACHABLE_DSN = "host=127.0.0.1 port=1 dbname=knik user=knik connect_timeout=1"


def _fake_open(calls: list[str], *, fail: bool = True):
    async def _open(cls):
        calls.append("open")
        cls._last_attempt = time.monotonic()
        if fail:
            raise DatabaseUnavailable("down")

    return classmethod(_open)


def test_database_unavailable_is_a_db_error():
    assert issubclass(DatabaseUnavailable, RuntimeError)
    for error in (DatabaseUnavailable, psycopg.OperationalError, psycopg_pool.PoolTimeout):
        assert issubclass(error, DB_ERRORS)


def test_redact_masks_password_in_both_dsn_forms():
    assert "s3cret" not in redact("postgresql://knik:s3cret@db.local:5432/knik")
    assert "***" in redact("postgresql://knik:s3cret@db.local:5432/knik")
    keyword = redact("host=db.local user=knik password=s3cret dbname=knik")
    assert "s3cret" not in keyword
    assert "host=db.local" in keyword


@pytest.mark.asyncio
async def test_initialize_against_unreachable_server_raises_and_leaves_no_pool(fresh_pool_state, monkeypatch):
    monkeypatch.setenv("KNIK_DB_CONNECT_TIMEOUT", "1")
    started = time.monotonic()
    with pytest.raises(DatabaseUnavailable):
        await PostgresDB.initialize(UNREACHABLE_DSN)
    assert time.monotonic() - started < 5
    assert PostgresDB._pool is None


@pytest.mark.asyncio
async def test_initialize_adds_a_connect_timeout_unless_given(fresh_pool_state, monkeypatch):
    monkeypatch.setenv("KNIK_DB_CONNECT_TIMEOUT", "5")
    calls: list[str] = []
    monkeypatch.setattr(PostgresDB, "_open", _fake_open(calls, fail=False))

    await PostgresDB.initialize(host="db.local", port=5433, dbname="knik")
    assert PostgresDB._conninfo is not None
    assert "connect_timeout=5" in PostgresDB._conninfo
    assert "host=db.local" in PostgresDB._conninfo

    await PostgresDB.initialize("host=db.local connect_timeout=2")
    assert "connect_timeout=2" in PostgresDB._conninfo
    assert "connect_timeout=5" not in PostgresDB._conninfo


@pytest.mark.asyncio
async def test_connect_timeout_comes_from_config_in_whole_seconds(fresh_pool_state, monkeypatch):
    monkeypatch.setattr(PostgresDB, "_open", _fake_open([], fail=False))
    monkeypatch.setenv("KNIK_DB_CONNECT_TIMEOUT", "1.5")

    await PostgresDB.initialize(host="db.local")
    assert PostgresDB._conninfo is not None
    assert "connect_timeout=2" in PostgresDB._conninfo


@pytest.mark.asyncio
async def test_get_connection_fails_fast_between_reconnect_attempts(fresh_pool_state, monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(PostgresDB, "_open", _fake_open(calls))
    monkeypatch.setattr(PostgresDB, "_last_attempt", time.monotonic())

    started = time.monotonic()
    with pytest.raises(DatabaseUnavailable, match="next reconnect attempt"):
        await PostgresDB.fetch_val("SELECT 1")
    assert time.monotonic() - started < 1
    assert calls == []


@pytest.mark.asyncio
async def test_get_connection_reconnects_once_the_interval_has_passed(fresh_pool_state, monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(PostgresDB, "_open", _fake_open(calls))
    monkeypatch.setattr(PostgresDB, "_last_attempt", time.monotonic() - connection.RETRY_INTERVAL - 1)

    with pytest.raises(DatabaseUnavailable, match="down"):
        await PostgresDB.fetch_val("SELECT 1")
    with pytest.raises(DatabaseUnavailable, match="next reconnect attempt"):
        await PostgresDB.fetch_val("SELECT 1")
    assert calls == ["open"]


@pytest.mark.asyncio
async def test_get_connection_opens_lazily_when_never_initialized(fresh_pool_state, monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(PostgresDB, "_open", _fake_open(calls))

    with pytest.raises(DatabaseUnavailable):
        await PostgresDB.execute("SELECT 1")
    assert calls == ["open"]


@pytest.mark.asyncio
async def test_concurrent_callers_share_one_reconnect_attempt(fresh_pool_state, monkeypatch):
    calls: list[str] = []
    release = asyncio.Event()

    async def _open(cls):
        calls.append("open")
        cls._last_attempt = time.monotonic()
        await release.wait()
        cls._pool = object()

    monkeypatch.setattr(PostgresDB, "_open", classmethod(_open))
    monkeypatch.setattr(PostgresDB, "_last_attempt", time.monotonic() - connection.RETRY_INTERVAL - 1)

    waiters = [asyncio.create_task(PostgresDB._require_pool()) for _ in range(5)]
    await asyncio.sleep(0)
    release.set()
    pools = await asyncio.gather(*waiters)

    assert calls == ["open"]
    assert all(pool is pools[0] for pool in pools)
    assert PostgresDB._opening is None


@pytest.mark.asyncio
async def test_failed_shared_reconnect_reaches_every_caller_then_throttles(fresh_pool_state, monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(PostgresDB, "_open", _fake_open(calls))

    results = await asyncio.gather(*(PostgresDB._require_pool() for _ in range(3)), return_exceptions=True)

    assert calls == ["open"]
    assert all(isinstance(r, DatabaseUnavailable) and "down" in str(r) for r in results)
    with pytest.raises(DatabaseUnavailable, match="next reconnect attempt"):
        await PostgresDB._require_pool()


@pytest.mark.asyncio
async def test_reconnect_from_another_event_loop_is_refused(fresh_pool_state, monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(PostgresDB, "_open", _fake_open(calls))
    with pytest.raises(DatabaseUnavailable, match="down"):
        await PostgresDB.initialize("host=db.local")
    assert PostgresDB._owner_loop is asyncio.get_running_loop()
    monkeypatch.setattr(PostgresDB, "_last_attempt", None)

    # A tool running in a worker thread reaches the database through its own short-lived loop.
    def _from_tool_thread():
        return asyncio.run(PostgresDB.fetch_val("SELECT 1"))

    with pytest.raises(DatabaseUnavailable, match="application's event loop"):
        await asyncio.to_thread(_from_tool_thread)
    assert calls == ["open"]


@requires_db
@pytest.mark.asyncio
async def test_reopens_at_once_after_a_deliberate_close(migrated_database_url, fresh_pool_state):
    await PostgresDB.initialize(migrated_database_url)
    await PostgresDB.close()
    try:
        assert await PostgresDB.fetch_val("SELECT 1") == 1
    finally:
        await PostgresDB.close()


@requires_db
@pytest.mark.asyncio
async def test_query_helpers(db):
    await PostgresDB.execute("INSERT INTO mcp_tools_state (tool_name, enabled) VALUES ('a', true), ('b', false)")
    assert await PostgresDB.execute("UPDATE mcp_tools_state SET enabled = true") == 2
    assert await PostgresDB.execute("DELETE FROM mcp_tools_state WHERE tool_name = 'missing'") == 0
    assert await PostgresDB.fetch_val("SELECT COUNT(*) FROM mcp_tools_state") == 2
    assert await PostgresDB.fetch_val("SELECT tool_name FROM mcp_tools_state WHERE tool_name = 'zzz'") is None
    assert await PostgresDB.fetch_one(
        "SELECT tool_name, enabled FROM mcp_tools_state WHERE tool_name = %s", ("b",)
    ) == {
        "tool_name": "b",
        "enabled": True,
    }
    rows = await PostgresDB.fetch_all("SELECT tool_name FROM mcp_tools_state ORDER BY tool_name")
    assert rows == [{"tool_name": "a"}, {"tool_name": "b"}]


@requires_db
@pytest.mark.asyncio
async def test_failed_statement_rolls_back_the_transaction(db):
    with pytest.raises(psycopg.errors.UniqueViolation):
        async with PostgresDB.get_connection() as conn:
            await conn.execute("INSERT INTO mcp_tools_state (tool_name) VALUES ('x')")
            await conn.execute("INSERT INTO mcp_tools_state (tool_name) VALUES ('x')")
    assert await PostgresDB.fetch_val("SELECT COUNT(*) FROM mcp_tools_state") == 0


@requires_db
@pytest.mark.asyncio
async def test_recovers_when_the_server_becomes_reachable(migrated_database_url, fresh_pool_state, monkeypatch):
    monkeypatch.setenv("KNIK_DB_CONNECT_TIMEOUT", "1")
    with pytest.raises(DatabaseUnavailable):
        await PostgresDB.initialize(UNREACHABLE_DSN)

    # Stand-in for the server coming back: the remembered target becomes reachable and the
    # reconnect interval elapses.
    monkeypatch.setattr(PostgresDB, "_conninfo", migrated_database_url)
    monkeypatch.setattr(PostgresDB, "_last_attempt", time.monotonic() - connection.RETRY_INTERVAL)
    try:
        assert await PostgresDB.fetch_val("SELECT 1") == 1
        assert PostgresDB._pool is not None
    finally:
        await PostgresDB.close()
