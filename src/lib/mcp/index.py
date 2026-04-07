"""MCP tool registration and discovery."""

from typing import Any

from lib.mcp.tools import ALL_TOOL_CLASSES


def register_all_tools(registry) -> int:
    """Returns the number of tools registered."""
    if registry is None:
        raise ValueError("An MCPServerRegistry instance is required")

    count = 0
    for tool_cls in ALL_TOOL_CLASSES:
        tool = tool_cls()
        registry.add_tool_instance(tool)
        impls = tool.get_implementations()
        for tool_def in tool.get_definitions():
            tool_name = tool_def.get("name")
            impl = impls.get(tool_name)
            if impl:
                registry.register_tool(tool_def, impl)
                count += 1

    return count


def get_all_tools() -> list[dict[str, Any]]:
    definitions = []
    for tool_cls in ALL_TOOL_CLASSES:
        definitions.extend(tool_cls().get_definitions())
    return definitions


def get_tool_info() -> dict[str, Any]:
    tools = get_all_tools()
    return {"total_tools": len(tools), "tool_names": [t["name"] for t in tools], "tools": tools}
