"""Google Vertex AI Provider with LangChain"""

import os
from typing import TYPE_CHECKING, Any, Optional

from ....utils import printer
from ..registry import ProviderRegistry
from .base_provider import LangChainProvider


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry

try:
    from langchain.agents import create_agent
    from langchain_google_vertexai import ChatVertexAI

    LANGCHAIN_VERTEX_AVAILABLE = True
except ImportError:
    LANGCHAIN_VERTEX_AVAILABLE = False
    create_agent = None


class VertexAIProvider(LangChainProvider):
    @classmethod
    def get_provider_name(cls) -> str:
        return "vertex"

    def _create_agent(self, llm, mcp_registry, system_instruction):
        """Create a LangChain agent using new v1.x create_agent pattern"""
        if not create_agent or not mcp_registry:
            return None

        tools = mcp_registry.create_langchain_tools()

        if not tools:
            printer.warning("No tools available for agent creation")
            return None

        try:
            agent = create_agent(
                model=llm,
                tools=tools,
                system_prompt=system_instruction or "You are a helpful AI assistant with access to tools.",
            )
            printer.success(f"Created agent with {len(tools)} tools")
            return agent
        except Exception as e:
            printer.error(f"Failed to create agent: {e}")
            return None

    def __init__(
        self,
        project_id: str | None = None,
        location: str = "us-central1",
        model_name: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int | None = None,
        mcp_registry: Optional["MCPServerRegistry"] = None,
        system_instruction: str | None = None,
        tool_callback=None,
        **kwargs,
    ):
        if not LANGCHAIN_VERTEX_AVAILABLE:
            raise ImportError("LangChain Vertex AI not installed. Run: pip install langchain-google-vertexai")

        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT")
        if not self.project_id:
            raise RuntimeError("No project_id. Set GOOGLE_CLOUD_PROJECT env var or pass project_id parameter.")

        self.location = location
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        # Create LangChain model (don't pass tool_callback - it's for internal use only)
        llm = ChatVertexAI(
            model_name=model_name,
            project=self.project_id,
            location=location,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        agent = self._create_agent(llm, mcp_registry, system_instruction) if mcp_registry else None

        super().__init__(
            llm=llm,
            agent=agent,
            provider_name="vertex",
            mcp_registry=mcp_registry,
            system_instruction=system_instruction,
            tool_callback=tool_callback,
            project_id=self.project_id,
            location=location,
            model=model_name,
        )

        if agent:
            printer.success(f"Vertex AI initialized with agent: {model_name}")
        else:
            printer.success(f"Vertex AI initialized: {model_name}")

    def is_configured(self) -> bool:
        return self.project_id is not None and LANGCHAIN_VERTEX_AVAILABLE

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": "vertex",
            "framework": "langchain",
            "model": self.model_name,
            "project_id": self.project_id,
            "location": self.location,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "supports_tools": True,
            "supports_streaming": True,
        }


ProviderRegistry.register(VertexAIProvider.get_provider_name(), VertexAIProvider)
