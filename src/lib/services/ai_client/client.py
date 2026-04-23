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
import contextlib
from collections.abc import AsyncGenerator, Generator
from typing import Any, ClassVar

from langchain_core.messages import AIMessage, HumanMessage

from ...core.config import Config
from ...utils.printer import printer
from .providers import BaseAIProvider
from .providers.base_provider import ChatResult
from .registry import ProviderRegistry


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

    @staticmethod
    def _conversation_db():
        """Lazy import to avoid circular dependency at module load time."""
        from ..conversation import ConversationDB

        return ConversationDB

    @staticmethod
    def _conversation_summarizer():
        """Lazy import to avoid circular dependency at module load time."""
        from ..conversation.summarizer import ConversationSummarizer

        return ConversationSummarizer

    def __init__(
        self,
        provider: str = "vertex",
        auto_fallback_to_mock: bool = True,
        mcp_registry=None,
        system_instruction: str | None = None,
        tool_callback=None,
        **provider_kwargs,
    ):
        self.provider_name = provider.lower()
        self.auto_fallback_to_mock = auto_fallback_to_mock
        self._provider: BaseAIProvider | None = None
        self._mcp_registry = mcp_registry
        self.tool_callback = tool_callback
        self.last_usage: dict[str, int] | None = None
        self.last_tool_tokens: dict | None = None
        self.last_tool_interactions: list | None = None
        self._system_instruction = system_instruction
        self._provider_kwargs = dict(provider_kwargs)

        if mcp_registry:
            provider_kwargs["mcp_registry"] = mcp_registry
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
                self._provider = mock_class(mcp_registry=mcp_registry)
                self.provider_name = "mock"
            else:
                # Eagerly discover models to warm the context-window cache.
                # This ensures get_context_window() returns API-sourced values
                # before the first should_summarize() call.
                with contextlib.suppress(Exception):
                    self._provider.get_models_with_fallback()

        except Exception as e:
            if auto_fallback_to_mock:
                printer.warning(f"Error initializing {provider}: {e}")
                printer.info("Using mock provider.")
                mock_class = ProviderRegistry.get("mock")
                self._provider = mock_class(mcp_registry=mcp_registry)
                self.provider_name = "mock"
            else:
                raise

    def _build_provider_kwargs(self, **overrides) -> dict[str, Any]:
        """Build provider kwargs from stored state, with optional overrides."""
        kwargs: dict[str, Any] = dict(self._provider_kwargs)
        if self._mcp_registry:
            kwargs["mcp_registry"] = self._mcp_registry
        if self._system_instruction:
            kwargs["system_instruction"] = self._system_instruction
        if self.tool_callback:
            kwargs["tool_callback"] = self.tool_callback
        kwargs.update(overrides)
        return kwargs

    def set_model(self, model_name: str) -> None:
        """Swap the model in-place, preserving registry and all other state."""
        provider_class = ProviderRegistry.get(self.provider_name)
        if provider_class is None:
            raise ValueError(f"Unknown provider: {self.provider_name}")
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

        Tool usage is automatic - if mcp_registry was provided during initialization,
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
        """
        try:
            result = self._provider.chat(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                history=history,
                **kwargs,
            )

            if isinstance(result, ChatResult):
                self.last_usage = result.usage
                self.last_tool_tokens = getattr(self._provider, "last_tool_tokens", None)
                self.last_tool_interactions = getattr(self._provider, "last_tool_interactions", None)
                return result.content
            else:
                self.last_usage = getattr(self._provider, "last_usage", None)
                self.last_tool_tokens = getattr(self._provider, "last_tool_tokens", None)
                self.last_tool_interactions = getattr(self._provider, "last_tool_interactions", None)
                return result
        except Exception as e:
            error_msg = f"Chat error: {e}"
            printer.error(error_msg)
            self.last_usage = None
            self.last_tool_tokens = None
            self.last_tool_interactions = None
            return error_msg

    def chat_stream(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        history: list = None,
        **kwargs,
    ) -> Generator[str, None, None]:
        """
        Stream a chat response.

        Tool usage is automatic - if mcp_registry was provided during initialization,
        the AI can use registered tools. Otherwise, it's just a direct LLM streaming.

        Token usage is available in self.last_usage after the stream completes.

        Args:
            prompt: The user's message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0.0-2.0)
            history: Conversation history (list of LangChain messages)
            **kwargs: Additional provider-specific parameters

        Yields:
            str: Chunks of the AI's response
        """
        try:
            self.last_usage = None
            self.last_tool_tokens = None
            self.last_tool_interactions = None
            yield from self._provider.chat_stream(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                history=history,
                **kwargs,
            )
            self.last_usage = getattr(self._provider, "last_usage", None)
            self.last_tool_tokens = getattr(self._provider, "last_tool_tokens", None)
            self.last_tool_interactions = getattr(self._provider, "last_tool_interactions", None)
        except Exception as e:
            error_msg = f"Chat streaming error: {e}"
            printer.error(error_msg)
            self.last_usage = None
            self.last_tool_tokens = None
            self.last_tool_interactions = None
            yield error_msg

    async def achat(
        self,
        prompt: str,
        *,
        conversation_id: str | None = None,
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
           passed explicitly)
        4. Injecting an existing summary into the history
        5. Running the LLM call on a background thread
        6. Persisting the assistant response
        7. Tracking cumulative tokens and triggering background
           summarisation when the threshold is crossed
        8. Auto-generating a title after the first exchange

        If the DB is unavailable every step silently degrades and the
        method still returns a valid LLM response.

        Args:
            prompt: The user's message.
            conversation_id: Existing conversation UUID.  ``None`` to
                create a new one (requires DB).
            disable_summarization: When ``True``, skip the threshold
                check and never trigger summarisation.
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

        conversation_id = await self._ensure_conversation(conversation_id)

        if conversation_id:
            await self._conversation_db().append_message(
                conversation_id=conversation_id,
                role="user",
                content=prompt,
                metadata=meta,
            )

        if history is None and conversation_id:
            history = await self._load_history(conversation_id, cfg.history_context_size)

        if conversation_id:
            summary, _ = await self._conversation_db().get_summary(conversation_id)
            history = self._conversation_summarizer().inject_summary(summary, history or [])

        response_text, usage, tool_interactions = await asyncio.to_thread(
            self._chat_with_usage,
            prompt,
            history,
            max_tokens,
            temperature,
            **kwargs,
        )

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
        disable_summarization: bool = False,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        history: list | None = None,
        provider_meta: dict[str, str] | None = None,
        **kwargs,
    ) -> AsyncGenerator[str | dict, None]:
        """Async streaming chat with full conversation lifecycle.

        Yields ``str`` chunks during streaming.  After the stream is
        exhausted two *dict* sentinels may be yielded:

        * ``{"__conversation_id__": "<uuid>"}`` — emitted first so the
          caller can forward it before any text arrives.
        * ``{"__done__": True, "conversation_id": ..., "usage": ...,
          "full_response": ...}`` — emitted last with metadata.

        See :meth:`achat` for the lifecycle description.

        Args:
            prompt: The user's message.
            conversation_id: Existing conversation UUID.
            disable_summarization: Skip summarisation trigger.
            max_tokens: Maximum tokens in response.
            temperature: Response randomness.
            history: Explicit LangChain message list.
            provider_meta: Metadata dict for auditing.
            **kwargs: Forwarded to the underlying provider.

        Yields:
            ``str`` text chunks, then a metadata ``dict``.
        """
        meta = provider_meta or {}
        cfg = Config()

        conversation_id = await self._ensure_conversation(conversation_id)

        # Emit conversation_id early so the caller can forward it
        if conversation_id:
            yield {"__conversation_id__": conversation_id}

        if conversation_id:
            await self._conversation_db().append_message(
                conversation_id=conversation_id,
                role="user",
                content=prompt,
                metadata=meta,
            )

        if history is None and conversation_id:
            history = await self._load_history(conversation_id, cfg.history_context_size)

        if conversation_id:
            summary, _ = await self._conversation_db().get_summary(conversation_id)
            history = self._conversation_summarizer().inject_summary(summary, history or [])

        queue: asyncio.Queue[str | dict | None] = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def _produce():
            try:
                for chunk in self.chat_stream(
                    prompt=prompt,
                    history=history,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs,
                ):
                    loop.call_soon_threadsafe(queue.put_nowait, chunk)
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        producer = loop.run_in_executor(None, _produce)

        full_response = ""
        while True:
            chunk = await queue.get()
            if chunk is None:
                break
            if isinstance(chunk, dict):
                yield chunk
            else:
                yield chunk
                full_response += chunk

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

        yield {
            "__done__": True,
            "conversation_id": conversation_id,
            "usage": usage,
            "full_response": full_response,
        }

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

    @classmethod
    async def _ensure_conversation(cls, conversation_id: str | None) -> str | None:
        """Create a new conversation or verify an existing one.

        Returns the valid conversation ID, or ``None`` if the DB is
        unavailable.
        """
        db = cls._conversation_db()
        if not conversation_id:
            return await db.create_conversation()

        existing = await db.get_conversation(conversation_id)
        if existing:
            return conversation_id

        return await db.create_conversation()

    @classmethod
    async def _load_history(cls, conversation_id: str, context_size: int) -> list:
        """Load recent messages from DB and convert to LangChain types."""
        messages = await cls._conversation_db().get_recent_messages(
            conversation_id,
            last_n=context_size * 2,  # *2 because each turn = user + assistant
        )
        history: list = []
        for msg in messages:
            if msg.role == "user":
                history.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                history.append(AIMessage(content=msg.content))
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
                    history_messages.append({"role": msg.type, "content": msg.content})
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
        trigger summarisation, and auto-generate title.

        When the provider did not report usage (common for streaming and
        agent paths), a tiktoken-based estimate is used so that
        ``total_tokens`` always advances.  Tool token counts (from
        ``self.last_tool_tokens``) are folded into the estimate when
        available; for provider-reported usage they are stored as zeros
        (the provider already included them in input/output counts).

        All operations are DB-resilient (ConversationDB methods no-op
        on failure), so this method never raises.
        """
        db = self._conversation_db()
        Summarizer = self._conversation_summarizer()

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
            # Provider already included tool tokens in input/output; mark as zero
            # so downstream code can distinguish "not tracked" from "counted above".
            usage = {**usage, "tool_input_tokens": 0, "tool_output_tokens": 0}

        msg_metadata: dict[str, Any] = dict(meta)
        msg_metadata["usage"] = usage
        if tool_interactions:
            msg_metadata["tool_calls"] = tool_interactions

        await db.append_message(
            conversation_id=conversation_id,
            role="assistant",
            content=response_text.strip(),
            metadata=msg_metadata,
        )

        if usage.get("total_tokens"):
            if not disable_summarization:
                new_total = await db.increment_total_tokens(
                    conversation_id,
                    usage["total_tokens"],
                )
                if Summarizer.should_summarize(new_total, model_name):
                    printer.info(f"Token threshold crossed ({new_total} tokens). Triggering background summarization.")
                    summarizer = Summarizer(self, model_name)
                    self._schedule_background(summarizer.run(conversation_id))
            else:
                await db.increment_total_tokens(
                    conversation_id,
                    usage["total_tokens"],
                )

        msg_count = await db.get_message_count(conversation_id)
        if msg_count == 2:
            self._schedule_background(
                db.generate_and_set_title(
                    conversation_id=conversation_id,
                    first_message=prompt,
                    ai_client=self,
                )
            )

    @classmethod
    def _schedule_background(cls, coro) -> None:
        """Fire-and-forget an async coroutine with GC protection."""
        task = asyncio.create_task(coro)
        cls._background_tasks.add(task)
        task.add_done_callback(cls._background_tasks.discard)

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
        """List available models across all registered providers.

        Returns:
            Dict mapping provider name to list of model info dicts.
        """
        all_models = {}
        for provider_name in ProviderRegistry.list_providers():
            models = self.list_models_for_provider(provider_name)
            if models:
                all_models[provider_name] = models
        return all_models

    def is_configured(self) -> bool:
        """Check whether the underlying provider is configured."""
        return self._provider.is_configured()

    def get_info(self) -> dict[str, Any]:
        """Return provider and client info."""
        info = self._provider.get_info()
        info["client_provider"] = self.provider_name
        info["auto_fallback"] = self.auto_fallback_to_mock
        return info

    def get_provider_name(self) -> str:
        """Return the name of the current provider."""
        return self.provider_name

    def get_model_name(self) -> str:
        """Get the model name from the underlying provider."""
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
        if self._mcp_registry:
            self._mcp_registry.register_tool(tool_dict, implementation)

    def get_registered_tools(self) -> list[dict[str, Any]]:
        """Return all tools registered in the MCP registry."""
        if self._mcp_registry:
            return self._mcp_registry.get_tools()
        return []

    def execute_tool(self, tool_name: str, **kwargs) -> Any:
        """Execute a registered tool by name."""
        if self._mcp_registry:
            return self._mcp_registry.execute_tool(tool_name, **kwargs)
        raise ValueError("No MCP registry configured")


class MockAIClient(AIClient):
    """Mock AI client for testing."""

    def __init__(self):
        super().__init__(provider="mock", auto_fallback_to_mock=False)
