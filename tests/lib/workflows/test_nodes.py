"""Workflow nodes: every registered function runs as a node, and definition entries build the right nodes."""

import uuid
from datetime import datetime

import pytest

from lib.workflows.functions import WORKFLOW_FUNCTIONS
from lib.workflows.nodes import (
    AIExecutionNode,
    ConditionalBranchNode,
    EndNode,
    FlowMergeNode,
    FunctionExecutionNode,
    StartNode,
    build_node,
)
from tests.lib.workflows.support import answer_http_locally


@pytest.fixture
def fake_http(monkeypatch):
    answer_http_locally(monkeypatch)


def _is_iso_timestamp(output: dict) -> bool:
    return isinstance(datetime.fromisoformat(output["output"]), datetime)


def _is_uuid4(output: dict) -> bool:
    return uuid.UUID(output["output"]).version == 4


URL = "https://api.test/items"

# function -> (params, the node's whole output or a check of it)
FUNCTION_CASES = {
    "http_get": ({"url": URL}, lambda out: out["data"] == {"method": "GET", "body": None}),
    "http_post": ({"url": URL, "data": {"a": 1}}, lambda out: out["data"] == {"method": "POST", "body": {"a": 1}}),
    "http_request": (
        {"method": "put", "url": URL, "data": {"a": 1}},
        lambda out: out["data"] == {"method": "PUT", "body": {"a": 1}},
    ),
    "json_parse": ({"data": '{"a": 1}'}, {"status": "success", "a": 1}),
    "json_stringify": ({"data": {"a": 1}, "indent": None}, {"status": "success", "output": '{"a": 1}'}),
    "dict_get_path": ({"data": {"a": {"b": 2}}, "path": "a.b"}, {"status": "success", "output": 2}),
    "dict_merge": ({"dicts": [{"a": 1}, {"a": 2, "b": 3}]}, {"status": "success", "a": 2, "b": 3}),
    "dict_filter": ({"data": {"a": 1, "b": 2}, "keys": ["a"]}, {"status": "success", "a": 1}),
    "dict_set_path": ({"data": {"a": {}}, "path": "a.b", "value": 3}, {"status": "success", "a": {"b": 3}}),
    "string_format": ({"template": "Hello {name}", "name": "Ada"}, {"status": "success", "output": "Hello Ada"}),
    "string_replace": ({"text": "a-b", "old": "-", "new": "+"}, {"status": "success", "output": "a+b"}),
    "string_concat": ({"strings": ["a", "b", "c"]}, {"status": "success", "output": "abc"}),
    "string_join": ({"separator": ", ", "strings": ["a", "b"]}, {"status": "success", "output": "a, b"}),
    "string_split": ({"text": "a,b", "separator": ","}, {"status": "success", "output": ["a", "b"]}),
    "string_to_lower": ({"text": "AbC"}, {"status": "success", "output": "abc"}),
    "string_to_upper": ({"text": "AbC"}, {"status": "success", "output": "ABC"}),
    "string_strip": ({"text": "  x  "}, {"status": "success", "output": "x"}),
    "string_length": ({"text": "hello"}, {"status": "success", "output": "5"}),
    "sleep": ({"seconds": 0}, {"status": "success", "slept": 0}),
    "current_timestamp": ({}, _is_iso_timestamp),
    "uuid_generate": ({}, _is_uuid4),
    "base64_encode": ({"data": "knik"}, {"status": "success", "output": "a25paw=="}),
    "base64_decode": ({"data": "a25paw=="}, {"status": "success", "output": "knik"}),
    "run_shell_command": (
        {"command": "echo hi", "timeout": 5},
        lambda out: (out["result"], out["return_code"]) == ("hi", 0),
    ),
}


def test_every_registered_function_has_a_case():
    assert set(FUNCTION_CASES) == set(WORKFLOW_FUNCTIONS)


@pytest.mark.parametrize("function_name", sorted(FUNCTION_CASES))
@pytest.mark.asyncio
async def test_every_workflow_function_runs_as_a_node(function_name, fake_http):
    params, expected = FUNCTION_CASES[function_name]

    output = await FunctionExecutionNode("step", function_name, params).execute({"input": {}})

    assert output["status"] == "success"
    if callable(expected):
        assert expected(output)
    else:
        assert output == expected


@pytest.mark.asyncio
async def test_a_param_template_resolves_to_an_upstream_value_of_any_type():
    node = FunctionExecutionNode("step", "string_join", {"separator": "+", "strings": "{split.output}"})

    output = await node.execute({"input": {}, "split": {"status": "success", "output": ["a", "b"]}})

    assert output == {"status": "success", "output": "a+b"}


