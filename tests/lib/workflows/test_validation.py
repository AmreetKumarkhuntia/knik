"""validate_workflow_definition: the schema checks and the function names, on top of the DAG checks."""

import pytest

from lib.workflows.functions import WORKFLOW_FUNCTIONS
from lib.workflows.validation import validate_workflow_definition
from tests.lib.workflows.support import FRONTEND_DEFINITION


def _single(node: dict) -> dict:
    return {"nodes": {"a": node}, "connections": []}


def test_a_frontend_definition_with_start_and_end_nodes_is_valid():
    assert validate_workflow_definition(FRONTEND_DEFINITION) == {
        "valid": True,
        "message": "Workflow definition is valid",
    }


@pytest.mark.parametrize("key", ["function_name", "function"])
def test_a_function_that_is_not_registered_is_rejected(key):
    result = validate_workflow_definition(_single({"type": "FunctionExecutionNode", key: "fetch_source_data"}))

    assert result == {
        "valid": False,
        "message": "Node a calls unknown function 'fetch_source_data'",
        "details": {
            "node_id": "a",
            "function_name": "fetch_source_data",
            "available_functions": sorted(WORKFLOW_FUNCTIONS),
        },
    }


def test_inline_code_needs_no_registered_function():
    node = {"type": "FunctionExecutionNode", "function_name": "custom", "code": "output = 1"}

    assert validate_workflow_definition(_single(node))["valid"] is True


@pytest.mark.parametrize(
    ("node", "message", "details"),
    [
        (
            {"type": "FunctionExecutionNode", "params": {}},
            "Node a: a FunctionExecutionNode needs a function_name or code",
            {"node_id": "a"},
        ),
        (
            {"type": "FunctionExecutionNode", "function_name": "sleep", "params": [1]},
            "Node a field 'params': Input should be a valid dictionary",
            {"node_id": "a", "field": "params"},
        ),
        (
            {"type": "AIExecutionNode", "prompt": "Hi", "temperature": "warm"},
            "Node a field 'temperature': Input should be a valid number, unable to parse string as a number",
            {"node_id": "a", "field": "temperature"},
        ),
    ],
)
def test_a_node_field_the_schema_rejects_is_reported_with_its_node(node, message, details):
    assert validate_workflow_definition(_single(node)) == {"valid": False, "message": message, "details": details}


def test_a_connection_field_the_schema_rejects_is_reported_with_its_index():
    definition = {
        "nodes": {"a": {"type": "StartNode"}, "b": {"type": "EndNode"}},
        "connections": [{"from_id": "a", "to_id": "b", "condition": True}],
    }

    assert validate_workflow_definition(definition) == {
        "valid": False,
        "message": "Connection 0 field 'condition': Input should be a valid string",
        "details": {"connection_index": 0, "field": "condition"},
    }


@pytest.mark.parametrize(
    ("definition", "message"),
    [
        ({"nodes": [], "connections": []}, "'nodes' must be a dictionary of node id to node"),
        ({"nodes": {}, "connections": {}}, "'connections' must be a list"),
    ],
)
def test_nodes_and_connections_of_the_wrong_kind_are_reported_not_raised(definition, message):
    assert validate_workflow_definition(definition) == {"valid": False, "message": message}
