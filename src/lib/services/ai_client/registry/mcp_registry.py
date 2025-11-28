"""MCP tool registry"""

from typing import Any, List, Dict, Callable, Optional


class MCPServerRegistry:
    """Registry for tool schemas and implementations"""
    
    _tools: List[Dict[str, Any]] = []
    _implementations: Dict[str, Callable] = {}
    
    @classmethod
    def register_tool(cls, tool_dict: Dict[str, Any], implementation: Optional[Callable] = None) -> None:
        cls._tools.append(tool_dict)
        if implementation:
            tool_name = tool_dict.get('name')
            if tool_name:
                cls._implementations[tool_name] = implementation
    
    @classmethod
    def get_tools(cls) -> List[Dict[str, Any]]:
        return cls._tools
    
    @classmethod
    def get_implementation(cls, tool_name: str) -> Optional[Callable]:
        return cls._implementations.get(tool_name)
    
    @classmethod
    def execute_tool(cls, tool_name: str, **kwargs) -> Any:
        impl = cls.get_implementation(tool_name)
        if impl is None:
            raise ValueError(f"No implementation found for tool: {tool_name}")
        return impl(**kwargs)
    
    @classmethod
    def clear_tools(cls) -> None:
        cls._tools = []
        cls._implementations = {}
