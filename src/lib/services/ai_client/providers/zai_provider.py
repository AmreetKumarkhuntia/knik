"""Z.AI Provider with LangChain

Uses OpenAI-compatible API via langchain-openai.
API Base: https://api.z.ai/api/paas/v4/

Documentation: https://docs.z.ai/guides/develop/langchain/introduction
"""

import os
from typing import TYPE_CHECKING, Any, Optional

from ....utils import printer
from ..registry import ProviderRegistry
from .base_provider import LangChainProvider


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry

try:
    from langchain.agents import create_agent
    from langchain_openai import ChatOpenAI

    LANGCHAIN_ZAI_AVAILABLE = True
except ImportError:
    LANGCHAIN_ZAI_AVAILABLE = False
    create_agent = None


class ZAIProvider(LangChainProvider):
    """Z.AI provider using OpenAI-compatible API."""

    @classmethod
    def get_provider_name(cls) -> str:
        return "zai"

    def _create_agent(self, llm, mcp_registry, system_instruction):
        """Create a LangChain agent using new v1.x create_agent pattern"""
        if not create_agent or not mcp_registry:
            return None

        tools = mcp_registry.create_langchain_tools()

        if not tools:
            printer.warning("Z.AI: No tools available for agent creation")
            return None

        try:
            agent = create_agent(
                model=llm,
                tools=tools,
                system_prompt=system_instruction or "You are a helpful AI assistant with access to tools.",
            )
            return agent
        except Exception as e:
            printer.error(f"Z.AI: Failed to create agent: {e}")
            return None

    def __init__(
        self,
        model_name: str = "glm-5",
        temperature: float = 0.7,
        max_tokens: int | None = None,
        mcp_registry: Optional["MCPServerRegistry"] = None,
        system_instruction: str | None = None,
        tool_callback=None,
        **kwargs,
    ):
        if not LANGCHAIN_ZAI_AVAILABLE:
            raise ImportError("LangChain OpenAI not installed. Run: pip install langchain-openai")

        self.api_key = os.getenv("ZAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("No API key found. Set ZAI_API_KEY environment variable.")

        self.api_base = os.getenv("ZAI_API_BASE", "https://api.z.ai/api/paas/v4/")
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        if "model" in kwargs:
            self.model_name = kwargs["model"]
            model_name = self.model_name

        filtered_kwargs = {
            k: v
            for k, v in kwargs.items()
            if k not in ["model", "model_name", "zai_api_key", "api_base", "temperature", "max_tokens"]
        }

        llm = ChatOpenAI(
            model=self.model_name,
            api_key=self.api_key,
            base_url=self.api_base,
            temperature=temperature,
            max_tokens=max_tokens,  # type: ignore[reportCallIssue]
            **filtered_kwargs,
        )

        agent = self._create_agent(llm, mcp_registry, system_instruction)

        super().__init__(
            llm=llm,
            agent=agent,
            provider_name="zai",
            mcp_registry=mcp_registry,
            system_instruction=system_instruction,
            tool_callback=tool_callback,
            model=model_name,
        )

    def is_configured(self) -> bool:
        return self.api_key is not None and LANGCHAIN_ZAI_AVAILABLE

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": "zai",
            "framework": "langchain-openai",
            "model": self.model_name,
            "api_base": self.api_base,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "supports_tools": True,
            "supports_streaming": True,
        }


ProviderRegistry.register(ZAIProvider.get_provider_name(), ZAIProvider)
