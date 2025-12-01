from typing import List, Dict, Any
from lib.services.ai_client import AIClient
from .definitions import ALL_DEFINITIONS
from .implementations import ALL_IMPLEMENTATIONS


def get_all_tools() -> List[Dict[str, Any]]:
    return ALL_DEFINITIONS


def register_all_tools(ai_client: AIClient) -> int:
    count = 0
    
    for tool_def in ALL_DEFINITIONS:
        tool_name = tool_def["name"]
        implementation = ALL_IMPLEMENTATIONS.get(tool_name)
        
        if implementation:
            ai_client.register_tool(tool_def, implementation)
            count += 1
    
    return count


def get_tool_info() -> Dict[str, Any]:
    tools = get_all_tools()
    return {
        'total_tools': len(tools),
        'tool_names': [tool['name'] for tool in tools],
        'tools': tools
    }
