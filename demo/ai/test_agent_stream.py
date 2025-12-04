"""
Test agent streaming capabilities
CompiledStateGraph (from create_agent) supports .stream() and .astream()
"""

import os
import sys


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.lib.mcp import register_all_tools
from src.lib.services.ai_client import AIClient
from src.lib.services.ai_client.registry import MCPServerRegistry
from src.lib.utils import printer


print("\n" + "=" * 70)
print("Testing Agent Streaming Capabilities")
print("=" * 70 + "\n")

register_all_tools(MCPServerRegistry)

client = AIClient(
    provider="vertex",
    mcp_registry=MCPServerRegistry,
    project_id=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location="asia-south1",
    model_name="gemini-2.5-flash",
    temperature=0.0,
    auto_fallback_to_mock=False,
)

agent = client._provider.agent

if not agent:
    printer.error("Agent not initialized!")
    sys.exit(1)

printer.success(f"Agent type: {type(agent)}")
printer.info(f"Agent has .stream(): {hasattr(agent, 'stream')}")
printer.info(f"Agent has .astream(): {hasattr(agent, 'astream')}")

# Test 1: Try agent.stream()
print("\n" + "-" * 70)
print("Test 1: Agent Stream with Complex Task")
print("-" * 70 + "\n")

query = "Calculate 15 * 8, then add 50 to the result, then tell me if the final number is even or odd"

try:
    print("Response: ", end="", flush=True)
    for chunk in agent.stream({"messages": [{"role": "user", "content": query}]}):
        # LangGraph streams state updates
        if "messages" in chunk:
            messages = chunk["messages"]
            if messages:
                last_msg = messages[-1]
                if hasattr(last_msg, "content"):
                    content = last_msg.content
                    if isinstance(content, str) and content.strip():
                        print(content, end="", flush=True)
        print(".", end="", flush=True)  # Progress indicator
    print("\n")
except Exception as e:
    printer.error(f"Streaming error: {e}")
    print(f"Error type: {type(e)}")
    import traceback

    traceback.print_exc()

print("\n" + "=" * 70)
print("Test completed!")
print("=" * 70)
