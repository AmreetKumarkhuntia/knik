"""Mock AI Provider implementation for testing."""

import time
from typing import Dict, Any, Generator, Optional, TYPE_CHECKING

from .base_provider import BaseAIProvider
from ..registry import ProviderRegistry
from ....utils import printer

if TYPE_CHECKING:
    from ..registry import MCPServerRegistry


class MockAIProvider(BaseAIProvider):
    
    @classmethod
    def get_provider_name(cls) -> str:
        return "mock"
    
    def __init__(self, mcp_registry: 'MCPServerRegistry' = None, system_instruction: Optional[str] = None):
        self.mcp_registry = mcp_registry
        self.system_instruction = system_instruction
        self._responses = [
            "Mock AI response. Configure Vertex AI for real responses.",
            "I'm a mock assistant. Set GOOGLE_CLOUD_PROJECT to use real AI.",
            "Mock response. Install and configure Vertex AI for actual answers.",
        ]
        self._index = 0
    
    def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
        response = self._responses[self._index % len(self._responses)]
        self._index += 1
        printer.debug(f"[MOCK] Query: {prompt[:60]}...")
        printer.debug(f"[MOCK] Response: {response}")
        return response
    
    def query_stream(self, prompt: str, use_tools: bool = False, **kwargs) -> Generator[str, None, None]:
        response = self._responses[self._index % len(self._responses)]
        self._index += 1
        printer.debug(f"[MOCK] Streaming Query: {prompt[:60]}...")
        
        words = response.split()
        for word in words:
            time.sleep(0.05)
            yield word + " "
        
        printer.debug(f"[MOCK] Streaming complete")
    
    def is_configured(self) -> bool:
        return True
    
    def get_info(self) -> Dict[str, Any]:
        return {
            'provider': 'Mock AI',
            'configured': True,
            'initialized': True,
            'note': 'Using mock responses'
        }


ProviderRegistry.register(MockAIProvider.get_provider_name(), MockAIProvider)
