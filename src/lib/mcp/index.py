from typing import Any

from .definitions import ALL_DEFINITIONS
from .implementations import ALL_IMPLEMENTATIONS


def get_all_tools() -> list[dict[str, Any]]:
    return ALL_DEFINITIONS


def register_all_tools(registry) -> int:
    """
    Register all MCP tools to the registry.

    Args:
        registry: MCPServerRegistry instance to register tools on.

    Returns:
        Number of tools registered
    """
    if registry is None:
        raise ValueError("An MCPServerRegistry instance is required")

    count = 0
    for tool_def in ALL_DEFINITIONS:
        tool_name = tool_def["name"]
        implementation = ALL_IMPLEMENTATIONS.get(tool_name)

        if implementation:
            registry.register_tool(tool_def, implementation)
            count += 1

    return count


def get_tool_info() -> dict[str, Any]:
    tools = get_all_tools()
    return {"total_tools": len(tools), "tool_names": [tool["name"] for tool in tools], "tools": tools}
