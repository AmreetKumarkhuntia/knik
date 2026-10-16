"""The FastAPI app: boots without a database, answers 503 for database routes then, and works against a real one."""

import time
from unittest.mock import MagicMock

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.types.json import Jsonb

from backend.main import app
from backend.settings_service import SECRET_MASK
from lib.tools.shell_tool import ShellTool
from tests.db_support import requires_db


SHELL_TOOLS = {definition["name"] for definition in ShellTool().get_definitions()}
FUNCTION_WORKFLOW = {"nodes": {"a": {"type": "FunctionExecutionNode", "code": "output = 1"}}, "connections": []}


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
    ("DELETE", "/api/admin/settings/voice_name"),
]


def settings_by_key(client: TestClient) -> dict[str, dict]:
    return {item["key"]: item for item in client.get("/api/admin/settings").json()["settings"]}


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


def test_a_body_that_is_not_json_is_refused_before_any_route_runs(offline_client):
    """A browser sends these from any origin without a CORS preflight, so they must not write anything."""
    for headers in ({}, {"content-type": "text/plain"}):
        response = offline_client.post("/api/admin/settings", content=b'{"display_name": "pwned"}', headers=headers)
        assert (response.status_code, response.json()) == (415, {"detail": "Content-Type must be application/json"})
    assert offline_client.get("/api/admin/settings").status_code == 200
    assert offline_client.delete("/api/admin/settings/voice_name").status_code == 503


def test_settings_and_tool_list_fall_back_to_defaults_without_database(offline_client, config):
    assert offline_client.get("/api/admin/settings").status_code == 200
    body = settings_by_key(offline_client)
    assert (body["ai_provider"]["value"], body["ai_model"]["value"], body["voice_name"]["value"]) == (
        config.ai_provider,
        config.ai_model,
        config.voice_name,
    )
    assert (body["stream_responses"]["value"], body["send_telemetry"]["value"]) == (True, False)
    assert {item["source"] for item in body.values()} <= {"env", "default"}

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
def test_deleting_a_conversation_releases_only_its_cached_client(client):
    conversation_id = client.post("/api/conversations/", json={"title": "Doomed"}).json()["id"]
    state = app.state.knik
    doomed = MagicMock(spec=["tool_registry"])
    other = MagicMock(spec=["tool_registry"])
    state.clients.set(conversation_id, doomed)
    state.clients.set("other-conversation", other)

    assert client.delete(f"/api/conversations/{conversation_id}").json() == {"status": "deleted", "id": conversation_id}

    # The cleanup runs in a worker thread, off the event loop.
    deadline = time.monotonic() + 5
    while not doomed.tool_registry.cleanup_tools.called and time.monotonic() < deadline:
        time.sleep(0.01)
    doomed.tool_registry.cleanup_tools.assert_called_once_with()
    other.tool_registry.cleanup_tools.assert_not_called()
    assert state.clients.get(conversation_id) is None
    state.remove_client("other-conversation")


@requires_db
def test_startup_loads_stored_settings_including_api_base_and_key(database_url):
    stored = {
        "ai_provider": "custom",
        "ai_model": "my-model",
        "voice_name": "am_adam",
        "temperature": 0.2,
        "max_tokens": 512,
        "custom_api_base": "http://llm.local/v1",
        "custom_api_key": "sk-test",
    }
    with psycopg.connect(database_url, autocommit=True) as conn:
        for key, value in stored.items():
            conn.execute("INSERT INTO settings (key, value) VALUES (%s, %s)", (key, Jsonb(value)))

    with TestClient(app) as client:
        state = app.state.knik
        client_settings = state.settings.client_settings
        assert (client_settings.provider, client_settings.model) == ("custom", "my-model")
        assert (client_settings.api_base, client_settings.api_key) == ("http://llm.local/v1", "sk-test")
        assert (client_settings.temperature, client_settings.max_tokens) == (0.2, 512)
        assert (state.tts.voice, state.tts.loaded) == ("am_adam", True)
        settings = settings_by_key(client)
        assert {key: settings[key]["value"] for key in stored} == {**stored, "custom_api_key": SECRET_MASK}
        assert {settings[key]["source"] for key in stored} == {"db"}


