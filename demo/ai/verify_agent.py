"""
Quick test to verify agent is initialized
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.lib.services.ai_client import AIClient
from src.lib.services.ai_client.registry import MCPServerRegistry
from src.lib.mcp import register_all_tools
from src.lib.utils import printer

register_all_tools(MCPServerRegistry)

client = AIClient(
    provider="vertex",
    mcp_registry=MCPServerRegistry,
    project_id=os.getenv('GOOGLE_CLOUD_PROJECT'),
    location="asia-south1",
    model_name="gemini-2.5-flash",
    temperature=0.0,
    auto_fallback_to_mock=False
)

# Check if agent exists
has_agent = client._provider.agent is not None
printer.info(f"Agent initialized: {has_agent}")
printer.info(f"Agent type: {type(client._provider.agent)}")

if has_agent:
    printer.success("✅ Agent mode is active!")
    response = client.chat_with_agent("Calculate 10 * 5", use_tools=True)
    print(f"\nAgent Response: {response}")
else:
    printer.error("❌ Agent is None - falling back to query mode")
