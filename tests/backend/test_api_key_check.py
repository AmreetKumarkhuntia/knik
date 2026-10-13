"""The optional API key check (KNIK_WEB_REQUIRE_API_KEY): when on, every /api route needs a stored key in X-API-Key."""

import dataclasses
from collections.abc import Iterator

import psycopg
import pytest
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from backend import main
from backend.deps import require_api_key
from backend.main import app
from tests.db_support import requires_db


# One request per router.
API_REQUESTS = [
    ("POST", "/api/chat/", {"message": "hi"}),
    ("POST", "/api/chat/stream/", {"message": "hi"}),
    ("GET", "/api/admin/settings", None),
    ("GET", "/api/conversations/", None),
    ("GET", "/api/cron/", None),
    ("GET", "/api/workflows/", None),
    ("GET", "/api/analytics/dashboard", None),
]


@pytest.fixture
def key_required(config, monkeypatch) -> None:
    monkeypatch.setattr(main, "config", dataclasses.replace(config, require_api_key=True))


@pytest.fixture
def offline_keyed_client(key_required, offline_database) -> Iterator[TestClient]:
    with TestClient(app) as client:
        yield client


def _key_times(database_url: str, key_id: str) -> tuple:
    with psycopg.connect(database_url) as conn:
        row = conn.execute("SELECT created_at, last_used_at FROM api_keys WHERE id = %s", (key_id,)).fetchone()
    assert row is not None
    return row


def test_with_the_check_off_no_key_is_needed(offline_client):
    assert offline_client.get("/api/admin/settings").status_code == 200
    assert offline_client.get("/api/admin/settings", headers={"X-API-Key": "made-up"}).status_code == 200


def test_every_api_route_runs_the_check_and_no_other_route_does():
    checked = {
        route.path: any(dependency.dependency is require_api_key for dependency in route.dependencies)
        for route in app.routes
        if isinstance(route, APIRoute)
    }

    assert {path for path, has_check in checked.items() if has_check} == {
        path for path in checked if path.startswith("/api/")
    }
    assert checked["/health"] is False and checked["/"] is False


@pytest.mark.parametrize(("method", "path", "body"), API_REQUESTS)
def test_every_api_route_refuses_a_request_without_a_key(offline_keyed_client, method, path, body):
    response = offline_keyed_client.request(method, path, json=body)

    assert (response.status_code, response.json()) == (401, {"detail": "Missing API key"})
    assert response.headers["www-authenticate"] == "APIKey"


def test_a_key_cannot_be_checked_without_the_database(offline_keyed_client):
    response = offline_keyed_client.get("/api/admin/settings", headers={"X-API-Key": "knik_live_0123456789abcdef"})

    assert (response.status_code, response.json()) == (503, {"detail": "Database unavailable"})


def test_health_and_root_stay_open(offline_keyed_client):
    assert offline_keyed_client.get("/health").json() == {"status": "healthy"}
    assert offline_keyed_client.get("/").json()["status"] == "running"


@requires_db
def test_a_key_created_with_the_check_off_opens_the_api_once_it_is_on(database_url, config, monkeypatch):
    with TestClient(app) as client:
        created = client.post("/api/admin/api-keys", json={"label": "me"}).json()
    key, key_id = created["key"], created["id"]

    monkeypatch.setattr(main, "config", dataclasses.replace(config, require_api_key=True))
    with TestClient(app) as client:
        wrong_secret = key[:-1] + ("1" if key.endswith("0") else "0")
        for bad_key in (wrong_secret, key[:16], "not-a-key"):
            response = client.get("/api/admin/api-keys", headers={"X-API-Key": bad_key})
            assert (response.status_code, response.json()) == (401, {"detail": "Invalid API key"})
            assert response.headers["www-authenticate"] == "APIKey"
        assert _key_times(database_url, key_id)[1] is None

        response = client.get("/api/admin/api-keys", headers={"X-API-Key": key})
        assert response.status_code == 200
        assert [listed["id"] for listed in response.json()["api_keys"]] == [key_id]

    # The request did not wait for the last-used stamp; the app's shutdown does.
    created_at, last_used_at = _key_times(database_url, key_id)
    assert last_used_at is not None
    assert last_used_at >= created_at


@requires_db
def test_a_deleted_key_no_longer_opens_the_api(database_url, config, monkeypatch):
    with TestClient(app) as client:
        created = client.post("/api/admin/api-keys", json={"label": "short-lived"}).json()

    monkeypatch.setattr(main, "config", dataclasses.replace(config, require_api_key=True))
    with TestClient(app) as client:
        headers = {"X-API-Key": created["key"]}
        assert client.delete(f"/api/admin/api-keys/{created['id']}", headers=headers).status_code == 200

        response = client.get("/api/admin/api-keys", headers=headers)
        assert (response.status_code, response.json()) == (401, {"detail": "Invalid API key"})
