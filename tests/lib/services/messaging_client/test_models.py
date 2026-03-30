"""Tests for messaging client models."""

from src.lib.services.messaging_client.models import IncomingMessage, MessageResult


def test_incoming_message_with_provider_name():
    msg = IncomingMessage(
        chat_id="123",
        text="Hello",
        provider_name="telegram",
    )
    assert msg.provider_name == "telegram"


def test_incoming_message_without_provider_name():
    msg = IncomingMessage(
        chat_id="123",
        text="Hello",
    )
    assert msg.provider_name is None


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
