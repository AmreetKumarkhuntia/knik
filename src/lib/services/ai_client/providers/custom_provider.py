"""Custom OpenAI-Compatible Provider with LangChain

Connects to any OpenAI-compatible API endpoint (Ollama, LM Studio,
Together AI, Groq, vLLM, Fireworks, etc.) via langchain-openai.

Configuration (environment variables):
    KNIK_CUSTOM_API_BASE  - Required. The base URL of the API endpoint.
    KNIK_CUSTOM_API_KEY   - Optional. API key for authentication.
                            Defaults to "not-needed" for local servers.
"""

import os
from typing import TYPE_CHECKING, Any, Optional

from ....utils import printer
from ..registry import ProviderRegistry
from ..token_utils import get_context_window
from .base_provider import LangChainProvider


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry

try:
    from langchain.agents import create_agent
    from langchain_openai import ChatOpenAI

    LANGCHAIN_OPENAI_AVAILABLE = True
except ImportError:
    LANGCHAIN_OPENAI_AVAILABLE = False
    create_agent = None


class CustomProvider(LangChainProvider):
    """Custom provider for any OpenAI-compatible API endpoint."""

    @classmethod
    def get_provider_name(cls) -> str:
        return "custom"

    def _create_agent(self, llm, mcp_registry, system_instruction):
        """Create a LangChain agent using the create_agent pattern."""
        if not create_agent or not mcp_registry:
            return None

        tools = mcp_registry.create_langchain_tools()

        if not tools:
            printer.warning("Custom: No tools available for agent creation")
            return None

        try:
            agent = create_agent(
                model=llm,
                tools=tools,
                system_prompt=system_instruction or "You are a helpful AI assistant with access to tools.",
            )
            return agent
        except Exception as e:
            printer.error(f"Custom: Failed to create agent: {e}")
            return None

    def __init__(
        self,
        model_name: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        mcp_registry: Optional["MCPServerRegistry"] = None,
        system_instruction: str | None = None,
        tool_callback=None,
        api_base: str | None = None,
        api_key: str | None = None,
        **kwargs,
    ):
        if not LANGCHAIN_OPENAI_AVAILABLE:
            raise ImportError("LangChain OpenAI not installed. Run: pip install langchain-openai")

        # Accept api_base/api_key from kwargs or fall back to env vars
        self.api_base = api_base or os.getenv("KNIK_CUSTOM_API_BASE")
        if not self.api_base:
            raise RuntimeError(
                "No API base URL found. Set KNIK_CUSTOM_API_BASE environment variable "
                "or pass api_base when creating the provider."
            )

        # API key is optional -- default to "not-needed" for local servers (e.g. Ollama)
        self.api_key = api_key or os.getenv("KNIK_CUSTOM_API_KEY") or "not-needed"

        # Resolve model: explicit arg > kwargs > KNIK_AI_MODEL env > fallback
        self.model_name = model_name or kwargs.get("model") or os.getenv("KNIK_AI_MODEL", "gpt-3.5-turbo")
        self.temperature = temperature
        self.max_tokens = max_tokens

        if "model" in kwargs and not model_name:
            model_name = self.model_name

        filtered_kwargs = {
            k: v
            for k, v in kwargs.items()
            if k
            not in [
                "model",
                "model_name",
                "api_base",
                "api_key",
                "temperature",
                "max_tokens",
                "project_id",
                "location",
                "project",
            ]
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
            provider_name="custom",
            mcp_registry=mcp_registry,
            system_instruction=system_instruction,
            tool_callback=tool_callback,
            model=self.model_name,
        )

    def get_models(self) -> list[dict[str, Any]]:
        """Query custom OpenAI-compatible API for available models."""
        try:
            import requests

            url = f"{self.api_base.rstrip('/')}/models"
            headers = {}
            if self.api_key and self.api_key != "not-needed":
                headers["Authorization"] = f"Bearer {self.api_key}"
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()

            models = []
            for model in response.json().get("data", []):
                model_id = model.get("id", "")
                if model_id:
                    models.append(
                        {
                            "id": model_id,
                            "name": model_id,
                            "context_window": get_context_window(model_id),
                            "provider": "custom",
                        }
                    )
            return models
        except Exception as e:
            printer.debug(f"Custom provider model discovery failed: {e}")
            return []

    def is_configured(self) -> bool:
        return self.api_base is not None and LANGCHAIN_OPENAI_AVAILABLE

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": "custom",
            "framework": "langchain-openai",
            "model": self.model_name,
            "api_base": self.api_base,
            "api_key_set": self.api_key != "not-needed",
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "supports_tools": True,
            "supports_streaming": True,
        }


ProviderRegistry.register(CustomProvider.get_provider_name(), CustomProvider)
