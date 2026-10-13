"""The workflow routes: the definition a save answers with, and the status each kind of failure maps to."""

import psycopg
import pytest
from psycopg.types.json import Jsonb

from backend.main import app
from lib.workflows import workflow_service
from lib.workflows.errors import NotFoundError, ValidationError
from lib.workflows.functions import WORKFLOW_FUNCTIONS
from tests.db_support import requires_db


# Older spellings the service still accepts: 'function' for function_name, and a merge strategy it runs as 'merge'.
LEGACY_WORKFLOW = {
    "nodes": {
        "a": {"type": "FunctionExecutionNode", "function": "uuid_generate"},
        "m": {"type": "FlowMergeNode", "merge_strategy": "combine"},
    },
    "connections": [{"from_id": "a", "to_id": "m"}],
}
CANONICAL_WORKFLOW = {
    "nodes": {
        "a": {"type": "FunctionExecutionNode", "function_name": "uuid_generate"},
        "m": {"type": "FlowMergeNode", "merge_strategy": "merge"},
    },
    "connections": [{"from_id": "a", "to_id": "m"}],
}
UNKNOWN_FUNCTION = {"nodes": {"a": {"type": "FunctionExecutionNode", "function_name": "nope"}}, "connections": []}
UNKNOWN_FUNCTION_BODY = {
    "detail": "Invalid workflow definition: Node a calls unknown function 'nope'",
    "details": {"node_id": "a", "function_name": "nope", "available_functions": sorted(WORKFLOW_FUNCTIONS)},
}


def store_unchecked(database_url: str, workflow_id: str, definition: dict) -> None:
    """Writes a definition the service would refuse, as an older version or a hand edit could have left it."""
    with psycopg.connect(database_url, autocommit=True) as conn:
        conn.execute(
            "INSERT INTO workflows (id, name, definition) VALUES (%s, %s, %s)",
            (workflow_id, workflow_id, Jsonb(definition)),
        )


@requires_db
def test_create_and_update_answer_with_the_definition_as_stored(client):
    created = client.post("/api/workflows/", json={"name": "Legacy", "definition": LEGACY_WORKFLOW})
    assert created.status_code == 200
    workflow_id = created.json()["workflow_id"]
    assert created.json() == {
        "success": True,
        "workflow": CANONICAL_WORKFLOW,
        "workflow_id": workflow_id,
        "name": "Legacy",
        "description": None,
    }

    updated = client.patch(f"/api/workflows/{workflow_id}", json={"definition": LEGACY_WORKFLOW})
    assert (updated.status_code, updated.json()["workflow"]) == (200, CANONICAL_WORKFLOW)
    assert client.get(f"/api/workflows/{workflow_id}").json()["workflow"] == CANONICAL_WORKFLOW


def test_a_save_answers_404_when_the_workflow_is_gone_before_it_is_read_back(offline_client, monkeypatch):
    async def create_workflow(name, definition, description=None):
        return {"success": True, "workflow_id": "w1", "name": name, "description": description}

    async def get_workflow(workflow_id):
        return None

    monkeypatch.setattr(workflow_service, "create_workflow", create_workflow)
    monkeypatch.setattr(workflow_service, "get_workflow", get_workflow)

    response = offline_client.post("/api/workflows/", json={"name": "Gone", "definition": CANONICAL_WORKFLOW})

    assert (response.status_code, response.json()) == (404, {"detail": "Workflow w1 not found"})


def test_create_400_carries_the_validator_details_beside_the_message(offline_client):
    response = offline_client.post("/api/workflows/", json={"name": "Bad", "definition": UNKNOWN_FUNCTION})

    assert (response.status_code, response.json()) == (400, UNKNOWN_FUNCTION_BODY)


def test_create_400_without_details_is_the_message_alone(offline_client):
    response = offline_client.post("/api/workflows/", json={"name": "Bad", "definition": {"nodes": {}}})

    assert (response.status_code, response.json()) == (
        400,
        {"detail": "Invalid workflow definition: Definition must contain 'connections' key"},
    )


@requires_db
def test_update_400_carries_the_validator_details_beside_the_message(client):
    workflow_id = client.post("/api/workflows/", json={"name": "Good", "definition": CANONICAL_WORKFLOW}).json()[
        "workflow_id"
    ]

    response = client.patch(f"/api/workflows/{workflow_id}", json={"definition": UNKNOWN_FUNCTION})

    assert (response.status_code, response.json()) == (400, UNKNOWN_FUNCTION_BODY)


@requires_db
@pytest.mark.parametrize(
    ("definition", "detail"),
    [
        ({"nodes": {"a": {"type": "Nope"}}, "connections": []}, "Node a has invalid type 'Nope'"),
        (
            {"nodes": {"a": {"type": "FunctionExecutionNode", "function_name": "gone"}}, "connections": []},
            "Node a calls unknown function 'gone'",
        ),
    ],
)
def test_execute_answers_400_for_a_stored_definition_the_engine_rejects(client, database_url, definition, detail):
    store_unchecked(database_url, "stored", definition)

    response = client.post("/api/workflows/stored/execute", json={})

    assert response.status_code == 400
    assert response.json()["detail"] == f"Invalid workflow definition: {detail}"
    history = client.get("/api/workflows/stored/history").json()["history"]
    assert [(run["status"], run["error_message"]) for run in history] == [
        ("failed", f"Invalid workflow definition: {detail}")
    ]


@requires_db
@pytest.mark.parametrize("raised", ["RuntimeError", "ValueError"])
def test_a_failing_node_still_answers_500_naming_the_node(client, raised):
    definition = {
        "nodes": {"a": {"type": "FunctionExecutionNode", "code": f"raise {raised}('boom')"}},
        "connections": [],
    }
    workflow_id = client.post("/api/workflows/", json={"name": "Fails", "definition": definition}).json()["workflow_id"]

    response = client.post(f"/api/workflows/{workflow_id}/execute", json={})

    assert (response.status_code, response.json()) == (500, {"detail": "Node(s) failed: a"})


@pytest.mark.parametrize(
    ("error", "status", "body"),
    [
        (NotFoundError("Workflow w1 not found.", workflow_id="w1"), 404, {"detail": "Workflow w1 not found."}),
        (
            ValueError("Invalid workflow definition: Node a has invalid type 'Nope'"),
            400,
            {"detail": "Invalid workflow definition: Node a has invalid type 'Nope'"},
        ),
        (
            ValidationError(
                "Invalid workflow definition: Node a calls unknown function 'nope'", details={"node_id": "a"}
            ),
            400,
            {
                "detail": "Invalid workflow definition: Node a calls unknown function 'nope'",
                "details": {"node_id": "a"},
            },
        ),
    ],
)
def test_execute_maps_each_rejection_to_its_status(offline_client, monkeypatch, error, status, body):
    async def run(workflow_id, inputs=None):
        raise error

    monkeypatch.setattr(app.state.knik.scheduler, "run", run)

    response = offline_client.post("/api/workflows/w1/execute", json={})

    assert (response.status_code, response.json()) == (status, body)
