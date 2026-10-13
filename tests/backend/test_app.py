"""The FastAPI app: boots without a database, answers 503 for database routes then, and works against a real one."""

import psycopg
import pytest
from fastapi.testclient import TestClient

from backend import state
from backend.config import WebBackendConfig
from backend.main import app
from tests.db_support import requires_db


DB_ROUTES = [
    ("GET", "/api/conversations/"),
    ("POST", "/api/conversations/"),
    ("GET", "/api/conversations/some-id"),
    ("GET", "/api/workflows/"),
    ("GET", "/api/workflows/some-id/history"),
    ("GET", "/api/cron/"),
    ("GET", "/api/analytics/dashboard"),
    ("GET", "/api/analytics/metrics?time_range=7days"),
    ("GET", "/api/analytics/activity"),
    ("GET", "/api/admin/api-keys"),
    ("DELETE", "/api/admin/api-keys/some-id"),
]


def test_health_and_root_without_database(offline_client):
    assert offline_client.get("/health").json() == {"status": "healthy"}
    root = offline_client.get("/")
    assert root.status_code == 200
    assert root.json()["status"] == "running"


@pytest.mark.parametrize(("method", "path"), DB_ROUTES)
def test_database_routes_answer_503_without_database(offline_client, method, path):
    response = offline_client.request(method, path)
    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}


def test_settings_and_tool_list_fall_back_to_defaults_without_database(offline_client):
    config = WebBackendConfig()
    settings = offline_client.get("/api/admin/settings")
    assert settings.status_code == 200
    body = settings.json()
    assert (body["provider"], body["model"], body["voice"]) == (config.ai_provider, config.ai_model, config.voice_name)
    assert (body["stream_responses"], body["send_telemetry"]) == (True, False)

    tools = offline_client.get("/api/admin/mcp-tools")
    assert tools.status_code == 200
    assert tools.json()["tools"]
    assert all(tool["enabled"] for tool in tools.json()["tools"])


@requires_db
def test_conversation_crud(client):
    created = client.post("/api/conversations/", json={"title": "First"}).json()
    assert created["status"] == "created"
    assert created["title"] == "First"
    conversation_id = created["id"]

    listing = client.get("/api/conversations/").json()
    assert listing["count"] == 1
    assert listing["conversations"][0]["id"] == conversation_id
    assert listing["conversations"][0]["message_count"] == 0

    assert client.patch(f"/api/conversations/{conversation_id}", json={"title": "Renamed"}).json() == {
        "status": "updated",
        "id": conversation_id,
        "title": "Renamed",
    }
    assert client.get(f"/api/conversations/{conversation_id}").json()["title"] == "Renamed"
    assert client.get(f"/api/conversations/{conversation_id}/messages").json() == {
        "conversation_id": conversation_id,
        "messages": [],
        "count": 0,
    }

    assert client.delete(f"/api/conversations/{conversation_id}").json() == {"status": "deleted", "id": conversation_id}
    assert client.get(f"/api/conversations/{conversation_id}").status_code == 404


@requires_db
def test_startup_loads_persisted_settings_including_api_base_and_key(database_url):
    with psycopg.connect(database_url, autocommit=True) as conn:
        conn.execute(
            "INSERT INTO app_settings (id, provider, model, api_base, api_key) VALUES (%s, %s, %s, %s, %s)",
            ("singleton", "custom", "my-model", "http://llm.local/v1", "sk-test"),
        )

    with TestClient(app) as client:
        overrides = state._persisted_overrides
        assert overrides is not None
        assert (overrides["api_base"], overrides["api_key"]) == ("http://llm.local/v1", "sk-test")
        settings = client.get("/api/admin/settings").json()
        assert (settings["provider"], settings["model"]) == ("custom", "my-model")


@requires_db
def test_api_keys_round_trip(client):
    created = client.post("/api/admin/api-keys", json={"label": "ci", "scopes": ["read"]}).json()
    assert set(created) == {"id", "label", "key_prefix", "scopes", "key"}
    assert created["key"].startswith(created["key_prefix"])

    listed = client.get("/api/admin/api-keys").json()["api_keys"]
    assert [(k["id"], k["label"], k["scopes"]) for k in listed] == [(created["id"], "ci", ["read"])]
    assert set(listed[0]) == {"id", "label", "key_prefix", "scopes", "created_at", "last_used_at"}

    assert client.delete(f"/api/admin/api-keys/{created['id']}").json() == {"status": "success", "id": created["id"]}
    assert client.get("/api/admin/api-keys").json() == {"api_keys": []}


@requires_db
def test_disabled_schedules_stay_listed_and_workflow_delete_reports_them(client):
    definition = {"nodes": {"a": {"type": "FunctionExecutionNode", "code": "output = 1"}}, "connections": []}
    workflow_id = client.post("/api/workflows/", json={"name": "Nightly", "definition": definition}).json()[
        "workflow_id"
    ]
    schedule_id = client.post(
        "/api/cron/", json={"target_workflow_id": workflow_id, "schedule_description": "every 5 minutes"}
    ).json()["schedule_id"]

    toggled = client.patch(f"/api/cron/{schedule_id}/toggle", json={"enabled": False}).json()
    assert toggled["schedule"]["enabled"] is False

    schedules = client.get("/api/cron/").json()
    assert [(s["id"], s["enabled"]) for s in schedules["schedules"]] == [(schedule_id, False)]

    deleted = client.delete(f"/api/workflows/{workflow_id}").json()
    assert deleted["deleted_schedules"] == 1
    assert deleted["message"] == "Workflow removed with 1 associated schedules"
    assert client.get("/api/cron/").json()["total"] == 0
