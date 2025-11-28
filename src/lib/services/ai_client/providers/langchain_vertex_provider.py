"""LangChain Vertex AI Provider"""

import warnings

from typing import Optional, Dict, Any
from langchain_google_vertexai import ChatVertexAI

from .base_provider import LangChainProvider
from ....utils import printer
from ..registry.provider_registry import ProviderRegistry

warnings.filterwarnings('ignore', message='.*end user credentials.*')

class LangChainVertexProvider(LangChainProvider):
    
    @classmethod
    def get_provider_name(cls) -> str:
        return "langchain_vertex"
    
    def __init__(self, model_name: str = "gemini-2.5-flash", project_id: Optional[str] = None, 
                 location: Optional[str] = "us-central1", temperature: float = 0.7, 
                 max_tokens: Optional[int] = None, **kwargs):
        self.project_id = project_id
        self.location = location
        self.model_name = model_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        
        llm = ChatVertexAI(model_name=model_name, project=project_id, location=location, 
                          temperature=temperature, max_tokens=max_tokens, **kwargs)
        
        super().__init__(llm=llm, provider_name="langchain_vertex", project_id=project_id, 
                        location=location, model=model_name)
        
        printer.success(f"LangChain Vertex initialized: {model_name}")
    
    def is_configured(self) -> bool:
        return self.project_id is not None
    
    def get_info(self) -> Dict[str, Any]:
        return {
            "provider": "langchain_vertex",
            "framework": "langchain",
            "model": self.model_name,
            "project_id": self.project_id,
            "location": self.location,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "supports_tools": True,
            "supports_streaming": True,
        }


ProviderRegistry.register(LangChainVertexProvider.get_provider_name(), LangChainVertexProvider)
