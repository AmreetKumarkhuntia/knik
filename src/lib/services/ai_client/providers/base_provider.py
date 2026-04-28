"""Base AI provider interface and LangChain provider mixin."""

import json
from abc import ABC, abstractmethod
from collections.abc import Generator
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Optional

from ....core.config import Config
from ....utils import printer
from ..token_utils import count_message_tokens, count_tokens, get_context_window, register_context_window


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
        self.last_tool_tokens: dict | None = None
        self.last_tool_interactions: list | None = None
        self.last_context_tokens: int = 0

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

    @staticmethod
    def _count_history_tokens(history) -> int:
        if not history:
            return 0
        dicts = []
        for m in history:
            mtype = getattr(m, "type", "")
            if mtype in ("human", "ai"):
                role = "user" if mtype == "human" else "assistant"
                content = getattr(m, "content", "")
                if not isinstance(content, str):
                    content = ""
                dicts.append({"role": role, "content": content})
        return count_message_tokens(dicts) if dicts else 0

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
        self.last_context_tokens = self._count_history_tokens(history)
        agent_messages = self._build_agent_messages(history, prompt)

        if not self.agent:
            self.last_tool_tokens = None
            self.last_tool_interactions = None
            result = self.llm.invoke(agent_messages, **kwargs)
            self.last_usage = self._extract_usage(result)
            content = self._extract_text_from_content(result.content)
            return ChatResult(content=content, usage=self.last_usage)

        agent_result = self.agent.invoke({"messages": agent_messages}, **kwargs)

        if isinstance(agent_result, dict):
            messages = agent_result.get("messages", [])
            if messages:
                accumulated_usage: dict[str, int] | None = None
                tool_interactions: list[dict] = []
                pending_tool_calls: dict[str, dict] = {}

                for msg in messages:
                    msg_class = msg.__class__.__name__

                    if "AIMessage" in msg_class:
                        u = self._extract_usage(msg)
                        if u:
                            if accumulated_usage is None:
                                accumulated_usage = dict.fromkeys(u, 0)
                            accumulated_usage["input_tokens"] = u.get("input_tokens", 0)
                            accumulated_usage["output_tokens"] = accumulated_usage.get("output_tokens", 0) + u.get(
                                "output_tokens", 0
                            )
                            accumulated_usage["total_tokens"] = (
                                accumulated_usage["input_tokens"] + accumulated_usage["output_tokens"]
                            )

                        if hasattr(msg, "tool_calls") and msg.tool_calls:
                            for tc in msg.tool_calls:
                                tc_id = tc.get("id") or tc.get("name", "unknown")
                                args_json = json.dumps(tc.get("args", {}))
                                arg_tokens = count_tokens(args_json)
                                pending_tool_calls[tc_id] = {
                                    "tool_name": tc.get("name", "unknown"),
                                    "tool_args": tc.get("args", {}),
                                    "arg_tokens": arg_tokens,
                                }

                    elif "ToolMessage" in msg_class:
                        tool_call_id = getattr(msg, "tool_call_id", None)
                        content = getattr(msg, "content", "")
                        result_tokens = count_tokens(str(content) if content else "")

                        if tool_call_id and tool_call_id in pending_tool_calls:
                            tc_info = pending_tool_calls.pop(tool_call_id)
                            tool_interactions.append(
                                {
                                    "tool_name": tc_info["tool_name"],
                                    "tool_args": tc_info["tool_args"],
                                    "tool_result": content,
                                    "tokens": {
                                        "output_tokens": tc_info["arg_tokens"],
                                        "input_tokens": result_tokens,
                                    },
                                }
                            )
                        else:
                            tool_name = getattr(msg, "name", "unknown")
                            tool_interactions.append(
                                {
                                    "tool_name": tool_name,
                                    "tool_args": {},
                                    "tool_result": content,
                                    "tokens": {
                                        "output_tokens": 0,
                                        "input_tokens": result_tokens,
                                    },
                                }
                            )

                self.last_usage = accumulated_usage
                self.last_tool_interactions = tool_interactions if tool_interactions else None
                self.last_tool_tokens = (
                    {
                        "tool_output_tokens": sum(t["tokens"]["output_tokens"] for t in tool_interactions),
                        "tool_input_tokens": sum(t["tokens"]["input_tokens"] for t in tool_interactions),
                    }
                    if tool_interactions
                    else None
                )

                last_message = messages[-1]
                if hasattr(last_message, "content"):
                    output = last_message.content
                elif isinstance(last_message, dict):
                    output = last_message.get("content", "")
                else:
                    output = str(last_message)
            else:
                output = agent_result.get("output", agent_result.get("result", ""))
                self.last_usage = None
                self.last_tool_tokens = None
                self.last_tool_interactions = None
        else:
            output = str(agent_result)
            self.last_usage = None
            self.last_tool_tokens = None
            self.last_tool_interactions = None

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
        self.last_context_tokens = self._count_history_tokens(history)
        agent_messages = self._build_agent_messages(history, prompt)
        self.last_usage = None
        self.last_tool_tokens = None
        self.last_tool_interactions = None

        if not self.agent:
            last_chunk = None
            for chunk in self.llm.stream(agent_messages, **kwargs):
                last_chunk = chunk
                yield from self._yield_content(chunk.content)

            if last_chunk is not None:
                self.last_usage = self._extract_usage(last_chunk)
            return

        accumulated_usage: dict[str, int] | None = None
        tool_interactions: list[dict] = []
        pending_tool_calls: dict[str, dict] = {}

        for event in self.agent.stream({"messages": agent_messages}, stream_mode="messages", **kwargs):
            if not (isinstance(event, tuple) and len(event) >= 1):
                continue
            message = event[0]
            message_class = message.__class__.__name__

            if "Tool" in message_class:
                tool_call_id = getattr(message, "tool_call_id", None)
                tool_name = getattr(message, "name", "unknown")
                content = getattr(message, "content", "")
                result_tokens = count_tokens(str(content) if content else "")

                if tool_call_id and tool_call_id in pending_tool_calls:
                    tc_info = pending_tool_calls.pop(tool_call_id)
                    tool_interactions.append(
                        {
                            "tool_name": tc_info["tool_name"],
                            "tool_args": tc_info["tool_args"],
                            "tool_result": content,
                            "tokens": {
                                "output_tokens": tc_info["arg_tokens"],
                                "input_tokens": result_tokens,
                            },
                        }
                    )
                else:
                    tool_interactions.append(
                        {
                            "tool_name": tool_name,
                            "tool_args": {},
                            "tool_result": content,
                            "tokens": {
                                "output_tokens": 0,
                                "input_tokens": result_tokens,
                            },
                        }
                    )

                yield {
                    "__tool_call_end__": True,
                    "tool_name": tool_name,
                    "tool_call_id": tool_call_id,
                    "tool_result_preview": str(content)[:200],
                }
                continue

            if "AIMessage" in message_class:
                u = self._extract_usage(message)
                if u:
                    if accumulated_usage is None:
                        accumulated_usage = dict.fromkeys(u, 0)
                    accumulated_usage["input_tokens"] = u.get("input_tokens", 0)
                    accumulated_usage["output_tokens"] = accumulated_usage.get("output_tokens", 0) + u.get(
                        "output_tokens", 0
                    )
                    accumulated_usage["total_tokens"] = (
                        accumulated_usage["input_tokens"] + accumulated_usage["output_tokens"]
                    )

                if hasattr(message, "tool_calls") and message.tool_calls:
                    yield from self._yield_content(message.content)
                    for tc in message.tool_calls:
                        tc_id = tc.get("id") or tc.get("name", "unknown")
                        args_json = json.dumps(tc.get("args", {}))
                        arg_tokens = count_tokens(args_json)
                        pending_tool_calls[tc_id] = {
                            "tool_name": tc.get("name", "unknown"),
                            "tool_args": tc.get("args", {}),
                            "arg_tokens": arg_tokens,
                        }
                        yield {
                            "__tool_call_start__": True,
                            "tool_name": tc.get("name", "unknown"),
                            "tool_call_id": tc_id,
                            "tool_args": tc.get("args", {}),
                        }
                    continue

                yield from self._yield_content(message.content)

        self.last_usage = accumulated_usage
        if tool_interactions:
            self.last_tool_interactions = tool_interactions
            self.last_tool_tokens = {
                "tool_output_tokens": sum(t["tokens"]["output_tokens"] for t in tool_interactions),
                "tool_input_tokens": sum(t["tokens"]["input_tokens"] for t in tool_interactions),
            }

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
