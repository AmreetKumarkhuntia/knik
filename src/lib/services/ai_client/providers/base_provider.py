"""LangChain-based AI Provider"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Generator, Optional, TYPE_CHECKING

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import StructuredTool
from pydantic import create_model

from ....utils import printer

if TYPE_CHECKING:
    from ..registry import MCPServerRegistry


class BaseAIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @classmethod
    def get_provider_name(cls) -> str:
        raise NotImplementedError("Subclasses must implement get_provider_name()")
    
    @abstractmethod
    def query(self, prompt: str, use_tools: bool = False, mcp_registry: 'MCPServerRegistry' = None, **kwargs) -> str:
        pass
    
    @abstractmethod
    def query_stream(self, prompt: str, use_tools: bool = False, mcp_registry: 'MCPServerRegistry' = None, **kwargs) -> Generator[str, None, None]:
        pass
    
    @abstractmethod
    def is_configured(self) -> bool:
        pass
    
    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        pass


class LangChainProvider(BaseAIProvider):
    """LangChain-based provider for universal LLM support"""
    
    def __init__(self, llm, provider_name: str, **config):
        self.llm = llm
        self._provider_name = provider_name
        self.config = config
        printer.info(f"Initialized LangChain provider: {provider_name}")
    
    def _extract_text_from_content(self, content) -> str:
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict):
                    text_parts.append(item.get('text', item.get('content', '')))
                elif isinstance(item, str):
                    text_parts.append(item)
            return ''.join(text_parts)
        elif isinstance(content, dict):
            return content.get('text', content.get('content', ''))
        return ''
    
    @classmethod
    def get_provider_name(cls) -> str:
        return "langchain"
    
    def query(self, prompt: str, use_tools: bool = False, mcp_registry: 'MCPServerRegistry' = None, system_instruction: Optional[str] = None, **kwargs) -> str:
        messages = []
        if system_instruction:
            messages.append(SystemMessage(content=system_instruction))
        messages.append(HumanMessage(content=prompt))
        
        if use_tools and mcp_registry:
            tools = self._convert_mcp_to_langchain_tools(mcp_registry)
            printer.info(f"Using {len(tools)} tools")
            llm_with_tools = self.llm.bind_tools(tools)
            
            response = llm_with_tools.invoke(messages, **kwargs)
            messages.append(response)
            
            if hasattr(response, 'tool_calls') and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call['name']
                    tool_args = tool_call['args']
                    
                    try:
                        printer.info(f"🔧 Calling tool: {tool_name}")
                        result = mcp_registry.execute_tool(tool_name, **tool_args)
                        messages.append(ToolMessage(
                            content=str(result),
                            tool_call_id=tool_call['id']
                        ))
                    except Exception as e:
                        printer.error(f"Tool execution error: {e}")
                        messages.append(ToolMessage(
                            content=f"Error: {str(e)}",
                            tool_call_id=tool_call['id']
                        ))
                
                response = llm_with_tools.invoke(messages, **kwargs)
        else:
            response = self.llm.invoke(messages, **kwargs)
        
        return self._extract_text_from_content(response.content) if response.content else ""
    
    def query_stream(self, prompt: str, use_tools: bool = False, mcp_registry: 'MCPServerRegistry' = None, system_instruction: Optional[str] = None, **kwargs) -> Generator[str, None, None]:
        messages = []
        if system_instruction:
            messages.append(SystemMessage(content=system_instruction))
        messages.append(HumanMessage(content=prompt))
        
        if use_tools and mcp_registry:
            tools = self._convert_mcp_to_langchain_tools(mcp_registry)
            printer.info(f"Streaming with {len(tools)} tools")
            llm_with_tools = self.llm.bind_tools(tools)
            
            response = llm_with_tools.invoke(messages, **kwargs)
            messages.append(response)
            
            if hasattr(response, 'tool_calls') and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call['name']
                    tool_args = tool_call['args']
                    
                    try:
                        printer.info(f"🔧 Calling tool: {tool_name}")
                        result = mcp_registry.execute_tool(tool_name, **tool_args)
                        messages.append(ToolMessage(
                            content=str(result),
                            tool_call_id=tool_call['id']
                        ))
                    except Exception as e:
                        printer.error(f"Tool execution error: {e}")
                        messages.append(ToolMessage(
                            content=f"Error: {str(e)}",
                            tool_call_id=tool_call['id']
                        ))
                
                for chunk in llm_with_tools.stream(messages, **kwargs):
                    if chunk.content:
                        yield self._extract_text_from_content(chunk.content)
            else:
                if response.content:
                    yield self._extract_text_from_content(response.content)
        else:
            for chunk in self.llm.stream(messages, **kwargs):
                if chunk.content:
                    yield self._extract_text_from_content(chunk.content)
    
    def is_configured(self) -> bool:
        return self.llm is not None
    
    def get_info(self) -> Dict[str, Any]:
        return {
            "provider": self._provider_name,
            "framework": "langchain",
            "model": getattr(self.llm, "model_name", "unknown"),
            "supports_tools": True,
            "supports_streaming": True,
            **self.config
        }
    
    def _convert_mcp_to_langchain_tools(self, mcp_registry: 'MCPServerRegistry') -> list:
        tools = []
        type_mapping = {"string": str, "integer": int, "number": float, "boolean": bool}
        
        for schema in mcp_registry.get_tools():
            if "function" in schema:
                func = schema.get("function", {})
                tool_name = func.get("name")
                description = func.get("description", "")
                params = func.get("parameters", {})
            else:
                tool_name = schema.get("name")
                description = schema.get("description", "")
                params = schema.get("parameters", {})
            
            if not tool_name:
                continue
            
            impl = mcp_registry._implementations.get(tool_name)
            if not impl:
                printer.warning(f"No implementation: {tool_name}")
                continue
            
            props = params.get("properties", {})
            required = params.get("required", [])
            
            fields = {}
            for name, prop in props.items():
                py_type = type_mapping.get(prop.get("type", "string"), str)
                if name not in required:
                    py_type = Optional[py_type]
                fields[name] = (py_type, ...)
            
            ArgsModel = create_model(f"{tool_name}Args", **fields)
            
            tools.append(StructuredTool(
                name=tool_name,
                description=description,
                func=impl,
                args_schema=ArgsModel
            ))
        
        return tools
