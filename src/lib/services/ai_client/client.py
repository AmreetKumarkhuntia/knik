"""Unified AI Client for interacting with             if auto_fallback_to_mock:
        printer.warning(f"{provider} not configured. Using mock provider.")
        mock_class = ProviderRegistry.get("mock")
        # Pass mcp_registry and system_instruction to mock provider too
        self._provider = mock_class(mcp_registry=mcp_registry, system_instruction=system_instruction)
        self.provider_name = "mock"

except Exception as e:
    if auto_fallback_to_mock:
        printer.warning(f"Error initializing {provider}: {e}")
        printer.info("Using mock provider.")
        mock_class = ProviderRegistry.get("mock")
        self._provider = mock_class(mcp_registry=mcp_registry, system_instruction=system_instruction)
        self.provider_name = "mock"
    else:
        raiseders."""

from collections.abc import Generator
from typing import Any

from ...utils import printer
from .providers import BaseAIProvider
from .registry import MCPServerRegistry, ProviderRegistry


class AIClient:
    """Unified AI client supporting multiple providers via registry."""

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
        self.tool_callback = tool_callback

        # Pass internal parameters to provider (not to LangChain model)
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
                # Pass mcp_registry to mock provider too
                self._provider = mock_class(mcp_registry=mcp_registry)
                self.provider_name = "mock"

        except Exception as e:
            if auto_fallback_to_mock:
                printer.warning(f"Error initializing {provider}: {e}")
                printer.info("Using mock provider.")
                mock_class = ProviderRegistry.get("mock")
                self._provider = mock_class(mcp_registry=mcp_registry)
                self.provider_name = "mock"
            else:
                raise

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
            return self._provider.chat(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                history=history,
                **kwargs,
            )
        except Exception as e:
            error_msg = f"Chat error: {e}"
            printer.error(error_msg)
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
            yield from self._provider.chat_stream(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                history=history,
                **kwargs,
            )
        except Exception as e:
            error_msg = f"Chat streaming error: {e}"
            printer.error(error_msg)
            yield error_msg

    def is_configured(self) -> bool:
        return self._provider.is_configured()

    def get_info(self) -> dict[str, Any]:
        info = self._provider.get_info()
        info["client_provider"] = self.provider_name
        info["auto_fallback"] = self.auto_fallback_to_mock
        return info

    def get_provider_name(self) -> str:
        return self.provider_name

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
        MCPServerRegistry.register_tool(tool_dict, implementation)

    def get_registered_tools(self) -> list[dict[str, Any]]:
        return MCPServerRegistry.get_tools()

    def execute_tool(self, tool_name: str, **kwargs) -> Any:
        """Execute a registered tool by name."""
        return MCPServerRegistry.execute_tool(tool_name, **kwargs)




class MockAIClient(AIClient):
    """Mock AI client for testing."""

    def __init__(self):
        super().__init__(provider="mock", auto_fallback_to_mock=False)
