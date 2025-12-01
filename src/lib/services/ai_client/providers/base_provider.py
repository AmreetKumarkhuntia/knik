from abc import ABC, abstractmethod
from typing import Any, Dict, Generator, Optional, TYPE_CHECKING

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

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
            tools = mcp_registry.create_langchain_tools()
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
    
    def query(self, prompt: str, use_tools: bool = False, **kwargs) -> str:
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
                
                final_response = self.llm.invoke(messages, **kwargs)
                return self._extract_text_from_content(final_response.content) if final_response.content else ""
            
            return self._extract_text_from_content(response.content) if response.content else ""
        else:
            response = self._llm_raw.invoke(messages, **kwargs)
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
        """Execute prompt using LangChain agent. Falls back to query if no agent."""
        if not self.agent:
            return self.query(prompt=prompt, use_tools=use_tools, **kwargs)
        
        result = self.agent.invoke({"messages": [{"role": "user", "content": prompt}]}, **kwargs)
        
        if isinstance(result, dict):
            messages = result.get("messages", [])
            if messages:
                last_message = messages[-1]
                if hasattr(last_message, 'content'):
                    output = last_message.content
                elif isinstance(last_message, dict):
                    output = last_message.get('content', '')
                else:
                    output = str(last_message)
            else:
                output = result.get("output", result.get("result", ""))
        else:
            output = str(result)
        
        return self._extract_text_from_content(output) if output else ""
    
    def chat_with_agent_stream(self, prompt: str, use_tools: bool = False, **kwargs) -> Generator[str, None, None]:
        """Stream agent responses. Falls back to query_stream if no agent."""
        if not self.agent:
            yield from self.query_stream(prompt=prompt, use_tools=use_tools, **kwargs)
            return
        
        previous_content = None
        for chunk in self.agent.stream(
            {"messages": [{"role": "user", "content": prompt}]},
            stream_mode="values",
            **kwargs
        ):
            if isinstance(chunk, dict):
                messages = chunk.get("messages", [])
                if messages:
                    last_message = messages[-1]
                    message_type = getattr(last_message, 'type', None) or getattr(last_message, '__class__.__name__', None)
                    
                    if message_type == 'ai' or (hasattr(last_message, 'content') and message_type not in ['human', 'tool']):
                        if hasattr(last_message, 'content'):
                            content = self._extract_text_from_content(last_message.content)
                            if content and content != previous_content:
                                yield content
                                previous_content = content
                        elif isinstance(last_message, dict):
                            content = last_message.get('content', '')
                            if content and content != previous_content:
                                yield self._extract_text_from_content(content)
                                previous_content = content

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
