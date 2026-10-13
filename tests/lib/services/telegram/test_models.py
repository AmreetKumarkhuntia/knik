"""Tests for the telegram service models."""

import dataclasses

import pytest

from lib.services.telegram.models import BotCommand, IncomingMessage, MessageResult


def test_incoming_message_defaults():
    msg = IncomingMessage(chat_id="123", text="Hello")
    assert msg.sender_id is None
    assert msg.message_id is None
    assert msg.raw == {}


def test_message_result_success():
    result = MessageResult(success=True, message_id="456")
    assert result.success is True
    assert result.message_id == "456"
    assert result.error is None


def test_message_result_failure():
    result = MessageResult(success=False, error="Test error")
    assert result.success is False
    assert result.message_id is None
    assert result.error == "Test error"


def test_bot_command_is_immutable():
    command = BotCommand(name="new", description="Start a fresh conversation")
    with pytest.raises(dataclasses.FrozenInstanceError):
        command.name = "other"  # type: ignore[misc]
