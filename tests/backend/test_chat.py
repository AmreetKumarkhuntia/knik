"""The unified chat route (reply text plus its audio) and the request body both chat routes accept."""

import numpy as np

from backend.main import app
from backend.routes import chat_stream


USAGE = {"input_tokens": 100, "output_tokens": 20, "total_tokens": 120}


def test_unified_chat_answers_with_text_and_audio(monkeypatch, offline_client):
    class ChatClient:
        tool_registry = None

        async def achat(self, prompt, *, conversation_id=None, provider_meta=None, **kwargs):
            return f"echo: {prompt}", "conv-9", USAGE

    state = app.state.knik
    cached: list[tuple[str, object]] = []

    async def get_client(conversation_id):
        return ChatClient()

    monkeypatch.setattr(state, "get_client", get_client)
    monkeypatch.setattr(state, "set_client", lambda conversation_id, client: cached.append((conversation_id, client)))

    response = offline_client.post("/api/chat/", json={"message": "hello", "conversation_id": None})

    assert response.status_code == 200
    body = response.json()
    audio = chat_stream._encode_audio(np.zeros(4, dtype=np.float32), 24000)
    assert body == {
        "text": "echo: hello",
        "audio": audio,
        "sample_rate": state.config.sample_rate,
        "conversation_id": "conv-9",
        "usage": USAGE,
    }
    assert [conversation_id for conversation_id, _ in cached] == ["conv-9"]


def test_chat_routes_accept_only_the_plain_request_object(offline_client):
    assert offline_client.post("/api/chat/", json={"request": {"message": "hi"}}).status_code == 422
    assert offline_client.post("/api/chat/stream/", json={}).status_code == 422


def test_a_client_that_cannot_be_built_answers_500_with_the_error(monkeypatch, offline_client):
    async def get_client(conversation_id):
        raise RuntimeError("no provider")

    monkeypatch.setattr(app.state.knik, "get_client", get_client)

    response = offline_client.post("/api/chat/", json={"message": "hello"})

    assert (response.status_code, response.json()) == (500, {"detail": "no provider"})


def test_an_invalid_body_reports_each_error_once(offline_client):
    for path in ("/api/chat/", "/api/chat/stream/"):
        detail = offline_client.post(path, json={"conversation_id": "c1"}).json()["detail"]
        assert [(error["loc"], error["type"]) for error in detail] == [(["body", "message"], "missing")]
