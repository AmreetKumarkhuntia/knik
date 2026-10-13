"""CORS: only the configured origins may call the API from a browser, and "*" never comes with credentials."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend import main
from backend.config import DEFAULT_CORS_ORIGINS
from backend.main import add_cors


PREFLIGHT = {"Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type,x-api-key"}
EVIL = "https://evil.example"


def _client(origins: tuple[str, ...]) -> TestClient:
    app = FastAPI()

    @app.get("/api/ping")
    async def ping():
        return {"ok": True}

    add_cors(app, origins)
    return TestClient(app)


def test_a_configured_origin_may_call_the_api_with_credentials():
    client = _client(("https://knik.example",))

    preflight = client.options("/api/ping", headers={"Origin": "https://knik.example", **PREFLIGHT})
    assert preflight.status_code == 200
    assert preflight.headers["access-control-allow-origin"] == "https://knik.example"
    assert preflight.headers["access-control-allow-credentials"] == "true"
    assert preflight.headers["access-control-allow-headers"] == "content-type,x-api-key"

    response = client.get("/api/ping", headers={"Origin": "https://knik.example"})
    assert response.headers["access-control-allow-origin"] == "https://knik.example"


def test_any_other_origin_is_refused():
    client = _client(("https://knik.example",))

    preflight = client.options("/api/ping", headers={"Origin": EVIL, **PREFLIGHT})
    assert (preflight.status_code, preflight.text) == (400, "Disallowed CORS origin")
    assert "access-control-allow-origin" not in preflight.headers

    response = client.get("/api/ping", headers={"Origin": EVIL, "Cookie": "session=1"})
    assert "access-control-allow-origin" not in response.headers


def test_a_wildcard_lets_any_origin_in_but_never_with_credentials():
    client = _client(("*",))

    preflight = client.options("/api/ping", headers={"Origin": EVIL, **PREFLIGHT})
    assert preflight.status_code == 200
    assert preflight.headers["access-control-allow-origin"] == "*"
    assert "access-control-allow-credentials" not in preflight.headers

    response = client.get("/api/ping", headers={"Origin": EVIL, "Cookie": "session=1"})
    assert "access-control-allow-credentials" not in response.headers


# The app's middleware is set up once, at import, from the environment.
@pytest.mark.skipif(main.config.cors_origins != DEFAULT_CORS_ORIGINS, reason="KNIK_WEB_CORS_ORIGINS sets other origins")
def test_by_default_the_app_lets_in_only_the_local_frontend(offline_client):
    for origin in ("http://localhost:8020", "http://127.0.0.1:8020"):
        preflight = offline_client.options("/api/admin/settings", headers={"Origin": origin, **PREFLIGHT})
        assert (preflight.status_code, preflight.headers["access-control-allow-origin"]) == (200, origin)

    preflight = offline_client.options("/api/admin/settings", headers={"Origin": EVIL, **PREFLIGHT})
    assert preflight.status_code == 400
    assert "access-control-allow-origin" not in preflight.headers
