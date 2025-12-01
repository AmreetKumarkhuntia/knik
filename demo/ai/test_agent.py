"""
Test script for chat_with_agent functionality
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.lib.services.ai_client import AIClient
from src.lib.services.ai_client.registry import MCPServerRegistry
from src.lib.mcp import register_all_tools
from src.lib.utils import printer


def test_agent_method():
    """Test the chat_with_agent method"""
    print("\n" + "="*70)
    print("Testing chat_with_agent Method")
    print("="*70 + "\n")
    
    # Register MCP tools
    tools_count = register_all_tools(MCPServerRegistry)
    printer.success(f"Registered {tools_count} MCP tools")
    
    # Initialize AIClient with Vertex AI
    client = AIClient(
        provider="vertex",
        mcp_registry=MCPServerRegistry,
        project_id=os.getenv('GOOGLE_CLOUD_PROJECT'),
        location="asia-south1",
        model_name="gemini-2.5-flash",
        temperature=0.0,
        auto_fallback_to_mock=False  # Force use of Vertex AI
    )
    
    printer.success(f"Initialized AIClient with provider: {client.provider_name}")
    printer.info(f"Configured: {client.is_configured()}")
    
    # Test queries
    test_queries = [
        "Calculate 25 * 4",
        "What's the current date?",
        "Convert 'hello world' to uppercase",
    ]
    
    print("\n" + "-"*70)
    print("Testing chat_with_agent method")
    print("-"*70 + "\n")
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. Query: {query}")
        print("-"*70)
        
        try:
            # This will fall back to query() since agent is None
            response = client.chat_with_agent(
                prompt=query,
                use_tools=True
            )
            print(f"Response: {response}\n")
        except Exception as e:
            printer.error(f"Error: {e}\n")
    
    print("\n" + "="*70)
    print("Test completed!")
    print("="*70 + "\n")
    
    print("\nNote: Since agent is not initialized (set to None in VertexAIProvider),")
    print("the chat_with_agent method falls back to the standard query() method.")
    print("This demonstrates the graceful fallback mechanism.")


if __name__ == "__main__":
    test_agent_method()
