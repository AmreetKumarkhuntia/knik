"""Tests for UserClientManager: one client and tool registry per user, built through the shared factory."""

import asyncio

import pytest

from bot.consent import BotConsentGate, ConsentBroker
from bot.user_client_manager import UserClientManager
from lib.tools.registry import ToolRegistry


@pytest.fixture
def broker():
    return ConsentBroker()


@pytest.fixture
def manager(transport, broker):
    loop = asyncio.new_event_loop()
    yield UserClientManager(
        ai_provider="mock", system_instruction="Be brief.", transport=transport, loop=loop, consent_broker=broker
    )
    loop.close()


@pytest.mark.asyncio
async def test_each_user_gets_an_own_client_and_registry(manager):
    alice = await manager.get_or_create("alice")
    bob = await manager.get_or_create("bob")

    assert await manager.get_or_create("alice") is alice
    assert alice is not bob
    assert isinstance(alice.tool_registry, ToolRegistry)
    assert alice.tool_registry is not bob.tool_registry
    assert alice.provider_name == "mock"


@pytest.mark.asyncio
async def test_concurrent_first_requests_share_one_client(manager, monkeypatch):
    builds: list[str] = []
    create_new = manager.create_new

    def counting_create(user_id):
        builds.append(user_id)
        return create_new(user_id)

    monkeypatch.setattr(manager, "create_new", counting_create)

    first, second = await asyncio.gather(manager.get_or_create("alice"), manager.get_or_create("alice"))

    assert first is second
    assert builds == ["alice"]


def test_create_new_wires_a_consent_gate_for_the_user(manager, broker):
    registry = manager.create_new("alice").tool_registry

    assert isinstance(registry, ToolRegistry)
    gate = registry._consent_gate
    assert isinstance(gate, BotConsentGate)
    assert gate._user_id == "alice"
    assert gate._broker is broker


def test_the_gate_follows_the_users_latest_chat(manager):
    manager.set_chat_context("alice", "chat-1")
    gate = manager.create_new("alice").tool_registry._consent_gate

    assert gate._current_chat() == "chat-1"
    manager.set_chat_context("alice", "chat-2")
    assert gate._current_chat() == "chat-2"


def test_without_transport_there_is_no_consent_gate():
    registry = UserClientManager(ai_provider="mock").create_new("alice").tool_registry

    assert isinstance(registry, ToolRegistry)
    assert registry._consent_gate is None


@pytest.mark.asyncio
async def test_revoke_and_cleanup_reach_the_users_registry(manager, monkeypatch):
    client = await manager.get_or_create("alice")
    calls: list[str] = []
    monkeypatch.setattr(client.tool_registry, "revoke_allowed_tools", lambda: calls.append("revoke"))
    monkeypatch.setattr(client.tool_registry, "cleanup_tools", lambda: calls.append("cleanup"))

    manager.revoke_tool_consent("alice")
    manager.cleanup_tools("alice")
    manager.revoke_tool_consent("nobody")
    manager.cleanup_tools("nobody")

    assert calls == ["revoke", "cleanup"]
