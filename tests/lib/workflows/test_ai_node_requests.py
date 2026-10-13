"""What an AI node sends to the model: its settings reach the request whether or not it uses tools."""

import functools
import json

import httpx
import pytest
from langchain_openai import ChatOpenAI

from lib.services.ai_client.providers import custom_provider
from lib.tools.index import build_workflow_client
from lib.workflows.nodes import build_node


COMPLETION = {
    "id": "chatcmpl-1",
    "object": "chat.completion",
    "created": 0,
    "model": "m",
    "choices": [{"index": 0, "message": {"role": "assistant", "content": "ok"}, "finish_reason": "stop"}],
    "usage": {"prompt_tokens": 3, "completion_tokens": 1, "total_tokens": 4},
}


@pytest.fixture
def model_requests(monkeypatch) -> list[dict]:
    """The request bodies the custom (OpenAI-compatible) provider sends, each answered "ok" without the network."""
    requests: list[dict] = []

    def answer(request: httpx.Request) -> httpx.Response:
        requests.append(json.loads(request.content))
        return httpx.Response(200, json=COMPLETION)

    # Hand the provider's model a client of our own: patching a transport class misses SDKs that send through another
    # HTTP library (openai 3 uses httpx2, not httpx).
    client = httpx.Client(transport=httpx.MockTransport(answer))
    monkeypatch.setattr(custom_provider, "ChatOpenAI", functools.partial(ChatOpenAI, http_client=client))
    monkeypatch.setenv("KNIK_CUSTOM_API_BASE", "http://model.test/v1")
    return requests


@pytest.mark.parametrize("use_tools", [False, True])
@pytest.mark.asyncio
async def test_an_ai_node_sends_its_temperature_to_the_model(use_tools, model_requests):
    node = build_node(
        "ai",
        {
            "type": "AIExecutionNode",
            "prompt": "Hi",
            "provider": "custom",
            "model": "m",
            "temperature": 0.2,
            "use_tools": use_tools,
        },
        ai_client_factory=build_workflow_client,
    )

    output = await node.execute({})

    assert output["output"] == "ok"
    assert [request["temperature"] for request in model_requests] == [0.2]
    # With tools the call goes through the agent, which sends the tool definitions.
    assert ("tools" in model_requests[0]) is use_tools
