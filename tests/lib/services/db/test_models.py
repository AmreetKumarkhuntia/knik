"""Row models: mapping from rows, round-trips, and the exact dict shapes the API and callers rely on."""

import dataclasses
from datetime import UTC, datetime
from decimal import Decimal

import pytest

from lib.services.db.models import (
    ApiKey,
    AppSettings,
    Conversation,
    ConversationMessage,
    CreatedApiKey,
    ExecutionRecord,
    McpToolState,
    NodeExecutionRecord,
    Schedule,
    Workflow,
    isoformat,
)
from lib.services.db.repositories.base import json_param, to_model, to_models


T0 = datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)
T1 = datetime(2026, 1, 3, 3, 4, 5, tzinfo=UTC)


def test_isoformat_handles_none():
    assert isoformat(None) is None
    assert isoformat(T0) == "2026-01-02T03:04:05+00:00"


def test_conversation_message_round_trip():
    data = {"role": "assistant", "content": "hi", "timestamp": "2026-01-01T00:00:00", "metadata": {"usage": {}}}
    assert ConversationMessage.from_dict(data).to_dict() == data


def test_conversation_message_defaults():
    message = ConversationMessage.from_dict({})
    assert (message.role, message.content, message.metadata) == ("user", "", {})
    assert message.timestamp


def test_conversation_from_full_row_derives_preview_and_count():
    row = {
        "id": "c1",
        "title": "Chat",
        "messages": [
            {"role": "user", "content": "first", "timestamp": "t1", "metadata": {}},
            {"role": "assistant", "content": "last", "timestamp": "t2", "metadata": {}},
        ],
        "created_at": T0,
        "updated_at": T1,
        "summary_message_id": None,
        "compacted_count": None,
        "total_tokens": None,
    }
    conversation = Conversation.from_row(row)
    assert conversation.message_count == 2
    assert conversation.preview == "last"
    assert conversation.compacted_count == 0
    assert conversation.total_tokens == 0
    assert conversation.to_dict() == {
        "id": "c1",
        "title": "Chat",
        "messages": row["messages"],
        "created_at": T0.isoformat(),
        "updated_at": T1.isoformat(),
        "summary_message_id": None,
        "compacted_count": 0,
        "total_tokens": 0,
        "preview": "last",
        "message_count": 2,
    }


def test_conversation_from_list_row_keeps_supplied_preview_and_count():
    row = {"id": "c1", "title": None, "messages": [], "message_count": 7, "preview": "p", "created_at": None}
    conversation = Conversation.from_row(row)
    assert (conversation.messages, conversation.message_count, conversation.preview) == ([], 7, "p")
    assert conversation.to_dict()["created_at"] is None


def test_workflow_has_each_column_once_and_no_phantom_last_executed_at():
    names = [f.name for f in dataclasses.fields(Workflow)]
    assert names == ["id", "name", "definition", "description", "created_at", "updated_at"]


def test_workflow_from_row_and_to_dict():
    row = {
        "id": "w1",
        "name": "Flow",
        "description": None,
        "definition": {"nodes": {}},
        "created_at": T0,
        "updated_at": None,
    }
    workflow = Workflow.from_row(row)
    assert workflow.definition == {"nodes": {}}
    assert workflow.to_dict() == {
        "id": "w1",
        "name": "Flow",
        "definition": {"nodes": {}},
        "description": None,
        "created_at": T0.isoformat(),
        "updated_at": None,
    }


def test_workflow_from_row_defaults_missing_definition():
    assert Workflow.from_row({"id": "w", "name": "n", "definition": None}).definition == {}


def test_schedule_to_dict_matches_the_cron_api_shape():
    schedule = Schedule.from_row(
        {
            "id": 3,
            "target_workflow_id": "w1",
            "enabled": False,
            "timezone": "Asia/Kolkata",
            "schedule_description": "every 5 minutes",
            "next_run_at": T0,
            "recurrence_seconds": 300,
            "created_at": T0,
            "updated_at": T1,
            "last_executed_at": None,
        }
    )
    assert schedule.to_dict() == {
        "id": 3,
        "target_workflow_id": "w1",
        "enabled": False,
        "timezone": "Asia/Kolkata",
        "schedule_description": "every 5 minutes",
        "next_run_at": T0.isoformat(),
        "recurrence_seconds": 300,
        "created_at": T0.isoformat(),
        "updated_at": T1.isoformat(),
        "last_executed_at": None,
    }


