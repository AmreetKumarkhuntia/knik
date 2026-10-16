"""Backend fixtures: the FastAPI app under TestClient, with Postgres unreachable or pointed at the test database.

The app opens its own pool inside TestClient's event loop (a pool cannot be shared across loops), so the
database fixtures only point the KNIK_DB_* settings at the test database and empty it. Every test runs the
app with the mock AI provider, a stand-in TTS model, no API key check and consent-required tools refused,
whatever the environment configures. A test that needs other settings replaces ``main.config`` before it
starts the app.
"""

from collections.abc import Iterator

import numpy as np
import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.conninfo import conninfo_to_dict

from backend import main
from backend import state as state_module
from backend.config import WebBackendConfig
from backend.main import app
from lib.core.config import Config
from tests.db_support import TABLES


_ENV_FOR_PARAM = {
    "host": "KNIK_DB_HOST",
    "port": "KNIK_DB_PORT",
    "user": "KNIK_DB_USER",
    "password": "KNIK_DB_PASS",
    "dbname": "KNIK_DB_NAME",
}


class StubTTS:
    """Stands in for KokoroVoiceModel: nothing to load, and every sentence becomes four silent samples."""

    def __init__(self, voice: str = "af_heart", **_kwargs) -> None:
        self.voice = voice
        self.loaded = False

    def load(self) -> None:
        self.loaded = True

    def generate(self, text: str, voice: str | None = None) -> tuple[np.ndarray, int]:
        return np.zeros(4, dtype=np.float32), 24000

    def set_voice(self, voice: str) -> None:
        self.voice = voice


@pytest.fixture(autouse=True)
def stub_tts(monkeypatch) -> None:
    monkeypatch.setattr(state_module, "KokoroVoiceModel", StubTTS)


@pytest.fixture(autouse=True)
def config(monkeypatch) -> WebBackendConfig:
    """The config the app starts with: the env's, with every user setting at its default and the mock provider.

    Clearing the user settings keeps the results independent of the developer's .env (a stored API key, a
    telemetry flag); the mock provider keeps every test off a real AI.
    """
    for item in Config.schema():
        monkeypatch.delenv(item["env"], raising=False)
    test_config = WebBackendConfig(
        ai_provider="mock", ai_model="mock-model", require_api_key=False, tool_consent="deny"
    )
    monkeypatch.setattr(main, "config", test_config)
    return test_config


@pytest.fixture
def offline_database(fresh_pool_state, monkeypatch) -> None:
    """Postgres unreachable for an app started from now on (nothing listens on port 1)."""
    monkeypatch.setenv("KNIK_DB_HOST", "127.0.0.1")
    monkeypatch.setenv("KNIK_DB_PORT", "1")
    monkeypatch.setenv("KNIK_DB_CONNECT_TIMEOUT", "1")


@pytest.fixture
def offline_client(offline_database) -> Iterator[TestClient]:
    """The app started while Postgres is unreachable."""
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
