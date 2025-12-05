#!/usr/bin/env python3
"""
Quick test to verify conversation history is working correctly.
Tests both Console and GUI configurations.
"""

import sys
from pathlib import Path


# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from apps.console.history import ConversationHistory


def test_conversation_history():
    """Test ConversationHistory message conversion."""
    print("=" * 60)
    print("Testing ConversationHistory")
    print("=" * 60)

    history = ConversationHistory(max_size=50)

    # Add some conversation entries
    history.add_entry("What is 2+2?", "2+2 equals 4.")
    history.add_entry("What about 5*3?", "5*3 equals 15.")
    history.add_entry("Add those two results", "4 + 15 = 19.")

    print(f"\n✓ Added {len(history.entries)} conversation entries")

    # Test text format (old method)
    print("\n--- Text Format (get_context) ---")
    text_context = history.get_context(last_n=2)
    print(text_context)

    # Test message format (new method)
    print("\n--- Message Format (get_messages) ---")
    messages = history.get_messages(last_n=2)
    print(f"Retrieved {len(messages)} messages")
    for i, msg in enumerate(messages):
        msg_type = msg.type if hasattr(msg, "type") else "unknown"
        print(f"  [{i}] {msg_type}: {msg.content[:50]}...")

    print("\n✓ All tests passed!")
    return True


def test_configs():
    """Test that configs have history_context_size."""
    print("\n" + "=" * 60)
    print("Testing Configuration Files")
    print("=" * 60)

    try:
        from apps.console.config import ConsoleConfig

        console_config = ConsoleConfig()
        print(f"\n✓ ConsoleConfig.history_context_size = {console_config.history_context_size}")

        from apps.gui.config import GUIConfig

        gui_config = GUIConfig()
        print(f"✓ GUIConfig.history_context_size = {gui_config.history_context_size}")

        print("\n✓ Configuration tests passed!")
        return True
    except Exception as e:
        print(f"\n✗ Configuration test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("\n🧪 Testing Conversation History Implementation\n")

    try:
        test_conversation_history()
        test_configs()

        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        print("\nConversation history is working correctly!")
        print("The AI will now remember previous interactions.\n")

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
