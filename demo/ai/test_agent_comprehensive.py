"""
Comprehensive test for agent streaming and complex tasks
Tests both AIClient.chat_with_agent_stream() and complex multi-step reasoning
"""

import os
import sys


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.lib.mcp import register_all_tools
from src.lib.services.ai_client import AIClient
from src.lib.services.ai_client.registry import MCPServerRegistry
from src.lib.utils import printer


def test_agent_streaming():
    """Test 1: Agent streaming responses"""
    print("\n" + "=" * 70)
    print("Test 1: Agent Streaming")
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

    if not client._provider.agent:
        printer.error("Agent not initialized!")
        return

    printer.success("✅ Agent initialized")

    queries = [
        "Calculate 25 * 4",
        "Convert 'hello world' to uppercase",
    ]

    for query in queries:
        print(f"\nQuery: {query}")
        print("-" * 70)
        print("Response: ", end="", flush=True)

        try:
            for chunk in client.chat_with_agent_stream(query, use_tools=True):
                print(chunk, end="", flush=True)
            print("\n")
        except Exception as e:
            printer.error(f"Error: {e}")


def test_complex_agent_tasks():
    """Test 2: Complex multi-step reasoning"""
    print("\n" + "=" * 70)
    print("Test 2: Complex Multi-Step Agent Tasks")
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

    if not client._provider.agent:
        printer.error("Agent not initialized!")
        return

    printer.success("✅ Agent initialized for complex tasks")

    complex_queries = [
        {
            "query": "Calculate (25 * 4) + (100 / 5) and tell me if the result is greater than 100",
            "expected_steps": ["calculate 25*4", "calculate 100/5", "add results", "compare to 100"],
        },
        {
            "query": "Take the text 'python programming', convert it to uppercase, then count how many characters it has",
            "expected_steps": ["convert to uppercase", "count characters"],
        },
        {
            "query": "Calculate 50 * 2, then convert that number to text and tell me how many characters are in it",
            "expected_steps": ["calculate 50*2", "convert to string", "count length"],
        },
        {"query": "Get the current time, then calculate 10 * 5", "expected_steps": ["get time", "calculate 10*5"]},
    ]

    for i, test_case in enumerate(complex_queries, 1):
        query = test_case["query"]
        expected = test_case["expected_steps"]

        print(f"\n{i}. Complex Task:")
        print(f"   Query: {query}")
        print(f"   Expected steps: {', '.join(expected)}")
        print("-" * 70)
        print("Response: ", end="", flush=True)

        try:
            # Use streaming to see the agent working
            for chunk in client.chat_with_agent_stream(query, use_tools=True):
                print(chunk, end="", flush=True)
            print("\n")
        except Exception as e:
            printer.error(f"Error: {e}")


def main():
    print("\n" + "=" * 70)
    print("AGENT CAPABILITIES TEST SUITE")
    print("Testing: 1) Agent Streaming  2) Complex Multi-Step Tasks")
    print("=" * 70)

    # Test 1: Agent Streaming
    test_agent_streaming()

    # Test 2: Complex Tasks
    test_complex_agent_tasks()

    print("\n" + "=" * 70)
    print("✅ All tests completed!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
