"""Shared command operations service.

Provides a single CommandService class that any app (bot, console, web)
can use to execute session, model, and status operations.  All heavy
logic lives here so that app-level handlers stay thin.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from lib.services.ai_client.registry import ProviderRegistry
from lib.utils.printer import printer

from .models import CommandResult, ModelInfo, SessionInfo, StatusInfo, UserIdentityProtocol


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient
    from lib.services.conversation import ConversationDB


class CommandService:
    def __init__(
        self,
        ai_client: AIClient,
        user_identity: UserIdentityProtocol,
        mcp_registry=None,
        system_instruction: str | None = None,
    ) -> None:
        self._ai_client = ai_client
        self._user_identity = user_identity
        self._mcp_registry = mcp_registry
        self._system_instruction = system_instruction

    @property
    def ai_client(self) -> AIClient:
        return self._ai_client

    @staticmethod
    async def _get_db() -> type[ConversationDB]:
        from lib.services.conversation import ConversationDB

        return ConversationDB

    async def new_session(self, user_id: str) -> CommandResult:
        self._user_identity.clear_conversation_id(user_id)
        return CommandResult(success=True, message="New session started. Send a message to begin.")

    async def resume_session(self, user_id: str, conversation_id_or_index: str) -> CommandResult:
        ConversationDB = await self._get_db()

        conv_id = await self._resolve_conversation_id(conversation_id_or_index)
        if conv_id is None:
            return CommandResult(
                success=False,
                message=f"Could not find conversation: {conversation_id_or_index}",
            )

        conversation = await ConversationDB.get_conversation(conv_id)
        if conversation is None:
            return CommandResult(
                success=False,
                message=f"Conversation not found: {conv_id[:8]}...",
            )

        self._user_identity.set_conversation_id(user_id, conv_id)
        title = conversation.title or "Untitled"
        msg_count = len(conversation.messages)
        return CommandResult(
            success=True,
            message=f"Resumed: {title} ({msg_count} messages)",
            data={"conversation_id": conv_id, "title": title, "message_count": msg_count},
        )

    async def list_sessions(self, limit: int = 10, offset: int = 0) -> list[SessionInfo]:
        ConversationDB = await self._get_db()
        conversations = await ConversationDB.list_conversations(limit=limit, offset=offset)
        sessions: list[SessionInfo] = []
        for conv in conversations:
            sessions.append(
                SessionInfo(
                    conversation_id=conv.id,
                    title=conv.title,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                    message_count=len(conv.messages),
                )
            )
        return sessions

    async def switch_model(self, model_name: str) -> CommandResult:
        if not model_name:
            return self._show_current_model()

        try:
            old_model = self._ai_client.get_model_name()
            self._ai_client.set_model(model_name)
            printer.info(f"Switched model: {old_model} -> {model_name}")
            return CommandResult(
                success=True,
                message=f"Model switched to {model_name}",
                data={"old_model": old_model, "new_model": model_name},
            )
        except Exception as e:
            printer.error(f"Failed to switch model: {e}")
            return CommandResult(success=False, message=f"Failed to switch model: {e}")

    async def switch_provider(self, provider_name: str) -> CommandResult:
        if not provider_name:
            return self._show_current_provider()

        if not ProviderRegistry.is_registered(provider_name):
            available = ", ".join(ProviderRegistry.list_providers())
            return CommandResult(
                success=False,
                message=f"Unknown provider: {provider_name}. Available: {available}",
            )

        try:
            old_provider = self._ai_client.provider_name
            current_model = self._ai_client.get_model_name()
            self._ai_client.set_provider(provider_name, model_name=current_model)
            printer.info(f"Switched provider: {old_provider} -> {provider_name}")
            return CommandResult(
                success=True,
                message=f"Provider switched to {provider_name}",
                data={"old_provider": old_provider, "new_provider": provider_name},
            )
        except Exception as e:
            printer.error(f"Failed to switch provider: {e}")
            return CommandResult(success=False, message=f"Failed to switch provider: {e}")

    def list_models(self) -> list[ModelInfo]:
        raw = self._ai_client.list_models_for_provider()
        models: list[ModelInfo] = []
        for m in raw:
            if isinstance(m, dict):
                models.append(
                    ModelInfo(
                        name=m.get("name", m.get("id", "unknown")),
                        description=m.get("description", ""),
                    )
                )
            elif isinstance(m, str):
                models.append(ModelInfo(name=m))
        return models

    def list_providers(self) -> list[str]:
        return ProviderRegistry.list_providers()

    async def get_status(self, user_id: str) -> StatusInfo:
        conv_id = self._user_identity.get_conversation_id(user_id)
        info = self._ai_client.get_info()
        total_tokens = 0
        input_tokens = 0
        output_tokens = 0
        if conv_id:
            ConversationDB = await self._get_db()
            usage = await ConversationDB.get_conversation_token_usage(conv_id)
            total_tokens = usage["total"]
            input_tokens = usage["total_input"]
            output_tokens = usage["total_output"]
        return StatusInfo(
            provider=self._ai_client.provider_name,
            model=info.get("model", "unknown"),
            conversation_id=conv_id,
            user_id=user_id,
            total_tokens=total_tokens,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    async def _resolve_conversation_id(self, ref: str) -> str | None:
        if ref.startswith("#"):
            try:
                index = int(ref[1:]) - 1
                sessions = await self.list_sessions(limit=20)
                if 0 <= index < len(sessions):
                    return sessions[index].conversation_id
            except ValueError:
                pass
            return None

        ConversationDB = await self._get_db()
        conversation = await ConversationDB.get_conversation(ref)
        if conversation:
            return ref

        sessions = await self.list_sessions(limit=20)
        for s in sessions:
            if s.conversation_id.startswith(ref):
                return s.conversation_id

        return None

    def _show_current_model(self) -> CommandResult:
        current = self._ai_client.get_model_name()
        models = self.list_models()
        lines = [f"Current model: {current}", "", "Available models:"]
        for m in models:
            indicator = " -> " if m.name == current else "    "
            desc = f" - {m.description}" if m.description else ""
            lines.append(f"{indicator}{m.name}{desc}")
        lines.append("")
        lines.append("Usage: /model <name>")
        return CommandResult(success=True, message="\n".join(lines))

    def _show_current_provider(self) -> CommandResult:
        current = self._ai_client.provider_name
        providers = self.list_providers()
        lines = [f"Current provider: {current}", "", "Available providers:"]
        for p in providers:
            indicator = " -> " if p == current else "    "
            lines.append(f"{indicator}{p}")
        lines.append("")
        lines.append("Usage: /provider <name>")
        return CommandResult(success=True, message="\n".join(lines))