@pytest.mark.asyncio
async def test_a_none_result_is_an_output_too_and_an_error_dict_still_fails_the_node():
    missing = FunctionExecutionNode("step", "dict_get_path", {"data": {}, "path": "a"})
    assert await missing.execute({}) == {"status": "success", "output": None}

    broken = FunctionExecutionNode("step", "json_parse", {"data": "{not json"})
    with pytest.raises(RuntimeError, match="JSON parse failed"):
        await broken.execute({})


@pytest.mark.asyncio
async def test_a_shell_node_runs_under_the_blocklist_and_cannot_switch_it_off():
    blocked = FunctionExecutionNode("step", "run_shell_command", {"command": "echo fork"})
    with pytest.raises(RuntimeError, match="Command blocked for safety reasons"):
        await blocked.execute({})

    unblocking = FunctionExecutionNode("step", "run_shell_command", {"command": "echo fork", "blocked_commands": []})
    with pytest.raises(RuntimeError, match="unexpected keyword argument 'blocked_commands'"):
        await unblocking.execute({})


INPUTS = {"input": {"topic": "tides"}, "a": {"status": "success", "output": "A"}, "b": {"status": "ok", "extra": 1}}


@pytest.mark.parametrize("strategy", ["concat", "overwrite"])
@pytest.mark.asyncio
async def test_concat_and_overwrite_flatten_with_the_later_key_winning(strategy):
    merged = await FlowMergeNode("m", strategy).execute(INPUTS)

    assert merged == {"topic": "tides", "status": "ok", "output": "A", "extra": 1}


@pytest.mark.asyncio
async def test_merge_keeps_every_input_under_its_node_id():
    assert await FlowMergeNode("m", "merge").execute(INPUTS) == {"merged_inputs": INPUTS}


@pytest.mark.parametrize("marker", [StartNode, EndNode])
@pytest.mark.asyncio
async def test_start_and_end_nodes_do_nothing(marker):
    assert await marker("m").execute(INPUTS) == {}


@pytest.mark.parametrize("key", ["function_name", "function"])
def test_a_function_node_is_built_from_either_key(key):
    node = build_node("f", {"type": "FunctionExecutionNode", key: "sleep", "params": {"seconds": 1}})

    assert isinstance(node, FunctionExecutionNode)
    assert (node.function_name, node.params, node.code) == ("sleep", {"seconds": 1}, None)


def test_an_ai_node_takes_its_temperature_and_defaults_an_empty_model():
    node = build_node(
        "ai",
        {"type": "AIExecutionNode", "prompt": "Hi", "model": "", "temperature": 0.2, "agentName": "Helper"},
    )

    assert isinstance(node, AIExecutionNode)
    assert (node.prompt, node.model, node.provider, node.temperature, node.use_tools) == (
        "Hi",
        "gemini-3.0-flash",
        "vertex",
        0.2,
        True,
    )


def test_an_ai_node_without_settings_gets_the_configured_defaults():
    node = build_node("ai", {"type": "AIExecutionNode"})

    assert isinstance(node, AIExecutionNode)
    assert (node.prompt, node.model, node.provider, node.temperature, node.use_tools) == (
        "",
        "gemini-3.0-flash",
        "vertex",
        0.7,
        True,
    )


@pytest.mark.parametrize(
    ("data", "strategy"),
    [
        ({"type": "FlowMergeNode"}, "concat"),
        ({"type": "FlowMergeNode", "merge_strategy": "overwrite"}, "overwrite"),
        ({"type": "FlowMergeNode", "merge_strategy": "union"}, "merge"),
    ],
)
def test_a_merge_node_is_built_with_its_canonical_strategy(data, strategy):
    node = build_node("m", data)

    assert isinstance(node, FlowMergeNode)
    assert node.merge_strategy == strategy


def test_branch_and_marker_nodes_are_built_with_their_own_class_names():
    branch = build_node("c", {"type": "ConditionalBranchNode", "condition": "1 > 0"})
    assert isinstance(branch, ConditionalBranchNode) and branch.condition == "1 > 0"

    # The engine records a step's node type by class name, so the builder's markers keep their names.
    start = build_node("s", {"type": "StartNode", "label": "Go"})
    end = build_node("e", {"type": "EndNode"})
    assert (type(start).__name__, type(end).__name__) == ("StartNode", "EndNode")


def test_an_unknown_node_type_is_a_value_error():
    with pytest.raises(ValueError, match="Unknown node type 'Teleport' for node x"):
        build_node("x", {"type": "Teleport"})
