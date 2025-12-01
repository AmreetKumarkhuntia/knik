from lib.mcp import get_tool_info


def tools_command(app, args: str) -> str:
    tool_info = get_tool_info()
    
    tools_text = [f"\n🛠️  Available MCP Tools ({tool_info['total_tools']} tools):\n"]
    
    for tool in tool_info['tools']:
        tools_text.append(f"  • {tool['name']}")
        tools_text.append(f"    {tool['description']}")
        tools_text.append("")
    
    return "\n".join(tools_text)
