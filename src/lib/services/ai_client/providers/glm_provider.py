"""ZhipuAI GLM Provider with LangChain

Mirrors the Gemini provider pattern: create LLM → create agent → super().__init__().
Uses native LangGraph create_agent for tool calling.

STREAMING NOTE:
  ChatZhipuAI._stream() requires 'Content-Type: text/event-stream' which
  ZhipuAI does not reliably return. We set streaming=False so all calls use
  the plain JSON path. base_provider.chat_stream() will then stream token
  chunks from the LLM directly (no SSE involved).
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
    from langchain_community.chat_models import ChatZhipuAI

    LANGCHAIN_GLM_AVAILABLE = True
except ImportError:
    LANGCHAIN_GLM_AVAILABLE = False
    create_agent = None


class GLMAIProvider(LangChainProvider):
    @classmethod
    def get_provider_name(cls) -> str:
        return "glm"

    def _create_agent(self, llm, mcp_registry, system_instruction):
        """Create a LangChain agent using new v1.x create_agent pattern"""
        if not create_agent or not mcp_registry:
            return None

        tools = mcp_registry.create_langchain_tools()

        if not tools:
            printer.warning("GLM: No tools available for agent creation")
            return None

        try:
            agent = create_agent(
                model=llm,
                tools=tools,
                system_prompt=system_instruction or "You are a helpful AI assistant with access to tools.",
            )
            return agent
        except Exception as e:
            printer.error(f"GLM: Failed to create agent: {e}")
            return None

    def __init__(
        self,
        model_name: str = "glm-4.5-flash",
        temperature: float = 0.7,
        max_tokens: int | None = None,
        mcp_registry: Optional["MCPServerRegistry"] = None,
        system_instruction: str | None = None,
        tool_callback=None,
        **kwargs,
    ):
        if not LANGCHAIN_GLM_AVAILABLE:
            raise ImportError(
                "LangChain Community or zhipuai not installed. Run: pip install langchain-community zhipuai"
            )

        self.api_key = os.getenv("ZHIPUAI_API_KEY")
        if not self.api_key:
            raise RuntimeError("No API key found. Set ZHIPUAI_API_KEY environment variable.")

        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        if "model" in kwargs:
            self.model_name = kwargs["model"]
            model_name = self.model_name

        filtered_kwargs = {
            k: v
            for k, v in kwargs.items()
            if k not in ["model", "model_name", "zhipuai_api_key", "temperature", "max_tokens"]
        }

        # streaming=False avoids SSE header issues
        llm = ChatZhipuAI(
            model=self.model_name,
            api_key=self.api_key,
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=False,
            **filtered_kwargs,
        )

        agent = self._create_agent(llm, mcp_registry, system_instruction)

        super().__init__(
            llm=llm,
            agent=agent,
            provider_name="glm",
            mcp_registry=mcp_registry,
            system_instruction=system_instruction,
            tool_callback=tool_callback,
            model=model_name,
        )

    def is_configured(self) -> bool:
        return self.api_key is not None and LANGCHAIN_GLM_AVAILABLE

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": "glm",
            "framework": "langchain",
            "model": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "supports_tools": True,
            "supports_streaming": True,
        }


ProviderRegistry.register(GLMAIProvider.get_provider_name(), GLMAIProvider)
