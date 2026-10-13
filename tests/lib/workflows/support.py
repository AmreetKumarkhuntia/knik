"""Definitions and fakes shared by the workflow tests."""

import json
from unittest.mock import MagicMock

import httpx
import pytest

from lib.services.ai_client.factory import ClientSettings


# What the web builder saves: StartNode/EndNode markers with labels, function_name, the builder's merge strategy
# names, AI settings with editor-only keys, and branch conditions on the edges that leave a ConditionalBranchNode.
FRONTEND_DEFINITION = {
    "nodes": {
        "start": {"type": "StartNode", "label": "Start"},
        "shout": {
            "type": "FunctionExecutionNode",
            "function_name": "string_to_upper",
            "params": {"text": "{input.topic}"},
        },
        "check": {"type": "ConditionalBranchNode", "condition": "True"},
        "summarize": {
            "type": "AIExecutionNode",
            "prompt": "Summarise {input.topic}",
            "model": "",
            "temperature": 0.2,
            "use_tools": False,
            "agentName": "AI Agent",
            "maxTokens": 2048,
            "outputVariables": [],
        },
        "skipped": {"type": "EndNode", "label": "Rejected"},
        "merge": {"type": "FlowMergeNode", "merge_strategy": "overwrite"},
        "end": {"type": "EndNode", "label": "End"},
    },
    "connections": [
        {"from_id": "start", "to_id": "shout"},
        {"from_id": "shout", "to_id": "check"},
        {"from_id": "check", "to_id": "summarize", "condition": "true"},
        {"from_id": "check", "to_id": "skipped", "condition": "false"},
        {"from_id": "summarize", "to_id": "merge"},
        {"from_id": "shout", "to_id": "merge"},
        {"from_id": "merge", "to_id": "end"},
    ],
}

# Written the way the engine and the AI tools wrote definitions before function_name was canonical.
LEGACY_DEFINITION = {
    "nodes": {
        "now": {"type": "FunctionExecutionNode", "function": "current_timestamp"},
        "shout": {"type": "FunctionExecutionNode", "function": "string_to_upper", "params": {"text": "{input.topic}"}},
        "merge": {"type": "FlowMergeNode", "merge_strategy": "merge"},
    },
    "connections": [{"from_id": "now", "to_id": "merge"}, {"from_id": "shout", "to_id": "merge"}],
}

LEGACY_DEFINITION_CANONICAL = {
    "nodes": {
        "now": {"type": "FunctionExecutionNode", "function_name": "current_timestamp"},
        "shout": {
            "type": "FunctionExecutionNode",
            "function_name": "string_to_upper",
            "params": {"text": "{input.topic}"},
        },
        "merge": {"type": "FlowMergeNode", "merge_strategy": "merge"},
    },
    "connections": [{"from_id": "now", "to_id": "merge"}, {"from_id": "shout", "to_id": "merge"}],
}


def answer_http_locally(monkeypatch: pytest.MonkeyPatch) -> None:
    """httpx clients answer every request without the network, echoing its method and JSON body."""

    def answer(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content) if request.content else None
        return httpx.Response(200, json={"method": request.method, "body": body})

    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx, "AsyncClient", lambda **kwargs: real_client(transport=httpx.MockTransport(answer), **kwargs)
    )


class RecordingAIFactory:
    """An AI client factory whose clients answer "summary" and that records the settings it was given."""

    def __init__(self) -> None:
        self.calls: list[tuple[ClientSettings, bool]] = []
        self.client = MagicMock()
        self.client.chat.return_value = "summary"
        self.client.last_usage = {"input_tokens": 3, "output_tokens": 2, "total_tokens": 5}

    def __call__(self, settings: ClientSettings, use_tools: bool) -> MagicMock:
        self.calls.append((settings, use_tools))
        return self.client
