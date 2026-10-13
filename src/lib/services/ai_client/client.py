"""Unified AI Client for interacting with multiple AI providers.

Provides both synchronous (``chat``, ``chat_stream``) and asynchronous
(``achat``, ``achat_stream``) interfaces.  The async variants optionally
manage the full conversation lifecycle — persistence, history loading,
summary injection, token tracking, and background summarization — so
that route handlers only need to deal with transport concerns (SSE, TTS,
audio encoding, etc.).
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncGenerator, Generator
from dataclasses import replace
from typing import Any, ClassVar

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from ...core.config import Config
from ...utils.printer import printer
from ..db import DB_ERRORS, ConversationDB
from .compaction import ConversationCompactor
from .providers import BaseAIProvider
from .providers.base_provider import ChatResult
from .registry import ProviderRegistry
from .settings import ClientSettings
from .settings import provider_kwargs as settings_for_provider
from .stream_events import ConversationReady, ProviderEvent, StreamDone, StreamError, StreamEvent, TextDelta
from .titles import generate_and_set_title
from .tool_provider import ToolProvider


class AIClient:
    """Unified AI client supporting multiple providers via registry.

    Sync methods (``chat``, ``chat_stream``) are provider-only — they
    do not touch the database or summarisation system.  Use these in
    console, GUI, and cron contexts.

    Async methods (``achat``, ``achat_stream``) add full conversation
    lifecycle management on top of the sync core.  Pass a
    ``conversation_id`` to opt in; pass ``None`` to fall through to a
    plain async wrapper around the sync method (no DB).
    """

    # Strong references for fire-and-forget tasks (e.g. background
    # summarisation, title generation) to prevent GC mid-execution.
    _background_tasks: ClassVar[set[asyncio.Task]] = set()

    def __init__(
        self,
        provider: str = "vertex",
        auto_fallback_to_mock: bool = True,
        tool_registry: ToolProvider | None = None,
        system_instruction: str | None = None,
        tool_callback=None,
        settings: ClientSettings | None = None,
        **provider_kwargs,
    ):
        self.provider_name = provider.lower()
        self.auto_fallback_to_mock = auto_fallback_to_mock
        self._provider: BaseAIProvider | None = None
        self._tool_registry = tool_registry
        self.tool_callback = tool_callback
        self.last_usage: dict[str, int] | None = None
        self.last_tool_tokens: dict | None = None
        self.last_tool_interactions: list | None = None
        self.last_context_tokens: int = 0
        self._system_instruction = system_instruction
        self._provider_kwargs = dict(provider_kwargs)
        # Every setting the client was built from, kept so a model or provider switch can pass the new
        # provider the settings it accepts (build_client hands each provider only its own).
        self._settings = settings

        if tool_registry:
            provider_kwargs["tool_registry"] = tool_registry
        if system_instruction:
            provider_kwargs["system_instruction"] = system_instruction
        if tool_callback:
            provider_kwargs["tool_callback"] = tool_callback

        try:
            provider_class = ProviderRegistry.get(self.provider_name)

            if provider_class is None:
                available = ProviderRegistry.list_providers()
                raise ValueError(f"Unknown provider: {provider}. Available providers: {', '.join(available)}")

            self._provider = provider_class(**provider_kwargs)

            if not self._provider.is_configured() and auto_fallback_to_mock:
                printer.warning(f"{provider} not configured. Using mock provider.")
                mock_class = ProviderRegistry.get("mock")
                self._provider = mock_class(tool_registry=tool_registry)
                self.provider_name = "mock"
            else:
                # Eagerly discover models to warm the context-window cache.
                # This ensures get_context_window() returns API-sourced values
                # before the first should_compact() call.
                try:
                    self._provider.get_models_with_fallback()
                except Exception as e:
                    printer.warning(
                        f"Model list for {self.provider_name} not loaded; using default context windows: {e}"
                    )

        except Exception as e:
            if auto_fallback_to_mock:
                printer.warning(f"Error initializing {provider}: {e}")
                printer.info("Using mock provider.")
                mock_class = ProviderRegistry.get("mock")
                self._provider = mock_class(tool_registry=tool_registry)
                self.provider_name = "mock"
            else:
                raise

    @property
    def tool_registry(self) -> ToolProvider | None:
        return self._tool_registry

    def _build_provider_kwargs(self, **overrides) -> dict[str, Any]:
        """Build provider kwargs from stored state, with optional overrides."""
        kwargs: dict[str, Any] = dict(self._provider_kwargs)
        if self._tool_registry:
            kwargs["tool_registry"] = self._tool_registry
        if self._system_instruction:
            kwargs["system_instruction"] = self._system_instruction
        if self.tool_callback:
            kwargs["tool_callback"] = self.tool_callback
        kwargs.update(overrides)
        return kwargs

    def _switch_settings(self, *, provider: str, model: str | None) -> dict[str, Any]:
        """Provider kwargs for a switch, filtered from the full settings for the provider switched to."""
        assert self._settings is not None
        self._settings = replace(self._settings, provider=provider, model=model)
        self._provider_kwargs = settings_for_provider(self._settings)
        return self._build_provider_kwargs()

    def set_model(self, model_name: str) -> None:
        """Swap the model in-place, preserving registry and all other state."""
        provider_class = ProviderRegistry.get(self.provider_name)
        if provider_class is None:
            raise ValueError(f"Unknown provider: {self.provider_name}")
        if self._settings is not None:
            kwargs = self._switch_settings(provider=self.provider_name, model=model_name)
        else:
            kwargs = self._build_provider_kwargs(model_name=model_name)
        self._provider = provider_class(**kwargs)
        printer.info(f"Model swapped to {model_name} (provider: {self.provider_name})")

    def set_provider(self, provider_name: str, model_name: str | None = None) -> None:
        """Swap the provider in-place, preserving registry and all other state."""
        provider_name = provider_name.lower()
        provider_class = ProviderRegistry.get(provider_name)
        if provider_class is None:
            available = ProviderRegistry.list_providers()
            raise ValueError(f"Unknown provider: {provider_name}. Available: {', '.join(available)}")
        if self._settings is not None:
            kwargs = self._switch_settings(provider=provider_name, model=model_name or self._settings.model)
        else:
            kwargs = self._build_provider_kwargs()
            if model_name:
                kwargs["model_name"] = model_name
        self._provider = provider_class(**kwargs)
        self.provider_name = provider_name
        printer.info(f"Provider swapped to {provider_name}")

    def chat(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        history: list = None,
        **kwargs,
    ) -> str:
        """
        Send a chat message and get a response.

        Tool usage is automatic - if tool_registry was provided during initialization,
        the AI can use registered tools. Otherwise, it's just a direct LLM call.

        Token usage from the call is stored in ``self.last_usage``,
        ``self.last_tool_tokens``, and ``self.last_tool_interactions`` after completion.

        Args:
            prompt: The user's message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0.0-2.0)
            history: Conversation history (list of LangChain messages)
            **kwargs: Additional provider-specific parameters

        Returns:
            str: The AI's response

        Raises:
            Whatever the provider raised, with the token attributes cleared. The error is never returned as the
            reply, so callers cannot save, summarise or title it by mistake.
        """
        # Held for the whole call: a /model or /provider may swap self._provider while it runs.
        provider = self._provider
        try:
            result = provider.chat(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                history=history,
                **kwargs,
            )
        except Exception:
            self.last_usage = None
            self.last_tool_tokens = None
            self.last_tool_interactions = None
            self.last_context_tokens = 0
            raise

        if isinstance(result, ChatResult):
            self.last_usage = result.usage
            content = result.content
        else:
            self.last_usage = getattr(provider, "last_usage", None)
            content = result
        self.last_tool_tokens = getattr(provider, "last_tool_tokens", None)
        self.last_tool_interactions = getattr(provider, "last_tool_interactions", None)
        self.last_context_tokens = getattr(provider, "last_context_tokens", 0)
        return content

    def chat_stream(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        history: list = None,
        **kwargs,
    ) -> Generator[str, None, None]:
        """
        Stream a chat response as text: the text of :meth:`stream_events`, without the tool calls.

        Tool usage is automatic - if tool_registry was provided during initialization,
        the AI can use registered tools. Otherwise, it's just a direct LLM streaming.

        Token usage is available in self.last_usage after the stream completes.

        Args:
            prompt: The user's message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0.0-2.0)
            history: Conversation history (list of LangChain messages)
            **kwargs: Additional provider-specific parameters

        Yields:
            str: Chunks of the AI's response; on a provider failure, the "Chat streaming error: ..." text
        """
        for event in self.stream_events(
            prompt=prompt, max_tokens=max_tokens, temperature=temperature, history=history, **kwargs
        ):
            match event:
                case TextDelta(text=text) | StreamError(message=text):
                    yield text

    def stream_events(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        history: list | None = None,
        **kwargs,
    ) -> Generator[ProviderEvent | StreamError, None, None]:
        """Stream a chat response as typed events, provider-only like :meth:`chat_stream`.

        Yields the provider's ``TextDelta``s, with ``ToolCallStarted``/``ToolCallFinished`` around each tool call.
        If the provider fails, the error is logged and a ``StreamError`` ends the stream. Token usage is in
        ``self.last_usage`` once the stream is exhausted (None after a failure).
        """
        # Held for the whole stream: a /model or /provider may swap self._provider while it runs.
        provider = self._provider
        try:
            self.last_usage = None
            self.last_tool_tokens = None
            self.last_tool_interactions = None
            self.last_context_tokens = 0
            yield from provider.chat_stream(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                history=history,
                **kwargs,
            )
            self.last_usage = getattr(provider, "last_usage", None)
            self.last_tool_tokens = getattr(provider, "last_tool_tokens", None)
            self.last_tool_interactions = getattr(provider, "last_tool_interactions", None)
            self.last_context_tokens = getattr(provider, "last_context_tokens", 0)
        except Exception as e:
            error_msg = f"Chat streaming error: {e}"
            printer.error(error_msg)
            self.last_usage = None
            self.last_tool_tokens = None
            self.last_tool_interactions = None
            self.last_context_tokens = 0
            yield StreamError(error_msg)

    async def achat(
        self,
        prompt: str,
        *,
        conversation_id: str | None = None,
        persist: bool = True,
        user_id: str | None = None,
        source: str | None = None,
        disable_summarization: bool = False,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        history: list | None = None,
        provider_meta: dict[str, str] | None = None,
        **kwargs,
    ) -> tuple[str, str | None, dict[str, int] | None]:
        """Async chat with optional full conversation lifecycle.

        When *conversation_id* is provided (or successfully created),
        the method handles:
        1. Creating / verifying the conversation in DB
        2. Persisting the user message
        3. Loading conversation history from DB (unless *history* is
           passed explicitly) — respects compaction pointers
        4. Running the LLM call on a background thread
        5. Persisting the assistant response
        6. Tracking tokens and triggering blocking compaction
           when the threshold is crossed
        7. Auto-generating a title after the conversation's first reply

        If the DB is unavailable every step degrades with a logged warning
        and the method still returns a valid LLM response.  If the
        provider fails, the error is raised (see :meth:`chat`) once the
        user message is saved; no reply is saved for it.  A conversation
        this call created is deleted first, as its id never reaches the
        caller.

        Args:
            prompt: The user's message.
            conversation_id: Existing conversation UUID.  ``None`` to
                create a new one (requires DB).
            persist: ``False`` to answer without a stored conversation:
                *conversation_id* is ignored and nothing is created,
                loaded or saved.  For a caller that could not check the
                conversation it was asked to continue.
            user_id: The owner (a users row) recorded on a conversation
                this call creates.  An existing conversation keeps its own.
            source: The app recorded on a conversation this call creates:
                ``web``, ``telegram`` or ``console``.
            disable_summarization: When ``True``, skip the threshold
                check and never trigger compaction.
            max_tokens: Maximum tokens in response.
            temperature: Response randomness (0.0–2.0).
            history: Explicit LangChain message list.  When ``None``
                and a conversation_id is available, history is loaded
                from the DB.
            provider_meta: ``{"provider": ..., "model": ...}`` dict
                written into message metadata for auditing.
            **kwargs: Forwarded to the underlying provider.

        Returns:
            ``(response_text, conversation_id, usage)``
            *conversation_id* may be ``None`` if DB was unavailable.
            *usage* may be ``None`` if the provider didn't report it.
        """
        meta = provider_meta or {}
        cfg = Config()

        requested_id = conversation_id
        conversation_id = (
            await self._ensure_conversation(conversation_id, user_id=user_id, source=source) if persist else None
        )

        try:
            if conversation_id:
                await self._append_message(conversation_id, "user", prompt, meta)

            if history is None and conversation_id:
                history = await self._load_history(conversation_id, cfg.history_context_size)

            response_text, usage, tool_interactions = await asyncio.to_thread(
                self._chat_with_usage,
                prompt,
                history,
                max_tokens,
                temperature,
                **kwargs,
            )
        except Exception:
            if conversation_id and conversation_id != requested_id:
                await self._discard_conversation(conversation_id)
            raise

        if conversation_id and response_text.strip():
            await self._post_chat(
                conversation_id=conversation_id,
                prompt=prompt,
                response_text=response_text,
                usage=usage,
                meta=meta,
                disable_summarization=disable_summarization,
                history=history,
                tool_interactions=tool_interactions,
            )

        return response_text, conversation_id, usage

    async def achat_stream(
        self,
        prompt: str,
        *,
        conversation_id: str | None = None,
        persist: bool = True,
        user_id: str | None = None,
        source: str | None = None,
        disable_summarization: bool = False,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        history: list | None = None,
        provider_meta: dict[str, str] | None = None,
        **kwargs,
    ) -> AsyncGenerator[StreamEvent, None]:
        """Async streaming chat with full conversation lifecycle.

        Yields typed events (``stream_events.py``), in this order:

        * ``ConversationReady(conversation_id)`` — first, so the caller
          can forward the id before any text.  Not sent when the
          database is unavailable.
        * ``TextDelta(text)`` — the reply as it streams.  Each tool call
          sits between a ``ToolCallStarted`` and a ``ToolCallFinished``.
        * ``StreamError(message)`` — only if the provider fails; its
          message counts as reply text (shown and saved like a
          ``TextDelta``) and nothing but ``StreamDone`` follows.
        * ``StreamDone(conversation_id, usage, full_response)`` — always
          last, once the reply is saved.

        An error outside the provider stream (a non-database failure
        while saving, say) is raised instead of yielded.  A conversation
        this call created is kept even then: ``ConversationReady`` has
        already given the caller its id.

        See :meth:`achat` for the lifecycle description.

        Args:
            prompt: The user's message.
            conversation_id: Existing conversation UUID.
            persist: ``False`` to stream without a stored conversation
                (see :meth:`achat`).
            user_id: Owner of a conversation this call creates.
            source: App of a conversation this call creates.
            disable_summarization: Skip summarisation trigger.
            max_tokens: Maximum tokens in response.
            temperature: Response randomness.
            history: Explicit LangChain message list.
            provider_meta: Metadata dict for auditing.
            **kwargs: Forwarded to the underlying provider.

        Yields:
            ``StreamEvent``s, ending with ``StreamDone``.
        """
        meta = provider_meta or {}
        cfg = Config()

        conversation_id = (
            await self._ensure_conversation(conversation_id, user_id=user_id, source=source) if persist else None
        )

        # Emit conversation_id early so the caller can forward it
        if conversation_id:
            yield ConversationReady(conversation_id)

        if conversation_id:
            await self._append_message(conversation_id, "user", prompt, meta)

        if history is None and conversation_id:
            history = await self._load_history(conversation_id, cfg.history_context_size)

        queue: asyncio.Queue[ProviderEvent | StreamError | None] = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def _produce():
            try:
                for event in self.stream_events(
                    prompt=prompt,
                    history=history,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs,
                ):
                    loop.call_soon_threadsafe(queue.put_nowait, event)
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        producer = loop.run_in_executor(None, _produce)

        full_response = ""
        while (event := await queue.get()) is not None:
            yield event
            match event:
                case TextDelta(text=text) | StreamError(message=text):
                    full_response += text

        await producer

        usage = self.last_usage
        tool_interactions = self.last_tool_interactions

        if conversation_id and full_response.strip():
            await self._post_chat(
                conversation_id=conversation_id,
                prompt=prompt,
                response_text=full_response,
                usage=usage,
                meta=meta,
                disable_summarization=disable_summarization,
                history=history,
                tool_interactions=tool_interactions,
            )

        yield StreamDone(conversation_id=conversation_id, usage=usage, full_response=full_response)

    def _chat_with_usage(
        self,
        prompt: str,
        history: list | None,
        max_tokens: int,
        temperature: float,
        **kwargs,
    ) -> tuple[str, dict[str, int] | None, list | None]:
        """Call :meth:`chat` and atomically capture usage on the same thread.

        Returns ``(response_text, usage_dict_or_none, tool_interactions_or_none)``.
        """
        text = self.chat(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            history=history,
            **kwargs,
        )
        return text, self.last_usage, self.last_tool_interactions

    @staticmethod
    async def _ensure_conversation(
        conversation_id: str | None, *, user_id: str | None = None, source: str | None = None
    ) -> str | None:
        """Create a new conversation, owned by *user_id* and started from *source*, or verify an existing one.

        Returns the valid conversation ID, or ``None`` if the DB is
        unavailable (the chat then runs without persistence).
        """
        try:
            if conversation_id and await ConversationDB.get_conversation(conversation_id):
                return conversation_id
            return await ConversationDB.create_conversation(user_id=user_id, source=source)
        except DB_ERRORS as e:
            printer.warning(f"Chat not persisted, database unavailable: {e}")
            return None

    @staticmethod
    async def _discard_conversation(conversation_id: str) -> None:
        try:
            await ConversationDB.delete_conversation(conversation_id)
        except DB_ERRORS as e:
            printer.warning(f"Conversation {conversation_id} not deleted, database unavailable: {e}")

    @staticmethod
    async def _append_message(
        conversation_id: str, role: str, content: str, metadata: dict[str, Any], tokens: int = 0
    ) -> None:
        try:
            await ConversationDB.append_message(
                conversation_id=conversation_id, role=role, content=content, metadata=metadata, tokens=tokens
            )
        except DB_ERRORS as e:
            printer.warning(f"{role.capitalize()} message not saved to {conversation_id}, database unavailable: {e}")

    @staticmethod
    async def _load_history(conversation_id: str, context_size: int) -> list:
        """Load the active message window for a conversation and convert to LangChain types.

        If the conversation has been compacted, loads only messages from the
        summary message onwards.  The summary message itself has its role
        rewritten from ``assistant`` to ``user`` in-memory so the LLM treats
        it as context (matching the OpenCode approach).

        Falls back to loading the last N turn pairs when no compaction exists.

        For assistant messages that have ``tool_calls`` in their metadata, the
        full LangChain message sequence is reconstructed: an AIMessage declaring
        tool calls, one ToolMessage per tool result, and a final AIMessage with
        the text response.  This gives the LLM accurate memory of prior tool
        usage across conversation turns.

        Returns an empty history when the DB is unavailable.
        """
        try:
            summary_message_id, _ = await ConversationDB.get_compaction_state(conversation_id)
            if summary_message_id:
                messages = await ConversationDB.get_messages_from(conversation_id, summary_message_id)
            else:
                messages = await ConversationDB.get_recent_messages(conversation_id, last_n=context_size * 2)
        except DB_ERRORS as e:
            printer.warning(f"History not loaded for {conversation_id}, database unavailable: {e}")
            return []

        history: list = []
        for i, msg in enumerate(messages):
            content = msg.content
            if (summary_message_id and i == 0 and msg.metadata.get("is_compaction_summary")) or msg.role == "user":
                history.append(HumanMessage(content=content))
            elif msg.role == "assistant":
                tool_calls_meta = msg.metadata.get("tool_calls")

                if tool_calls_meta:
                    lc_tool_calls = []
                    for j, tc in enumerate(tool_calls_meta):
                        tc_id = f"hist_tc_{i}_{j}"
                        lc_tool_calls.append(
                            {
                                "name": tc.get("tool_name", "unknown"),
                                "args": tc.get("tool_args", {}),
                                "id": tc_id,
                            }
                        )

                    history.append(AIMessage(content="", tool_calls=lc_tool_calls))

                    for j, tc in enumerate(tool_calls_meta):
                        tc_id = f"hist_tc_{i}_{j}"
                        result = tc.get("tool_result", "")
                        if not isinstance(result, str):
                            result = json.dumps(result, default=str) if not isinstance(result, str) else result
                        history.append(
                            ToolMessage(
                                content=result,
                                tool_call_id=tc_id,
                                name=tc.get("tool_name", "unknown"),
                            )
                        )

                    if content.strip():
                        history.append(AIMessage(content=content))
                else:
                    history.append(AIMessage(content=content))
        return history

    @staticmethod
    def _estimate_usage(
        prompt: str,
        response_text: str,
        model: str,
        history: list | None = None,
    ) -> dict[str, int]:
        from .token_utils import count_message_tokens

        history_messages = []
        if history:
            for msg in history:
                if hasattr(msg, "type"):
                    if msg.type == "tool":
                        d: dict[str, Any] = {
                            "role": "tool",
                            "content": msg.content,
                            "name": getattr(msg, "name", ""),
                        }
                        history_messages.append(d)
                    else:
                        d = {"role": msg.type, "content": msg.content}
                        if msg.type == "ai" and hasattr(msg, "tool_calls") and msg.tool_calls:
                            d["tool_calls"] = msg.tool_calls
                        history_messages.append(d)
        history_messages.append({"role": "user", "content": prompt})

        input_tokens = count_message_tokens(history_messages, model=model)
        output_tokens = count_message_tokens([{"role": "assistant", "content": response_text}], model=model)
        total_tokens = input_tokens + output_tokens
        return {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "estimated": True,
        }

    async def _post_chat(
        self,
        *,
        conversation_id: str,
        prompt: str,
        response_text: str,
        usage: dict[str, int] | None,
        meta: dict[str, str],
        disable_summarization: bool,
        history: list | None = None,
        tool_interactions: list | None = None,
    ) -> None:
        """Handle post-call persistence: save response, track tokens,
        trigger blocking compaction, and auto-generate a title on the
        conversation's first reply.

        The turn's ``total_tokens`` is added to the conversation's
        running total in the same write as the response.

        Uses API-reported ``input_tokens`` as the primary context usage
        metric.  Falls back to tiktoken estimation when the provider did
        not report usage.  Compaction is **blocking** — the caller waits
        until it finishes (or fails) before proceeding.

        Database errors are logged and skipped, so a chat never fails
        because Postgres is down.
        """
        model_name = self.get_model_name()
        if usage is None:
            base_usage = self._estimate_usage(prompt, response_text, model_name, history=history)
            tool_tokens = self.last_tool_tokens or {}
            tool_input = tool_tokens.get("tool_input_tokens", 0)
            tool_output = tool_tokens.get("tool_output_tokens", 0)
            usage = {
                **base_usage,
                "tool_input_tokens": tool_input,
                "tool_output_tokens": tool_output,
                "total_tokens": base_usage["total_tokens"] + tool_input + tool_output,
            }
        else:
            usage = {**usage, "tool_input_tokens": 0, "tool_output_tokens": 0}

        usage["context_tokens"] = self.last_context_tokens or 0

        msg_metadata: dict[str, Any] = dict(meta)
        msg_metadata["usage"] = usage
        if tool_interactions:
            msg_metadata["tool_calls"] = tool_interactions

        await self._append_message(
            conversation_id, "assistant", response_text.strip(), msg_metadata, tokens=usage.get("total_tokens", 0)
        )

        if usage.get("input_tokens") and not disable_summarization:
            context_tokens = usage["input_tokens"]
            if ConversationCompactor.should_compact(context_tokens, model_name):
                printer.info(
                    f"Context threshold crossed ({context_tokens} context tokens). Triggering blocking compaction."
                )
                compactor = ConversationCompactor(self, model_name)
                await compactor.compact(conversation_id)

        # Counted by reply, not by message: a failed turn before this one may have left its user message.
        try:
            replies = await ConversationDB.get_message_count(conversation_id, role="assistant")
        except DB_ERRORS as e:
            printer.warning(f"Title not generated for {conversation_id}, database unavailable: {e}")
            return
        if replies == 1:
            self._schedule_background(
                generate_and_set_title(
                    conversation_id=conversation_id,
                    first_message=prompt,
                    ai_client=self,
                )
            )

    @classmethod
    def _schedule_background(cls, coro) -> None:
        """Fire-and-forget an async coroutine with GC protection and error logging."""
        task = asyncio.create_task(coro)
        cls._background_tasks.add(task)
        task.add_done_callback(cls._background_task_done)

    @classmethod
    def _background_task_done(cls, task: asyncio.Task) -> None:
        cls._background_tasks.discard(task)
        if task.cancelled():
            printer.warning(f"Background task cancelled: {task.get_name()}")
        elif task.exception():
            printer.error(f"Background task failed: {task.exception()}")

    def get_last_usage(self) -> dict[str, int] | None:
        """Get the token usage from the last chat() or chat_stream() call.

        Returns:
            Dict with input_tokens, output_tokens, total_tokens, or None.
        """
        return self.last_usage

    def list_models_for_provider(self, provider_name: str | None = None) -> list[dict[str, Any]]:
        """List available models for a specific provider.

        Uses dynamic API discovery with static fallback.

        Args:
            provider_name: Provider to query. Defaults to current provider.

        Returns:
            List of model info dicts.
        """
        if provider_name is None or provider_name == self.provider_name:
            return self._provider.get_models_with_fallback()

        try:
            provider_class = ProviderRegistry.get(provider_name)
            if provider_class is None:
                printer.warning(f"Unknown provider: {provider_name}")
                return []

            provider = provider_class()
            return provider.get_models_with_fallback()
        except Exception as e:
            printer.debug(f"Could not list models for {provider_name}: {e}")
            return []

    def list_all_models(self) -> dict[str, list[dict[str, Any]]]:
        all_models = {}
        for provider_name in ProviderRegistry.list_providers():
            models = self.list_models_for_provider(provider_name)
            if models:
                all_models[provider_name] = models
        return all_models

    def is_configured(self) -> bool:
        return self._provider.is_configured()

    def get_info(self) -> dict[str, Any]:
        info = self._provider.get_info()
        info["client_provider"] = self.provider_name
        info["auto_fallback"] = self.auto_fallback_to_mock
        return info

    def get_provider_name(self) -> str:
        return self.provider_name

    def get_model_name(self) -> str:
        info = self._provider.get_info()
        return info.get("model", "unknown")

    @staticmethod
    def list_available_providers() -> list[str]:
        return ProviderRegistry.list_providers()

    def register_tool(self, tool_dict: dict[str, Any], implementation: Any = None) -> None:
        """
        Register a tool with its schema and implementation.

        Args:
            tool_dict: Tool schema (name, description, parameters)
            implementation: Python function that implements the tool
        """
        if self._tool_registry:
            self._tool_registry.register_tool(tool_dict, implementation)

    def get_registered_tools(self) -> list[dict[str, Any]]:
        if self._tool_registry:
            return self._tool_registry.get_tools()
        return []

    def execute_tool(self, tool_name: str, **kwargs) -> Any:
        if self._tool_registry:
            return self._tool_registry.execute_tool(tool_name, **kwargs)
        raise ValueError("No tool registry configured")


class MockAIClient(AIClient):
    """Mock AI client for testing."""

    def __init__(self):
        super().__init__(provider="mock", auto_fallback_to_mock=False)
