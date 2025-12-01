"""Google Vertex AI Provider with LangChain"""

import os
from typing import Optional, Dict, Any, TYPE_CHECKING

from .base_provider import LangChainProvider
from ..registry import ProviderRegistry
from ....utils import printer

if TYPE_CHECKING:
    from ..registry import MCPServerRegistry

try:
    from langchain_google_vertexai import ChatVertexAI
    LANGCHAIN_VERTEX_AVAILABLE = True
except ImportError:
    LANGCHAIN_VERTEX_AVAILABLE = False

class VertexAIProvider(LangChainProvider):
    
    @classmethod
    def get_provider_name(cls) -> str:
        return "vertex"
    
    def __init__(self, project_id: Optional[str] = None, location: str = "us-central1", 
                 model_name: str = "gemini-2.5-flash", temperature: float = 0.7, 
                 max_tokens: Optional[int] = None, mcp_registry: Optional['MCPServerRegistry'] = None,
                 system_instruction: Optional[str] = None, **kwargs):
        if not LANGCHAIN_VERTEX_AVAILABLE:
            raise ImportError("LangChain Vertex AI not installed. Run: pip install langchain-google-vertexai")
        
        self.project_id = project_id or os.getenv('GOOGLE_CLOUD_PROJECT')
        if not self.project_id:
            raise RuntimeError("No project_id. Set GOOGLE_CLOUD_PROJECT env var or pass project_id parameter.")
        
        self.location = location
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        
        llm = ChatVertexAI(model_name=model_name, project=self.project_id, location=location, 
                          temperature=temperature, max_tokens=max_tokens, **kwargs)
        
        super().__init__(llm=llm, agent=None, provider_name="vertex", mcp_registry=mcp_registry,
                        system_instruction=system_instruction, project_id=self.project_id, 
                        location=location, model=model_name)
        
        printer.success(f"Vertex AI initialized: {model_name}")
    
    def is_configured(self) -> bool:
        return self.project_id is not None and LANGCHAIN_VERTEX_AVAILABLE
    
    def get_info(self) -> Dict[str, Any]:
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
