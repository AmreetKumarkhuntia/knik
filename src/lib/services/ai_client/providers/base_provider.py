"""Base AI provider interface and LangChain provider mixin."""

from abc import ABC, abstractmethod
from collections.abc import Generator
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Optional

from ....core.config import Config
from ....utils import printer
from ..token_utils import get_context_window, register_context_window


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry


@dataclass
class ChatResult:
    """Result from a chat() call, including content and token usage."""

    content: str
    usage: dict[str, int] | None = None  # {input_tokens, output_tokens, total_tokens}


@dataclass
class ModelInfo:
    """Information about an available model."""

    id: str
    name: str
    context_window: int
    provider: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "context_window": self.context_window,
            "provider": self.provider,
        }


class BaseAIProvider(ABC):
    @classmethod
    def get_provider_name(cls) -> str:
        raise NotImplementedError("Subclasses must implement get_provider_name()")

    @abstractmethod
    def __init__(self, **kwargs):
        """Initialize the provider with the given configuration."""
        pass

    @abstractmethod
    def chat(self, prompt: str, history: list = None, **kwargs) -> str | ChatResult:
        pass

    @abstractmethod
    def chat_stream(self, prompt: str, history: list = None, **kwargs) -> Generator[str, None, None]:
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def get_info(self) -> dict[str, Any]:
        pass

    @abstractmethod
    def get_models(self) -> list[dict[str, Any]]:
        """Query the provider API for available models.

        Returns:
            List of model info dicts: [{id, name, context_window, provider}]
            Returns [] if the API call fails.
        """
        pass

    # Maps provider names to model-ID prefixes used for filtering
    # Config.AI_MODELS in the fallback path.
    _PROVIDER_MODEL_PREFIXES: dict[str, list[str]] = {
        "vertex": ["gemini"],
        "gemini": ["gemini"],
        "zhipuai": ["glm"],
        "zai": ["glm"],
        "zai_coding": ["glm"],
    }

    def get_models_with_fallback(self) -> list[dict[str, Any]]:
        """Get models from API, falling back to Config.AI_MODELS on failure.

        Tries get_models() first. If it returns an empty list or raises,
        filters Config.AI_MODELS for models belonging to this provider.

        All returned models have their context_window registered in the
        runtime cache so that ``get_context_window()`` uses live values.
        """
        try:
            models = self.get_models()
            if models:
                for m in models:
                    register_context_window(m["id"], m["context_window"])
                return models
        except Exception as e:
            printer.warning(f"Model discovery failed for {self.get_provider_name()}: {e}")

        try:
            provider_name = self.get_provider_name()
            prefixes = self._PROVIDER_MODEL_PREFIXES.get(provider_name, [])
            fallback_models = []
            for model_id, description in Config.AI_MODELS.items():
                if prefixes and not any(model_id.startswith(p) for p in prefixes):
                    continue
                fallback_models.append(
                    {
                        "id": model_id,
                        "name": description,
                        "context_window": self._get_context_window_for_model(model_id),
                        "provider": provider_name,
                    }
                )
            return fallback_models
        except Exception:
            return []

    def _get_context_window_for_model(self, model: str) -> int:
        """Look up the context window size for a model."""
        return get_context_window(model)


