"""Mock AI Provider implementation for testing."""

import time
from collections.abc import Generator
from typing import TYPE_CHECKING, Any

from ....utils import printer
from ..registry import ProviderRegistry
from .base_provider import BaseAIProvider


if TYPE_CHECKING:
    from ..registry import MCPServerRegistry


class MockAIProvider(BaseAIProvider):
    @classmethod
    def get_provider_name(cls) -> str:
        return "mock"

    def __init__(self, mcp_registry: "MCPServerRegistry" = None, system_instruction: str | None = None):
        self.mcp_registry = mcp_registry
        self.system_instruction = system_instruction
        self._responses = [
            "Mock AI response. Configure Vertex AI for real responses.",
            "I'm a mock assistant. Set GOOGLE_CLOUD_PROJECT to use real AI.",
            "Mock response. Install and configure Vertex AI for actual answers.",
        ]
        self._index = 0

    def chat(self, prompt: str, history: list = None, **kwargs) -> str:
        """Mock chat response"""
        response = self._responses[self._index % len(self._responses)]
        self._index += 1
        printer.debug(f"[MOCK] Chat: {prompt[:60]}...")
        printer.debug(f"[MOCK] Response: {response}")
        return response

    def chat_stream(self, prompt: str, history: list = None, **kwargs) -> Generator[str, None, None]:
        """Mock streaming chat response"""
        response = self._responses[self._index % len(self._responses)]
        self._index += 1
        printer.debug(f"[MOCK] Streaming Chat: {prompt[:60]}...")

        words = response.split()
        for word in words:
            time.sleep(0.05)
            yield word + " "

        printer.debug("[MOCK] Streaming complete")

    def is_configured(self) -> bool:
        return True

    def get_info(self) -> dict[str, Any]:
        return {"provider": "Mock AI", "configured": True, "initialized": True, "note": "Using mock responses"}


ProviderRegistry.register(MockAIProvider.get_provider_name(), MockAIProvider)
