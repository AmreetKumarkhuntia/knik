"""The workflow definition schema: the canonical form is what the web builder sends; older spellings are rewritten."""

import copy

import pytest

from lib.workflows.schema import normalize_definition
from tests.lib.workflows.support import FRONTEND_DEFINITION


def test_a_frontend_definition_is_already_canonical():
    sent = copy.deepcopy(FRONTEND_DEFINITION)

    assert normalize_definition(sent) == FRONTEND_DEFINITION
    assert sent == FRONTEND_DEFINITION


def test_older_spellings_are_rewritten_and_everything_else_is_kept():
    legacy = {
        "nodes": {
            "wait": {"type": "FunctionExecutionNode", "function": "sleep", "params": {"seconds": 1}, "label": "Pause"},
            "both": {"type": "FunctionExecutionNode", "function": "sleep", "function_name": "uuid_generate"},
            "nested": {"type": "FlowMergeNode", "merge_strategy": "merge"},
            "unknown": {"type": "FlowMergeNode", "merge_strategy": "union"},
            "flat": {"type": "FlowMergeNode"},
        },
        "connections": [{"from_id": "wait", "to_id": "nested", "id": "edge-1"}],
        "canvas": {"zoom": 1},
    }

    canonical = normalize_definition(legacy)

    assert canonical == {
        "nodes": {
            "wait": {
                "type": "FunctionExecutionNode",
                "function_name": "sleep",
                "params": {"seconds": 1},
                "label": "Pause",
            },
            # function_name is the canonical key, so it wins over a leftover function.
            "both": {"type": "FunctionExecutionNode", "function_name": "uuid_generate"},
            "nested": {"type": "FlowMergeNode", "merge_strategy": "merge"},
            # The node always ran a strategy it did not know as 'merge'.
            "unknown": {"type": "FlowMergeNode", "merge_strategy": "merge"},
            "flat": {"type": "FlowMergeNode"},
        },
        "connections": [{"from_id": "wait", "to_id": "nested", "id": "edge-1"}],
        "canvas": {"zoom": 1},
    }
    assert normalize_definition(canonical) == canonical


@pytest.mark.parametrize(
    "definition",
    [
        None,
        {"nodes": {}},
        {"nodes": {"a": {"type": "Teleport"}}, "connections": []},
        {"nodes": {"a": {"type": "FunctionExecutionNode"}}, "connections": []},
    ],
)
def test_a_definition_that_does_not_parse_is_returned_unchanged(definition):
    # Reading a stored workflow must never fail; validation reports what is wrong with it.
    assert normalize_definition(definition) is definition