class LangChainProvider(BaseAIProvider):
    """Mixin for providers built on LangChain LLM and agent APIs."""

    def __init__(
        self,
        llm,
        agent,
        provider_name: str,
        mcp_registry: Optional["MCPServerRegistry"] = None,
        system_instruction: str | None = None,
        tool_callback=None,
        skip_tool_binding: bool = False,
        **config,
    ):
        self._llm_raw = llm
        self._provider_name = provider_name
        self.config = config
        self.system_instruction = system_instruction
        self.tool_callback = tool_callback
        self.last_usage: dict[str, int] | None = None

        self.agent = agent
        self.mcp_registry = mcp_registry

        # If mcp_registry provided and this provider doesn't manage its own binding,
        # bind tools to the LLM now.  Providers that run their own tool loop
        # (e.g. GLMAIProvider) pass skip_tool_binding=True so the raw LLM is
        # stored untouched and they can bind once inside their own loop.
        if mcp_registry and not skip_tool_binding:
            tools = mcp_registry.create_langchain_tools()
            if tools:
                self.llm = llm.bind_tools(tools)
                if self.agent:
                    printer.success(f"✓ {provider_name} initialized with agent and {len(tools)} bound tools")
                else:
                    printer.success(f"✓ {provider_name} initialized with {len(tools)} bound tools")
            else:
                self.llm = llm
                printer.success(f"✓ {provider_name} initialized (no tools available)")
        else:
            self.llm = llm
            if mcp_registry and self.agent:
                tools = mcp_registry.create_langchain_tools()
                if tools:
                    printer.success(f"✓ {provider_name} initialized with agent and {len(tools)} tools (self-managed)")
                else:
                    printer.success(f"✓ {provider_name} initialized with agent (no tools available)")
            else:
                printer.success(f"✓ {provider_name} initialized (no tools)")

    def _extract_text_from_content(self, content) -> str:
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict):
                    text_parts.append(item.get("text", item.get("content", "")))
                elif isinstance(item, str):
                    text_parts.append(item)
            return "".join(text_parts)
        elif isinstance(content, dict):
            return content.get("text", content.get("content", ""))
        return ""

    def _extract_usage(self, result) -> dict[str, int] | None:
        """Extract usage metadata from a LangChain response object.

        Works with AIMessage, AIMessageChunk, and agent result dicts.
        """
        usage = getattr(result, "usage_metadata", None)
        if usage is not None and isinstance(usage, dict):
            return {
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            }

        response_meta = getattr(result, "response_metadata", None)
        if response_meta is not None and isinstance(response_meta, dict):
            token_usage = response_meta.get("token_usage") or response_meta.get("usage")
            if token_usage is not None and isinstance(token_usage, dict):
                return {
                    "input_tokens": token_usage.get("prompt_tokens", token_usage.get("input_tokens", 0)),
                    "output_tokens": token_usage.get("completion_tokens", token_usage.get("output_tokens", 0)),
                    "total_tokens": token_usage.get("total_tokens", 0),
                }

        return None

    def _build_agent_messages(self, history: list | None, prompt: str) -> list[dict]:
        """Build message list for agent with conversation history."""
        messages = []

        if history:
            for msg in history:
                if hasattr(msg, "type"):
                    if msg.type == "human":
                        messages.append({"role": "user", "content": msg.content})
                    elif msg.type == "ai":
                        messages.append({"role": "assistant", "content": msg.content})

        messages.append({"role": "user", "content": prompt})
        return messages

    @classmethod
    def get_provider_name(cls) -> str:
        return "langchain"

    def chat(self, prompt: str, history: list = None, **kwargs) -> ChatResult:
        """
        Chat with AI. Uses agent with tools if available, otherwise direct LLM call.
        Returns ChatResult with content and usage metadata.
        """
        agent_messages = self._build_agent_messages(history, prompt)

        if not self.agent:
            result = self.llm.invoke(agent_messages, **kwargs)
            self.last_usage = self._extract_usage(result)
            content = self._extract_text_from_content(result.content)
            return ChatResult(content=content, usage=self.last_usage)

        result = self.agent.invoke({"messages": agent_messages}, **kwargs)

        if isinstance(result, dict):
            messages = result.get("messages", [])
            if messages:
                last_message = messages[-1]
                self.last_usage = self._extract_usage(last_message)
                if hasattr(last_message, "content"):
                    output = last_message.content
                elif isinstance(last_message, dict):
                    output = last_message.get("content", "")
                else:
                    output = str(last_message)
            else:
                output = result.get("output", result.get("result", ""))
                self.last_usage = None
        else:
            output = str(result)
            self.last_usage = None

        content = self._extract_text_from_content(output) if output else ""
        return ChatResult(content=content, usage=self.last_usage)

    def _yield_content(self, content):
        if isinstance(content, str) and content:
            yield content
        elif isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text = item.get("text", "")
                    if text:
                        yield text

    def chat_stream(self, prompt: str, history: list = None, **kwargs) -> Generator[str | dict, None, None]:
        agent_messages = self._build_agent_messages(history, prompt)
        self.last_usage = None

        if not self.agent:
            last_chunk = None
            for chunk in self.llm.stream(agent_messages, **kwargs):
                last_chunk = chunk
                yield from self._yield_content(chunk.content)

            if last_chunk is not None:
                self.last_usage = self._extract_usage(last_chunk)
            return

        last_ai_message = None
        for event in self.agent.stream({"messages": agent_messages}, stream_mode="messages", **kwargs):
            if not (isinstance(event, tuple) and len(event) >= 1):
                continue
            message = event[0]
            message_class = message.__class__.__name__

            if "Tool" in message_class:
                yield {
                    "__tool_call_end__": True,
                    "tool_name": getattr(message, "name", "unknown"),
                    "tool_result_preview": str(getattr(message, "content", ""))[:200],
                }
                continue

            if "AIMessage" in message_class:
                last_ai_message = message

                if hasattr(message, "tool_calls") and message.tool_calls:
                    yield from self._yield_content(message.content)
                    for tc in message.tool_calls:
                        yield {
                            "__tool_call_start__": True,
                            "tool_name": tc.get("name", "unknown"),
                            "tool_args": tc.get("args", {}),
                        }
                    continue

                yield from self._yield_content(message.content)

        if last_ai_message is not None:
            self.last_usage = self._extract_usage(last_ai_message)

    def get_models(self) -> list[dict[str, Any]]:
        """Default implementation returns empty list.

        Concrete providers should override this to query their API.
        """
        return []

    def is_configured(self) -> bool:
        return self._llm_raw is not None

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": self._provider_name,
            "framework": "langchain",
            "model": getattr(self.llm, "model_name", "unknown"),
            "supports_tools": True,
            "supports_streaming": True,
            **self.config,
        }
