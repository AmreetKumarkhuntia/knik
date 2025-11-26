"""
AI Client module for interacting with various AI providers.
Currently supports: Vertex AI (Google Gemini), Mock AI for testing.
"""

import os
import warnings
import time
from typing import Optional, List, Dict, Any, Generator
from abc import ABC, abstractmethod
from ..utils import printer


try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False

# For now ignoring quota etc.. warnings
warnings.filterwarnings('ignore', category=UserWarning, module='vertexai')
warnings.filterwarnings('ignore', category=UserWarning, module='google.auth')

class BaseAIProvider(ABC):
    """Abstract base class for AI providers."""
    
    @abstractmethod
    def query(self, prompt: str, **kwargs) -> str:
        pass
    
    @abstractmethod
    def query_stream(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Stream response chunks as they arrive."""
        pass
    
    @abstractmethod
    def is_configured(self) -> bool:
        pass
    
    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        pass


class VertexAIProvider(BaseAIProvider):
    """Google Vertex AI / Gemini provider."""
    
    def __init__(
        self,
        project_id: Optional[str] = None,
        location: str = "us-central1",
        model_name: str = "gemini-1.5-flash"
    ):
        self.project_id = project_id or os.getenv('GOOGLE_CLOUD_PROJECT')
        self.location = location
        self.model_name = model_name
        self._model = None
        self._initialized = False
    
    def _initialize(self) -> None:
        if self._initialized:
            return
        
        if not VERTEX_AI_AVAILABLE:
            raise ImportError(
                "Vertex AI SDK not installed. Run: pip install google-cloud-aiplatform"
            )
        
        if not self.project_id:
            raise RuntimeError(
                "No project_id. Set GOOGLE_CLOUD_PROJECT env var or pass project_id parameter."
            )
        
        try:
            vertexai.init(project=self.project_id, location=self.location)
            self._model = GenerativeModel(self.model_name)
            self._initialized = True
            printer.success(f"Vertex AI initialized: {self.model_name}")
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Vertex AI: {e}") from e
    
    def query(
        self, 
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None,
        context: Optional[List[Dict[str, str]]] = None
    ) -> str:
        self._initialize()
        
        try:
            config = GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            )
            
            model = self._model

            if system_instruction:
                model = GenerativeModel(
                    self.model_name,
                    system_instruction=system_instruction
                )

            if model is None:
                raise RuntimeError(f"Model is not present for querying")

            if context:
                chat = model.start_chat()
                for msg in context:
                    if msg.get("role") == "user":
                        chat.send_message(msg.get("text", ""))
                response = chat.send_message(prompt, generation_config=config)
                return response.text
            
            response = model.generate_content(prompt, generation_config=config)
            return response.text
            
        except Exception as e:
            raise RuntimeError(f"Vertex AI query failed: {e}") from e
    
    def query_stream(
        self, 
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None,
        context: Optional[List[Dict[str, str]]] = None
    ) -> Generator[str, None, None]:
        self._initialize()
        
        try:
            config = GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            )
            
            model = self._model

            if system_instruction:
                model = GenerativeModel(
                    self.model_name,
                    system_instruction=system_instruction
                )

            if model is None:
                raise RuntimeError(f"Model is not present for querying")

            if context:
                chat = model.start_chat()
                for msg in context:
                    if msg.get("role") == "user":
                        chat.send_message(msg.get("text", ""))
                response_stream = chat.send_message(
                    prompt, 
                    generation_config=config,
                    stream=True
                )
            else:
                response_stream = model.generate_content(
                    prompt, 
                    generation_config=config,
                    stream=True
                )
            
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
            
        except Exception as e:
            raise RuntimeError(f"Vertex AI streaming query failed: {e}") from e
    
    def is_configured(self) -> bool:
        return self.project_id is not None
    
    def get_info(self) -> Dict[str, Any]:
        return {
            'provider': 'Vertex AI',
            'project_id': self.project_id or 'Not configured',
            'location': self.location,
            'model_name': self.model_name,
            'configured': self.is_configured(),
            'initialized': self._initialized
        }


class MockAIProvider(BaseAIProvider):
    """Mock AI provider for testing."""
    
    def __init__(self):
        self._responses = [
            "Mock AI response. Configure Vertex AI for real responses.",
            "I'm a mock assistant. Set GOOGLE_CLOUD_PROJECT to use real AI.",
            "Mock response. Install and configure Vertex AI for actual answers.",
        ]
        self._index = 0
    
    def query(self, prompt: str, **kwargs) -> str:
        response = self._responses[self._index % len(self._responses)]
        self._index += 1
        printer.debug(f"[MOCK] Query: {prompt[:60]}...")
        printer.debug(f"[MOCK] Response: {response}")
        return response
    
    def query_stream(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """Stream mock response word by word to simulate streaming."""
        response = self._responses[self._index % len(self._responses)]
        self._index += 1
        printer.debug(f"[MOCK] Streaming Query: {prompt[:60]}...")
        
        # Split by words and yield them to simulate streaming
        words = response.split()
        for word in words:
            time.sleep(0.05)  # Simulate network delay
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


class AIClient:
    """
    Unified AI client supporting multiple providers.
    Currently: Vertex AI (Gemini), Mock AI for testing.
    """
    
    def __init__(
        self,
        provider: str = "vertex",
        project_id: Optional[str] = None,
        location: str = "us-central1",
        model_name: str = "gemini-1.5-flash",
        auto_fallback_to_mock: bool = True
    ):
        self.provider_name = provider.lower()
        self.auto_fallback_to_mock = auto_fallback_to_mock
        self._provider: Optional[BaseAIProvider] = None
        
        try:
            if self.provider_name == "vertex":
                self._provider = VertexAIProvider(
                    project_id=project_id,
                    location=location,
                    model_name=model_name
                )
                if not self._provider.is_configured() and auto_fallback_to_mock:
                    printer.warning("Vertex AI not configured. Using mock provider.")
                    self._provider = MockAIProvider()
                    self.provider_name = "mock"
                    
            elif self.provider_name == "mock":
                self._provider = MockAIProvider()
            else:
                raise ValueError(f"Unknown provider: {provider}. Supported: 'vertex', 'mock'")
                
        except Exception as e:
            if auto_fallback_to_mock:
                printer.warning(f"Error initializing {provider}: {e}")
                printer.info("Using mock provider.")
                self._provider = MockAIProvider()
                self.provider_name = "mock"
            else:
                raise
    
    def query(
        self, 
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None,
        context: Optional[List[Dict[str, str]]] = None
    ) -> str:
        try:
            return self._provider.query(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                system_instruction=system_instruction,
                context=context
            )
        except Exception as e:
            error_msg = f"AI query error: {e}"
            printer.error(error_msg)
            return error_msg
    
    def query_stream(
        self, 
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        system_instruction: Optional[str] = None,
        context: Optional[List[Dict[str, str]]] = None
    ) -> Generator[str, None, None]:
        try:
            yield from self._provider.query_stream(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                system_instruction=system_instruction,
                context=context
            )
        except Exception as e:
            error_msg = f"AI streaming query error: {e}"
            printer.error(error_msg)
            yield error_msg
    
    def is_configured(self) -> bool:
        return self._provider.is_configured()
    
    def get_info(self) -> Dict[str, Any]:
        info = self._provider.get_info()
        info['client_provider'] = self.provider_name
        info['auto_fallback'] = self.auto_fallback_to_mock
        return info
    
    def get_provider_name(self) -> str:
        return self.provider_name


class MockAIClient(AIClient):
    """Mock AI client for testing."""
    
    def __init__(self):
        super().__init__(provider="mock", auto_fallback_to_mock=False)
