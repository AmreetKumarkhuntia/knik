"""Backend fixtures: the FastAPI app under TestClient, with Postgres unreachable or pointed at the test database.

The app opens its own pool inside TestClient's event loop (a pool cannot be shared across loops), so the
database fixtures only point the KNIK_DB_* settings at the test database and empty it.
"""

from collections.abc import Iterator

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.conninfo import conninfo_to_dict

from backend import state
from backend.main import app
from tests.db_support import TABLES


_ENV_FOR_PARAM = {
    "host": "KNIK_DB_HOST",
    "port": "KNIK_DB_PORT",
    "user": "KNIK_DB_USER",
    "password": "KNIK_DB_PASS",
    "dbname": "KNIK_DB_NAME",
}


@pytest.fixture(autouse=True)
def no_persisted_overrides(monkeypatch):
    monkeypatch.setattr(state, "_persisted_overrides", None)


@pytest.fixture
def offline_client(fresh_pool_state, monkeypatch) -> Iterator[TestClient]:
    """The app started while Postgres is unreachable (nothing listens on port 1)."""
    monkeypatch.setenv("KNIK_DB_HOST", "127.0.0.1")
    monkeypatch.setenv("KNIK_DB_PORT", "1")
    monkeypatch.setenv("KNIK_DB_CONNECT_TIMEOUT", "1")
    with TestClient(app) as client:
        yield client


@pytest.fixture
def database_url(migrated_database_url, fresh_pool_state, monkeypatch) -> str:
    """Points the app's KNIK_DB_* settings at the emptied test database."""
    params = conninfo_to_dict(migrated_database_url)
    for param, env in _ENV_FOR_PARAM.items():
        monkeypatch.setenv(env, str(params.get(param) or ""))
    with psycopg.connect(migrated_database_url, autocommit=True) as conn:
        conn.execute(f"TRUNCATE {', '.join(TABLES)} RESTART IDENTITY CASCADE")
    return migrated_database_url


@pytest.fixture
def client(database_url) -> Iterator[TestClient]:
    with TestClient(app) as client:
        yield client
