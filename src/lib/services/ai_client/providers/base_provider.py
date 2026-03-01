from abc import ABC, abstractmethod
from collections.abc import Generator
from typing import TYPE_CHECKING, Any, Optional

from ....utils import printer


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry


class BaseAIProvider(ABC):
    @classmethod
    def get_provider_name(cls) -> str:
        raise NotImplementedError("Subclasses must implement get_provider_name()")

    @abstractmethod
    def __init__(self, **kwargs):
        """Initialize provider with configuration."""
        pass

    @abstractmethod
    def chat(self, prompt: str, history: list = None, **kwargs) -> str:
        """Send a chat message. Uses tools automatically if mcp_registry was provided."""
        pass

    @abstractmethod
    def chat_stream(self, prompt: str, history: list = None, **kwargs) -> Generator[str, None, None]:
        """Stream a chat message. Uses tools automatically if mcp_registry was provided."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def get_info(self) -> dict[str, Any]:
        pass


class LangChainProvider(BaseAIProvider):
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
        """Extract text from various content formats."""
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

    def chat(self, prompt: str, history: list = None, **kwargs) -> str:
        """
        Chat with AI. Uses agent with tools if available, otherwise direct LLM call.
        """
        agent_messages = self._build_agent_messages(history, prompt)

        if not self.agent:
            # Direct LLM invocation
            result = self.llm.invoke(agent_messages, **kwargs)
            return self._extract_text_from_content(result.content)

        # Agent invocation
        result = self.agent.invoke({"messages": agent_messages}, **kwargs)

        if isinstance(result, dict):
            messages = result.get("messages", [])
            if messages:
                last_message = messages[-1]
                if hasattr(last_message, "content"):
                    output = last_message.content
                elif isinstance(last_message, dict):
                    output = last_message.get("content", "")
                else:
                    output = str(last_message)
            else:
                output = result.get("output", result.get("result", ""))
        else:
            output = str(result)

        return self._extract_text_from_content(output) if output else ""

    def chat_stream(self, prompt: str, history: list = None, **kwargs) -> Generator[str, None, None]:
        """
        Stream chat with AI. Uses agent with tools if available, otherwise direct LLM call.
        """
        agent_messages = self._build_agent_messages(history, prompt)

        if not self.agent:
            # Direct LLM stream
            for chunk in self.llm.stream(agent_messages, **kwargs):
                content = chunk.content
                if isinstance(content, str) and content:
                    yield content
                elif isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            text = item.get("text", "")
                            if text:
                                yield text
            return

        # Agent stream
        for event in self.agent.stream({"messages": agent_messages}, stream_mode="messages", **kwargs):
            if isinstance(event, tuple) and len(event) >= 1:
                message = event[0]
                message_class = message.__class__.__name__

                # Skip tool messages
                if "Tool" in message_class:
                    continue

                # Yield AI message content
                if "AIMessage" in message_class and hasattr(message, "content"):
                    content = message.content
                    if isinstance(content, str) and content:
                        yield content
                    elif isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict) and item.get("type") == "text":
                                text = item.get("text", "")
                                if text:
                                    yield text

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
