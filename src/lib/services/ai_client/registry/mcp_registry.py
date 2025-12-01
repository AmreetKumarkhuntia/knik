"""MCP tool registry"""

from typing import Any, List, Dict, Callable, Optional

try:
    from langchain_core.tools import StructuredTool
    from pydantic import Field, create_model
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    StructuredTool = None


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
    
    @classmethod
    def create_langchain_tools(cls) -> list:
        """
        Create LangChain StructuredTool instances from registered MCP tools.
        Returns empty list if LangChain not available.
        """
        if not LANGCHAIN_AVAILABLE:
            return []
        
        tools = []
        type_mapping = {"string": str, "integer": int, "number": float, "boolean": bool}
        
        for schema in cls._tools:
            func_def = schema.get("function", schema)
            tool_name = func_def.get("name")
            description = func_def.get("description", "")
            params = func_def.get("parameters", {})
            
            if not tool_name:
                continue
            
            impl = cls._implementations.get(tool_name)
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
