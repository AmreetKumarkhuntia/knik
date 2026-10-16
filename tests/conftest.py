"""Fixtures shared by every test package. See tests/db_support.py for the database settings."""

import psycopg
import pytest
import pytest_asyncio

from lib.core.config import Config
from lib.services.db.connection import PostgresDB
from tests.db_support import DATABASE_URL, MIGRATIONS_DIR, TABLES


@pytest.fixture(autouse=True)
def no_installed_config(monkeypatch):
    """No config installed by an earlier test: Config.current() falls back to the env, as in a fresh process."""
    monkeypatch.setattr(Config, "_current", None)


@pytest.fixture
def fresh_pool_state(monkeypatch):
    """No pool, no remembered connection string, owner loop or connection attempt (past or in flight)."""
    monkeypatch.setattr(PostgresDB, "_pool", None)
    monkeypatch.setattr(PostgresDB, "_conninfo", None)
    monkeypatch.setattr(PostgresDB, "_last_attempt", None)
    monkeypatch.setattr(PostgresDB, "_owner_loop", None)
    monkeypatch.setattr(PostgresDB, "_opening", None)


@pytest.fixture(scope="session")
def migrated_database_url() -> str:
    assert DATABASE_URL
    # Same bookkeeping as scripts/migrate.sh: each file runs once, in its own transaction with its record.
    with psycopg.connect(DATABASE_URL, autocommit=True) as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())"
        )
        applied = {name for (name,) in conn.execute("SELECT name FROM schema_migrations")}
        for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
            if path.name in applied:
                continue
            with conn.transaction():
                conn.execute(path.read_bytes())
                conn.execute("INSERT INTO schema_migrations (name) VALUES (%s)", (path.name,))
    return DATABASE_URL


@pytest_asyncio.fixture
async def db(migrated_database_url, fresh_pool_state):
    with psycopg.connect(migrated_database_url, autocommit=True) as conn:
        conn.execute(f"TRUNCATE {', '.join(TABLES)} RESTART IDENTITY CASCADE")
    await PostgresDB.initialize(migrated_database_url)
    yield
    await PostgresDB.close()
