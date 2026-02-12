"""Google Gemini AI Studio Provider with LangChain"""

import os
from typing import TYPE_CHECKING, Any, Optional

from ....utils import printer
from ..registry import ProviderRegistry
from .base_provider import LangChainProvider


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry

try:
    from langchain.agents import create_agent
    from langchain_google_genai import ChatGoogleGenerativeAI

    LANGCHAIN_GEMINI_AVAILABLE = True
except ImportError:
    LANGCHAIN_GEMINI_AVAILABLE = False
    create_agent = None


class GeminiAIProvider(LangChainProvider):
    @classmethod
    def get_provider_name(cls) -> str:
        return "gemini"

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
        model_name: str = "gemini-1.5-flash",
        temperature: float = 0.7,
        max_tokens: int | None = None,
        mcp_registry: Optional["MCPServerRegistry"] = None,
        system_instruction: str | None = None,
        tool_callback=None,
        **kwargs,
    ):
        if not LANGCHAIN_GEMINI_AVAILABLE:
            raise ImportError(
                "LangChain Google GenAI not installed. Run: pip install langchain-google-genai"
            )

        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise RuntimeError(
                "No API key found. Set GEMINI_API_KEY environment variable."
            )

        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        # Extract model from kwargs if passed (overrides model_name parameter)
        # This handles cases where AIClient passes model=... instead of model_name=...
        if 'model' in kwargs:
            self.model_name = kwargs['model']
            model_name = self.model_name

        # Filter out parameters we're setting explicitly AND Vertex AI specific params
        # Vertex AI uses: project_id, location, project
        # Gemini AI Studio uses: google_api_key
        filtered_kwargs = {
            k: v for k, v in kwargs.items() 
            if k not in ['model', 'model_name', 'google_api_key', 'temperature', 'max_output_tokens', 
                        'project_id', 'location', 'project']
        }

        # Create LangChain model (don't pass tool_callback - it's for internal use only)
        llm = ChatGoogleGenerativeAI(
            model=self.model_name,
            google_api_key=self.api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
            **filtered_kwargs,
        )

        agent = self._create_agent(llm, mcp_registry, system_instruction) if mcp_registry else None

        super().__init__(
            llm=llm,
            agent=agent,
            provider_name="gemini",
            mcp_registry=mcp_registry,
            system_instruction=system_instruction,
            tool_callback=tool_callback,
            model=model_name,
        )

        if agent:
            printer.success(f"Gemini AI Studio initialized with agent: {model_name}")
        else:
            printer.success(f"Gemini AI Studio initialized: {model_name}")

    def is_configured(self) -> bool:
        return self.api_key is not None and LANGCHAIN_GEMINI_AVAILABLE

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": "gemini",
            "framework": "langchain",
            "model": self.model_name,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "supports_tools": True,
            "supports_streaming": True,
        }


ProviderRegistry.register(GeminiAIProvider.get_provider_name(), GeminiAIProvider)