@requires_db
def test_settings_update_is_persisted_and_used_by_new_clients(client, config):
    state = app.state.knik
    state.clients.set("built-before", MagicMock(spec=["tool_registry"]))
    update = {"temperature": 0.3, "max_tokens": 256, "custom_api_base": "http://llm.local/v1", "custom_api_key": "sk-1"}

    assert client.post(
        "/api/admin/settings", json={**update, "voice_name": "am_adam", "display_name": "Ada"}
    ).json() == {"status": "success", "message": "Settings updated"}

    client_settings = state.settings.client_settings
    assert (client_settings.temperature, client_settings.max_tokens) == (0.3, 256)
    assert (client_settings.api_base, client_settings.api_key) == ("http://llm.local/v1", "sk-1")
    assert state.clients.get("built-before") is None
    assert state.tts.voice == "am_adam"
    settings = settings_by_key(client)
    assert (settings["temperature"]["value"], settings["max_tokens"]["value"]) == (0.3, 256)
    assert (settings["voice_name"]["value"], settings["display_name"]["value"]) == ("am_adam", "Ada")
    assert (settings["custom_api_key"]["value"], settings["display_name"]["source"]) == (SECRET_MASK, "db")

    # A bad value is refused as a whole and changes nothing.
    rejected = client.post("/api/admin/settings", json={"temperature": "hot", "voice_name": "af_sky"})
    assert (rejected.status_code, rejected.json()) == (422, {"detail": "temperature must be float"})
    assert (state.settings.client_settings.temperature, state.tts.voice) == (0.3, "am_adam")

    # Forgetting a stored value puts the env one back.
    assert client.delete("/api/admin/settings/voice_name").json() == {"status": "success", "key": "voice_name"}
    assert state.tts.voice == config.voice_name
    assert settings_by_key(client)["voice_name"]["source"] != "db"

    # What a restart reads back is what is in effect now.
    with TestClient(app):
        restarted = app.state.knik.settings.client_settings
        assert (restarted.temperature, restarted.max_tokens, restarted.api_base, restarted.api_key) == (
            0.3,
            256,
            "http://llm.local/v1",
            "sk-1",
        )
        assert app.state.knik.tts.voice == config.voice_name


@requires_db
def test_switching_a_tool_group_off_leaves_it_out_of_a_new_client(client):
    def chat_tools() -> set[str]:
        conversation_id = client.post("/api/chat/", json={"message": "hello"}).json()["conversation_id"]
        cached = app.state.knik.clients.get(conversation_id)
        return {tool["name"] for tool in cached.tool_registry.get_tools()}

    assert chat_tools() >= SHELL_TOOLS

    assert client.put("/api/admin/mcp-tools/shell", json={"enabled": False}).json() == {
        "status": "success",
        "tool_name": "shell",
        "enabled": False,
    }
    tools = chat_tools()
    assert tools and not tools & SHELL_TOOLS
    listed = {group["name"]: group["enabled"] for group in client.get("/api/admin/mcp-tools").json()["tools"]}
    assert listed["shell"] is False

    client.put("/api/admin/mcp-tools/shell", json={"enabled": True})
    assert chat_tools() >= SHELL_TOOLS


