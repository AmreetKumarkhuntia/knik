from abc import ABC, abstractmethod
from collections.abc import Generator
from typing import TYPE_CHECKING, Any, Optional

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from ....utils import printer


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry


class BaseAIProvider(ABC):
    @classmethod
    def get_provider_name(cls) -> str:
        raise NotImplementedError("Subclasses must implement get_provider_name()")

    @abstractmethod
    def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
        pass

    @abstractmethod
    def query_stream(self, prompt: str, use_tools: bool = False, **kwargs) -> Generator[str, None, None]:
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
        self.agent = agent
        self.mcp_registry = mcp_registry
        self.system_instruction = system_instruction
        self.tool_callback = tool_callback

        if mcp_registry:
            tools = mcp_registry.create_langchain_tools()
            self.llm = llm.bind_tools(tools) if tools else llm
            printer.success(f"Bound {len(tools)} tools to {provider_name} LLM at initialization")
        else:
            self.llm = llm

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

    def query(self, prompt: str, use_tools: bool = False, history: list = None, **kwargs) -> str:
        printer.info(f"🔍 Provider query starting (use_tools={use_tools}, history={len(history) if history else 0} msgs)")

        messages = [SystemMessage(content=self.system_instruction)] if self.system_instruction else []

        # Add conversation history if provided
        if history:
            messages.extend(history)
            printer.info(f"📚 Loaded {len(history)} history messages")

        messages.append(HumanMessage(content=prompt))
        printer.info(f"📝 Built message chain: {len(messages)} total messages")

        if use_tools and self.mcp_registry:
            printer.info("🛠️  Invoking LLM with tools enabled...")
            response = self.llm.invoke(messages, **kwargs)
            messages.append(response)

            if hasattr(response, "tool_calls") and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call.get("args", {})
                    printer.info(f"🔧 {tool_name}")

                    if self.tool_callback:
                        self.tool_callback(tool_name, tool_args)

                    try:
                        result = self.mcp_registry.execute_tool(tool_name, **tool_args)
                        messages.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))
                    except Exception as e:
                        messages.append(ToolMessage(content=f"Error: {str(e)}", tool_call_id=tool_call["id"]))

                final_response = self.llm.invoke(messages, **kwargs)
                return self._extract_text_from_content(final_response.content) if final_response.content else ""

            result = self._extract_text_from_content(response.content) if response.content else ""
            printer.success(f"✅ LLM response received ({len(result)} chars)")
            return result
        else:
            printer.info("💬 Invoking LLM (no tools)...")
            response = self._llm_raw.invoke(messages, **kwargs)
            result = self._extract_text_from_content(response.content) if response.content else ""
            printer.success(f"✅ LLM response received ({len(result)} chars)")
            return result

    def query_stream(
        self, prompt: str, use_tools: bool = False, history: list = None, **kwargs
    ) -> Generator[str, None, None]:
        messages = [SystemMessage(content=self.system_instruction)] if self.system_instruction else []

        # Add conversation history if provided
        if history:
            messages.extend(history)

        messages.append(HumanMessage(content=prompt))

        if use_tools and self.mcp_registry:
            response = self.llm.invoke(messages, **kwargs)
            messages.append(response)

            if hasattr(response, "tool_calls") and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call.get("args", {})
                    printer.info(f"🔧 {tool_name}")

                    if self.tool_callback:
                        self.tool_callback(tool_name, tool_args)

                    try:
                        result = self.mcp_registry.execute_tool(tool_name, **tool_args)
                        messages.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))
                    except Exception as e:
                        messages.append(ToolMessage(content=f"Error: {str(e)}", tool_call_id=tool_call["id"]))

                for chunk in self.llm.stream(messages, **kwargs):
                    if chunk.content:
                        yield self._extract_text_from_content(chunk.content)
            elif response.content:
                yield self._extract_text_from_content(response.content)
        else:
            for chunk in self._llm_raw.stream(messages, **kwargs):
                if chunk.content:
                    yield self._extract_text_from_content(chunk.content)

    def chat_with_agent(self, prompt: str, use_tools: bool = False, history: list = None, **kwargs) -> str:
        """Execute prompt using LangChain agent. Falls back to query if no agent."""
        if not self.agent:
            return self.query(prompt=prompt, use_tools=use_tools, history=history, **kwargs)

        # Build message list with history
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

    def chat_with_agent_stream(
        self, prompt: str, use_tools: bool = False, history: list = None, **kwargs
    ) -> Generator[str, None, None]:
        """Stream agent responses. Falls back to query_stream if no agent."""
        if not self.agent:
            yield from self.query_stream(prompt=prompt, use_tools=use_tools, history=history, **kwargs)
            return

        printer.debug(f"Agent stream with {len(history) if history else 0} history messages")

        agent_messages = self._build_agent_messages(history, prompt)
        previous_content = None

        for chunk in self.agent.stream({"messages": agent_messages}, stream_mode="values", **kwargs):
            if isinstance(chunk, dict):
                messages = chunk.get("messages", [])
                if messages:
                    last_message = messages[-1]
                    message_type = getattr(last_message, "type", None) or getattr(
                        last_message, "__class__.__name__", None
                    )

                    # Log tool calls when they happen
                    if message_type == "tool":
                        printer.debug(f"Tool message detected in stream: {last_message}")

                    if message_type == "ai" or (
                        hasattr(last_message, "content") and message_type not in ["human", "tool"]
                    ):
                        if hasattr(last_message, "content"):
                            content = self._extract_text_from_content(last_message.content)
                            if content and content != previous_content:
                                yield content
                                previous_content = content
                        elif isinstance(last_message, dict):
                            content = last_message.get("content", "")
                            if content and content != previous_content:
                                yield self._extract_text_from_content(content)
                                previous_content = content

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
