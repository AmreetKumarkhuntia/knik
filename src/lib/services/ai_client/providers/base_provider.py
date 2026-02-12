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
        **config,
    ):
        self._llm_raw = llm
        self._provider_name = provider_name
        self.config = config
        self.system_instruction = system_instruction
        self.tool_callback = tool_callback

        # Agent is REQUIRED - subclass must create it
        if not agent:
            raise ValueError(
                f"{provider_name}: Agent was not created. Subclass must create and provide an agent instance."
            )

        self.agent = agent
        self.mcp_registry = mcp_registry

        # If mcp_registry provided, bind tools to LLM
        if mcp_registry:
            tools = mcp_registry.create_langchain_tools()
            self.llm = llm.bind_tools(tools) if tools else llm
            printer.success(f"✓ {provider_name} initialized with agent and {len(tools)} tools")
        else:
            self.llm = llm
            printer.success(f"✓ {provider_name} initialized with agent (no tools)")

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
        Chat with AI. Uses agent with tools if mcp_registry was provided during init.
        Agent must exist if this is called (enforced during initialization).
        """
        if not self.agent:
            raise RuntimeError(
                "Chat requires agent to be initialized. Initialize provider without mcp_registry for direct LLM calls."
            )

        agent_messages = self._build_agent_messages(history, prompt)
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
        Stream chat with AI. Uses agent with tools if mcp_registry was provided during init.
        Agent must exist if this is called (enforced during initialization).
        """
        if not self.agent:
            raise RuntimeError(
                "Chat stream requires agent to be initialized. "
                "Initialize provider without mcp_registry for direct LLM calls."
            )

        agent_messages = self._build_agent_messages(history, prompt)

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