@requires_db
def test_a_disabled_tool_group_stays_off_after_a_restart(database_url):
    with psycopg.connect(database_url, autocommit=True) as conn:
        conn.execute("INSERT INTO mcp_tools_state (tool_name, enabled) VALUES ('shell', false)")

    with TestClient(app):
        tools = {tool["name"] for tool in app.state.knik.settings.build_client().tool_registry.get_tools()}
        assert tools and not tools & SHELL_TOOLS


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
    workflow_id = client.post("/api/workflows/", json={"name": "Nightly", "definition": FUNCTION_WORKFLOW}).json()[
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


@requires_db
def test_workflow_errors_keep_their_statuses_and_bodies(client):
    invalid = {"nodes": {"a": {"type": "Nope"}}, "connections": []}
    created = client.post("/api/workflows/", json={"name": "Bad", "definition": invalid})
    assert (created.status_code, created.json()["detail"]) == (
        400,
        "Invalid workflow definition: Node a has invalid type 'Nope'",
    )

    workflow_id = client.post("/api/workflows/", json={"name": "Good", "definition": FUNCTION_WORKFLOW}).json()[
        "workflow_id"
    ]
    updated = client.patch(f"/api/workflows/{workflow_id}", json={"name": "Good", "definition": invalid})
    assert (updated.status_code, updated.json()["detail"]) == (
        400,
        "Invalid workflow definition: Node a has invalid type 'Nope'",
    )

    missing = {"name": "x", "definition": FUNCTION_WORKFLOW}
    for response in (
        client.patch("/api/workflows/ghost", json=missing),
        client.patch("/api/workflows/ghost", json={"name": "only a name"}),
        client.delete("/api/workflows/ghost"),
    ):
        assert (response.status_code, response.json()) == (404, {"detail": "Workflow ghost not found"})

    executed = client.post("/api/workflows/ghost/execute", json={})
    assert (executed.status_code, executed.json()) == (404, {"detail": "Workflow ghost not found."})


@requires_db
def test_patch_keeps_the_fields_it_leaves_out(client):
    created = client.post(
        "/api/workflows/", json={"name": "Nightly", "description": "d", "definition": FUNCTION_WORKFLOW}
    ).json()
    workflow_id = created["workflow_id"]

    renamed = client.patch(f"/api/workflows/{workflow_id}", json={"name": "Renamed"}).json()
    assert renamed == {
        "success": True,
        "workflow": FUNCTION_WORKFLOW,
        "workflow_id": workflow_id,
        "name": "Renamed",
        "description": "d",
    }

    other = {"nodes": {"b": {"type": "FunctionExecutionNode", "code": "output = 2"}}, "connections": []}
    redefined = client.patch(f"/api/workflows/{workflow_id}", json={"definition": other, "description": None}).json()
    assert (redefined["name"], redefined["workflow"], redefined["description"]) == ("Renamed", other, "d")
    assert client.get(f"/api/workflows/{workflow_id}").json()["workflow"] == other


@requires_db
def test_execute_runs_the_workflow_on_the_shared_scheduler(client):
    workflow_id = client.post("/api/workflows/", json={"name": "Once", "definition": FUNCTION_WORKFLOW}).json()[
        "workflow_id"
    ]

    executed = client.post(f"/api/workflows/{workflow_id}/execute", json={"inputs": {"n": 1}})

    assert executed.status_code == 200
    assert executed.json()["success"] is True
    assert [entry["status"] for entry in client.get(f"/api/workflows/{workflow_id}/history").json()["history"]] == [
        "success"
    ]


@requires_db
def test_schedule_errors_answer_400_with_the_error_dict(client):
    workflow_id = client.post("/api/workflows/", json={"name": "Nightly", "definition": FUNCTION_WORKFLOW}).json()[
        "workflow_id"
    ]

    def add(**body):
        response = client.post(
            "/api/cron/", json={"target_workflow_id": workflow_id, "schedule_description": "hourly", **body}
        )
        return response.status_code, response.json()

    assert add(target_workflow_id="") == (400, {"detail": {"error": "target_workflow_id is required"}})
    assert add(schedule_description="") == (400, {"detail": {"error": "schedule_description is required"}})
    status, body = add(schedule_description="whenever")
    assert status == 400
    assert body["detail"]["error"].startswith("Invalid schedule description: ")
    assert body["detail"]["hint"].startswith("Try formats like")
    status, body = add(timezone="Mars/Base")
    assert status == 400
    assert list(body["detail"]) == ["error"]
    assert body["detail"]["error"].startswith("Invalid timezone: 'Mars/Base'")
