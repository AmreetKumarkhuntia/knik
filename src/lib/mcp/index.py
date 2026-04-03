"""MCP tool registration and discovery."""

from typing import Any

from lib.mcp.tools import ALL_TOOL_CLASSES


def register_all_tools(registry) -> int:
    """Register all MCP tools onto a MCPServerRegistry instance.

    Instantiates each tool class, then registers every definition +
    implementation pair onto the registry.

    Returns the number of tools registered.
    """
    if registry is None:
        raise ValueError("An MCPServerRegistry instance is required")

    count = 0
    for tool_cls in ALL_TOOL_CLASSES:
        tool = tool_cls()
        impls = tool.get_implementations()
        for tool_def in tool.get_definitions():
            tool_name = tool_def.get("name")
            impl = impls.get(tool_name)
            if impl:
                registry.register_tool(tool_def, impl)
                count += 1

    return count


def get_all_tools() -> list[dict[str, Any]]:
    """Return all MCP tool definition schemas."""
    definitions = []
    for tool_cls in ALL_TOOL_CLASSES:
        definitions.extend(tool_cls().get_definitions())
    return definitions


def get_tool_info() -> dict[str, Any]:
    """Return summary info about all registered tools."""
    tools = get_all_tools()
    return {"total_tools": len(tools), "tool_names": [t["name"] for t in tools], "tools": tools}
