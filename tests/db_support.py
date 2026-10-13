"""Shared settings for the tests that need Postgres.

Integration tests (marked `requires_db`) run against the disposable database named by
KNIK_TEST_DATABASE_URL. The fixtures in tests/conftest.py apply any migration it has not had yet (tracked in
schema_migrations, like scripts/migrate.sh) and truncate every table before each test.
"""

import os
from pathlib import Path

import pytest


DATABASE_URL = os.environ.get("KNIK_TEST_DATABASE_URL")
MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "db" / "migrations"
TABLES = (
    "node_executions",
    "executions",
    "schedules",
    "workflows",
    "conversations",
    "users",
    "app_settings",
    "api_keys",
    "mcp_tools_state",
)

requires_db = pytest.mark.skipif(
    not DATABASE_URL, reason="set KNIK_TEST_DATABASE_URL to a disposable Postgres database to run"
)
