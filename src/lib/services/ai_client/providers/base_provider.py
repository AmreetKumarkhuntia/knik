from abc import ABC, abstractmethod
from typing import Any, Dict, Generator, Optional, TYPE_CHECKING

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import StructuredTool
from pydantic import Field, create_model

from ....utils import printer

if TYPE_CHECKING:
    from ..registry import MCPServerRegistry


class BaseAIProvider(ABC):
    
    @classmethod
    def get_provider_name(cls) -> str:
        raise NotImplementedError("Subclasses must implement get_provider_name()")
    
    @abstractmethod
    def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
        pass
    
    @abstractmethod
    def query_stream(self, prompt: str, use_tools: bool = False, **kwargs) -> Generator[str, None, None]:
        pass
    
    @abstractmethod
    def is_configured(self) -> bool:
        pass
    
    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        pass


class LangChainProvider(BaseAIProvider):

    def __init__(self, llm, agent, provider_name: str, mcp_registry: Optional['MCPServerRegistry'] = None, 
                 system_instruction: Optional[str] = None, **config):
        self._llm_raw = llm
        self._provider_name = provider_name
        self.config = config
        self.agent = agent
        self.mcp_registry = mcp_registry
        self.system_instruction = system_instruction
        
        if mcp_registry:
            tools = self._create_tool_wrappers(mcp_registry)
            self.llm = llm.bind_tools(tools) if tools else llm
            printer.success(f"Bound {len(tools)} tools to {provider_name} LLM at initialization")
        else:
            self.llm = llm

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
    
    def _create_tool_wrappers(self, mcp_registry: 'MCPServerRegistry') -> list:
        tools = []
        type_mapping = {"string": str, "integer": int, "number": float, "boolean": bool}
        
        for schema in mcp_registry.get_tools():
            func_def = schema.get("function", schema)
            tool_name = func_def.get("name")
            description = func_def.get("description", "")
            params = func_def.get("parameters", {})
            
            if not tool_name:
                continue
            
            impl = mcp_registry._implementations.get(tool_name)
            if not impl:
                continue
            
            fields = {}
            for name, prop in params.get("properties", {}).items():
                prop_type = prop.get("type", "string")
                if prop_type not in type_mapping:
                    continue
                
                py_type = type_mapping.get(prop_type, str)
                is_required = name in params.get("required", [])
                
                fields[name] = (
                    py_type if is_required else Optional[py_type],
                    Field(description=prop.get("description", ""), default=None if not is_required else ...)
                )
            
            if not fields:
                continue
            
            ArgsModel = create_model(f"{tool_name}Args", **fields)
            
            tools.append(StructuredTool(
                name=tool_name,
                description=description or f"Execute {tool_name}",
                func=impl,
                args_schema=ArgsModel
            ))
        
        return tools
    
    def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
        messages = [SystemMessage(content=self.system_instruction)] if self.system_instruction else []
        messages.append(HumanMessage(content=prompt))
        
        llm = self.llm if (use_tools and self.mcp_registry) else self._llm_raw
        response = llm.invoke(messages, **kwargs)
        
        return self._extract_text_from_content(response.content) if response.content else ""
    
    def query_stream(self, prompt: str, use_tools: bool = False, **kwargs) -> Generator[str, None, None]:
        messages = [SystemMessage(content=self.system_instruction)] if self.system_instruction else []
        messages.append(HumanMessage(content=prompt))
        
        if use_tools and self.mcp_registry:
            response = self.llm.invoke(messages, **kwargs)
            messages.append(response)
            
            if hasattr(response, 'tool_calls') and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call['name']
                    printer.info(f"🔧 {tool_name}")
                    try:
                        result = self.mcp_registry.execute_tool(tool_name, **tool_call['args'])
                        messages.append(ToolMessage(content=str(result), tool_call_id=tool_call['id']))
                    except Exception as e:
                        messages.append(ToolMessage(content=f"Error: {str(e)}", tool_call_id=tool_call['id']))
                
                for chunk in self.llm.stream(messages, **kwargs):
                    if chunk.content:
                        yield self._extract_text_from_content(chunk.content)
            elif response.content:
                yield self._extract_text_from_content(response.content)
        else:
            for chunk in self._llm_raw.stream(messages, **kwargs):
                if chunk.content:
                    yield self._extract_text_from_content(chunk.content)

    def chat_with_agent(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
        if not self.agent:
            raise ValueError("Agent is not initialized for this provider.")
        
        tools = self._create_tool_wrappers(self.mcp_registry) if self.mcp_registry else []
        response = self.agent.run(input=prompt, tools=tools, **kwargs)
        
        return self._extract_text_from_content(response) if response else ""

    def is_configured(self) -> bool:
        return self._llm_raw is not None
    
    def get_info(self) -> Dict[str, Any]:
        return {
            "provider": self._provider_name,
            "framework": "langchain",
            "model": getattr(self.llm, "model_name", "unknown"),
            "supports_tools": True,
            "supports_streaming": True,
            **self.config
        }
