"""Which conversations the web sees: its own and the legacy ones, never a Telegram user's, through any route."""

import json

import psycopg
import pytest

from tests.db_support import requires_db


TELEGRAM_USER = "usr_0123456789ab"


@pytest.fixture
def seeded(database_url) -> dict[str, str]:
    """One conversation of each kind, oldest first: a Telegram user's, a web one and a legacy one."""
    with psycopg.connect(database_url, autocommit=True) as conn:
        # Users rows outlive the per-test truncate (tests/db_support.TABLES does not list them), hence the guard.
        conn.execute(
            "INSERT INTO users (id, source, external_id) VALUES (%s, 'telegram', %s) ON CONFLICT DO NOTHING",
            (TELEGRAM_USER, TELEGRAM_USER),
        )
        rows = [
            ("telegram", "Telegram chat", TELEGRAM_USER, "telegram"),
            ("web", "Web chat", None, "web"),
            ("legacy", "Legacy chat", None, None),
        ]
        for i, (name, title, user_id, source) in enumerate(rows):
            conn.execute(
                "INSERT INTO conversations (id, title, user_id, source, updated_at) "
                "VALUES (%s, %s, %s, %s, now() - make_interval(mins => %s))",
                (f"{name}-conversation", title, user_id, source, len(rows) - i),
            )
    return {name: f"{name}-conversation" for name, *_ in rows}


def _row(database_url: str, conversation_id: str) -> dict | None:
    with psycopg.connect(database_url, row_factory=psycopg.rows.dict_row) as conn:
        return conn.execute(
            "SELECT title, user_id, source, jsonb_array_length(messages) AS messages FROM conversations WHERE id = %s",
            (conversation_id,),
        ).fetchone()


def _events(body: str) -> dict[str, list[dict]]:
    events: dict[str, list[dict]] = {}
    for frame in body.strip().split("\n\n"):
        event, data = frame.split("\n", 1)
        events.setdefault(event.removeprefix("event: "), []).append(json.loads(data.removeprefix("data: ")))
    return events


@requires_db
def test_the_list_shows_web_and_legacy_conversations_and_no_telegram_ones(client, seeded):
    listing = client.get("/api/conversations/").json()

    assert [(c["id"], c["source"]) for c in listing["conversations"]] == [
        (seeded["legacy"], None),
        (seeded["web"], "web"),
    ]
    assert listing["count"] == 2


@requires_db
def test_a_telegram_conversation_is_not_found_by_id(client, seeded, database_url):
    telegram = seeded["telegram"]

    for response in (
        client.get(f"/api/conversations/{telegram}"),
        client.get(f"/api/conversations/{telegram}/messages"),
        client.patch(f"/api/conversations/{telegram}", json={"title": "Mine now"}),
        client.delete(f"/api/conversations/{telegram}"),
    ):
        assert (response.status_code, response.json()) == (404, {"detail": "Conversation not found"})

    assert _row(database_url, telegram) == {
        "title": "Telegram chat",
        "user_id": TELEGRAM_USER,
        "source": "telegram",
        "messages": 0,
    }


@requires_db
def test_web_and_legacy_conversations_can_be_opened_renamed_and_deleted(client, seeded):
    for name in ("web", "legacy"):
        conversation_id = seeded[name]
        assert client.get(f"/api/conversations/{conversation_id}").json()["id"] == conversation_id
        assert client.get(f"/api/conversations/{conversation_id}/messages").json()["count"] == 0
        assert client.patch(f"/api/conversations/{conversation_id}", json={"title": "Renamed"}).status_code == 200
        assert client.delete(f"/api/conversations/{conversation_id}").json() == {
            "status": "deleted",
            "id": conversation_id,
        }


@requires_db
def test_conversations_the_web_creates_are_web_ones(client, database_url):
    created = client.post("/api/conversations/", json={"title": "New"}).json()["id"]
    chatted = client.post("/api/chat/", json={"message": "hello"}).json()["conversation_id"]
    streamed = _events(client.post("/api/chat/stream/", json={"message": "hello"}).text)["conversation_id"][0]

    for conversation_id in (created, chatted, streamed["conversation_id"]):
        assert _row(database_url, conversation_id)["source"] == "web"
        assert _row(database_url, conversation_id)["user_id"] is None


@requires_db
def test_the_chat_routes_refuse_a_telegram_conversation(client, seeded, database_url):
    for path in ("/api/chat/", "/api/chat/stream/"):
        response = client.post(path, json={"message": "hello", "conversation_id": seeded["telegram"]})

        assert (response.status_code, response.json()) == (404, {"detail": "Conversation not found"})
    assert _row(database_url, seeded["telegram"])["messages"] == 0


@requires_db
def test_the_chat_routes_continue_a_legacy_conversation(client, seeded, database_url):
    chatted = client.post("/api/chat/", json={"message": "hello", "conversation_id": seeded["legacy"]}).json()
    streamed = client.post("/api/chat/stream/", json={"message": "again", "conversation_id": seeded["legacy"]})

    assert chatted["conversation_id"] == seeded["legacy"]
    assert _events(streamed.text)["conversation_id"] == [{"conversation_id": seeded["legacy"]}]
    row = _row(database_url, seeded["legacy"])
    assert (row["user_id"], row["source"], row["messages"]) == (None, None, 4)


@requires_db
def test_a_chat_with_an_unknown_conversation_id_starts_a_web_conversation(client, database_url):
    chatted = client.post("/api/chat/", json={"message": "hello", "conversation_id": "gone"}).json()

    assert chatted["conversation_id"] != "gone"
    assert _row(database_url, chatted["conversation_id"])["source"] == "web"


def test_without_a_database_a_chat_with_a_conversation_id_still_answers(offline_client):
    chatted = offline_client.post("/api/chat/", json={"message": "hello", "conversation_id": "some-id"})
    streamed = offline_client.post("/api/chat/stream/", json={"message": "hello", "conversation_id": "some-id"})

    assert chatted.status_code == 200
    assert chatted.json()["text"]
    assert chatted.json()["conversation_id"] is None
    assert streamed.status_code == 200
    assert "conversation_id" not in _events(streamed.text)
    assert _events(streamed.text)["done"]