def test_execution_records_default_null_json_to_empty_dicts():
    execution = ExecutionRecord.from_row(
        {"id": 1, "workflow_id": "w", "status": "running", "started_at": T0, "inputs": None, "outputs": None}
    )
    assert (execution.inputs, execution.outputs, execution.completed_at) == ({}, {}, None)

    node = NodeExecutionRecord.from_row(
        {
            "id": 2,
            "execution_id": 1,
            "node_id": "n",
            "node_type": "function",
            "status": "success",
            "started_at": T0,
            "inputs": {"a": 1},
            "outputs": None,
        }
    )
    assert (node.inputs, node.outputs) == ({"a": 1}, {})


def _settings_row(**overrides):
    row = {
        "id": "singleton",
        "provider": "gemini",
        "model": "m",
        "voice": "af_heart",
        "temperature": 0.5,
        "max_tokens": 100,
        "stream_responses": True,
        "send_telemetry": False,
        "display_name": "Amy",
        "username": "amy",
        "updated_at": T0,
        "api_base": "http://localhost:1234/v1",
        "api_key": "sk-test",
    }
    row.update(overrides)
    return row


def test_app_settings_to_dict_is_the_raw_row():
    row = _settings_row()
    settings_dict = AppSettings.from_row(row).to_dict()
    assert settings_dict == row
    assert list(settings_dict) == list(row)


def test_app_settings_keeps_nulls():
    row = _settings_row(stream_responses=None, temperature=None)
    assert AppSettings.from_row(row).to_dict() == row


def test_api_key_to_dict_shape():
    key = ApiKey.from_row(
        {
            "id": "k1",
            "label": "CI",
            "key_prefix": "knik_live_abcdef",
            "scopes": ["read"],
            "created_at": T0,
            "last_used_at": None,
        }
    )
    assert key.to_dict() == {
        "id": "k1",
        "label": "CI",
        "key_prefix": "knik_live_abcdef",
        "scopes": ["read"],
        "created_at": T0.isoformat(),
        "last_used_at": None,
    }
    assert list(key.to_dict()) == ["id", "label", "key_prefix", "scopes", "created_at", "last_used_at"]


def test_api_key_null_scopes_become_empty_list():
    key = ApiKey.from_row({"id": "k", "label": "l", "key_prefix": "p", "scopes": None})
    assert key.scopes == []


def test_created_api_key_to_dict_shape():
    created = CreatedApiKey(api_key=ApiKey(id="k1", label="CI", key_prefix="knik_live_abcdef"), key="knik_live_secret")
    assert created.to_dict() == {
        "id": "k1",
        "label": "CI",
        "key_prefix": "knik_live_abcdef",
        "scopes": [],
        "key": "knik_live_secret",
    }
    assert list(created.to_dict()) == ["id", "label", "key_prefix", "scopes", "key"]


def test_mcp_tool_state_round_trip():
    state = McpToolState.from_row({"tool_name": "shell", "enabled": False, "updated_at": T0})
    assert state.to_dict() == {"tool_name": "shell", "enabled": False, "updated_at": T0.isoformat()}


def test_mapping_helpers():
    assert to_model(Workflow.from_row, None) is None
    assert to_models(Workflow.from_row, []) == []
    rows = [{"id": "a", "name": "A", "definition": {}}, {"id": "b", "name": "B", "definition": {}}]
    assert [w.id for w in to_models(Workflow.from_row, rows)] == ["a", "b"]


def test_json_param_is_strict_unless_given_a_default():
    assert json_param({"a": [1, 2]}) == '{"a": [1, 2]}'
    assert json_param({"d": Decimal("1.5")}, default=str) == '{"d": "1.5"}'
    with pytest.raises(TypeError):
        json_param({"d": Decimal("1.5")})
