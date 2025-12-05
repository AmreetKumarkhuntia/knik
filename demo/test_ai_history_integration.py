#!/usr/bin/env python3
"""
Test conversation history with actual AI client to verify it's working.
This simulates the GUI/Console behavior.
"""

import sys
from pathlib import Path


# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from apps.console.history import ConversationHistory
from imports import AIClient
from lib.mcp import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry


def test_ai_with_history():
    """Test AI client with conversation history."""
    print("\n" + "=" * 70)
    print("Testing AI Client with Conversation History")
    print("=" * 70 + "\n")

    # Initialize
    tools_registered = register_all_tools(MCPServerRegistry)
    print(f"✓ Registered {tools_registered} MCP tools\n")

    ai_client = AIClient(
        provider="vertex",  # Will fallback to mock if not configured
        mcp_registry=MCPServerRegistry,
        system_instruction="You are a helpful AI assistant with memory.",
    )

    provider_info = ai_client.get_info()
    print(f"✓ Using provider: {provider_info.get('provider', 'unknown')}")
    print(f"✓ Provider name: {ai_client.provider_name}\n")

    history = ConversationHistory(max_size=50)

    # First interaction
    print("-" * 70)
    print("INTERACTION 1: Initial conversation")
    print("-" * 70)
    user_input_1 = "Hi"
    print(f"User: {user_input_1}")

    response_1 = ai_client.chat_with_agent(prompt=user_input_1, use_tools=False, max_tokens=100, temperature=0.7)
    print(f"AI: {response_1}\n")

    # Add to history
    history.add_entry(user_input_1, response_1)
    print(f"✓ Added to history. Total entries: {len(history.entries)}\n")

    # Second interaction
    print("-" * 70)
    print("INTERACTION 2: With tool use")
    print("-" * 70)
    user_input_2 = "Can you get me kubernetes clusters"
    print(f"User: {user_input_2}")

    history_messages_2 = history.get_messages(last_n=5)
    print(f"✓ Retrieved {len(history_messages_2)} history messages")

    response_2 = ai_client.chat_with_agent(
        prompt=user_input_2, use_tools=True, history=history_messages_2, max_tokens=200, temperature=0.7
    )
    print(f"AI: {response_2}\n")

    # Add to history
    history.add_entry(user_input_2, response_2)
    print(f"✓ Added to history. Total entries: {len(history.entries)}\n")

    # Third interaction - TEST MEMORY
    print("-" * 70)
    print("INTERACTION 3: Testing memory recall")
    print("-" * 70)
    user_input_3 = "What we have discussed before?"
    print(f"User: {user_input_3}")

    history_messages_3 = history.get_messages(last_n=5)
    print(f"✓ Retrieved {len(history_messages_3)} history messages")
    print("\nHistory being sent:")
    for i, msg in enumerate(history_messages_3):
        msg_type = msg.type if hasattr(msg, "type") else "unknown"
        content_preview = msg.content[:60] + "..." if len(msg.content) > 60 else msg.content
        print(f"  [{i}] {msg_type}: {content_preview}")
    print()

    response_3 = ai_client.chat_with_agent(
        prompt=user_input_3, use_tools=False, history=history_messages_3, max_tokens=200, temperature=0.7
    )
    print(f"AI: {response_3}\n")

    # Check if AI remembers
    print("-" * 70)
    print("ANALYSIS")
    print("-" * 70)

    if (
        "kubernetes" in response_3.lower()
        or "cluster" in response_3.lower()
        or "greeted" in response_3.lower()
        or "hi" in response_3.lower()
    ):
        print("✅ SUCCESS: AI appears to have referenced previous conversation!")
    elif "memory" in response_3.lower() or "independent" in response_3.lower():
        print("❌ FAILURE: AI claims no memory despite history being sent")
        print("   This suggests the provider isn't using the history parameter correctly")
    else:
        print("⚠️  UNCLEAR: Response doesn't clearly indicate memory or lack thereof")

    print("\n" + "=" * 70)
    print("Test Complete")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    try:
        test_ai_with_history()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
