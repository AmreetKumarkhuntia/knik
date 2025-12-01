from typing import List, Dict, Any, Optional
from .definitions import ALL_DEFINITIONS
from .implementations import ALL_IMPLEMENTATIONS


def get_all_tools() -> List[Dict[str, Any]]:
    return ALL_DEFINITIONS


def register_all_tools(registry = None) -> int:
    """
    Register all MCP tools to the registry.
    
    Args:
        registry: MCPServerRegistry class (not instance). If None, imports and uses MCPServerRegistry.
    
    Returns:
        Number of tools registered
    """
    if registry is None:
        from lib.services.ai_client.registry import MCPServerRegistry
        registry = MCPServerRegistry
    
    count = 0
    for tool_def in ALL_DEFINITIONS:
        tool_name = tool_def["name"]
        implementation = ALL_IMPLEMENTATIONS.get(tool_name)
        
        if implementation:
            registry.register_tool(tool_def, implementation)
            count += 1
    
    return count


def get_tool_info() -> Dict[str, Any]:
    tools = get_all_tools()
    return {
        'total_tools': len(tools),
        'tool_names': [tool['name'] for tool in tools],
        'tools': tools
    }
