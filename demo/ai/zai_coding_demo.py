"""
Z.AI Coding Plan Demo
Example of using Z.AI Coding Plan with LangChain integration.

The Coding Plan uses a different endpoint optimized for coding agents:
  Base URL: https://open.bigmodel.cn/api/coding/paas/v4

Setup:
1. Subscribe to GLM Coding Plan at: https://bigmodel.cn
2. Install dependencies: pip install langchain-openai
3. Set environment variable: export ZAI_CODING_API_KEY=your-api-key
   (or export ZAI_API_KEY=your-api-key — the provider falls back to it)
4. Run: python demo/ai/zai_coding_demo.py

Documentation: https://docs.bigmodel.cn/cn/coding-plan/overview
"""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import AIClient, printer


def main():
    """Demonstrate Z.AI Coding Plan integration."""

    printer.header("Z.AI Coding Plan Demo", width=70)

    # Step 1: Initialize Z.AI Coding Client
    printer.blank()
    printer.info("1. Initializing Z.AI Coding client...")
    printer.info("   Provider: zai_coding")
    printer.info("   Model: glm-4.7")

    try:
        ai_client = AIClient(provider="zai_coding", auto_fallback_to_mock=False)

        if not ai_client.is_configured():
            printer.error("Z.AI Coding not configured!")
            printer.blank()
            printer.info("Setup required:")
            printer.info("1. Subscribe to GLM Coding Plan at: https://bigmodel.cn")
            printer.info("2. Get API key from: https://bigmodel.cn/usercenter/proj-mgmt/apikeys")
            printer.info("3. Set environment variable: export ZAI_CODING_API_KEY=your-key")
            printer.info("   (or export ZAI_API_KEY=your-key)")
            printer.info("4. Install dependency: pip install langchain-openai")
            return

        info = ai_client.get_info()
        printer.success(f"Connected: {info['model']}")
        printer.info(f"   API Base: {info['api_base']}")
        printer.info(f"   Supports Tools: {info['supports_tools']}")
        printer.info(f"   Supports Streaming: {info['supports_streaming']}")

    except Exception as e:
        printer.error(f"Error initializing Z.AI Coding: {e}")
        return

    # Step 2: Code Generation
    printer.blank()
    printer.separator(width=70)
    printer.info("2. Code Generation Example")
    printer.separator(width=70)

    question = "Write a Python function that implements binary search on a sorted list."
    printer.info(f"Question: {question}")

    response = ai_client.chat(question, max_tokens=512, temperature=0.7)

    printer.blank()
    printer.success("Response:")
    print(f"   {response}")

    # Step 3: Streaming Code Explanation
    printer.blank()
    printer.separator(width=70)
    printer.info("3. Streaming Code Explanation")
    printer.separator(width=70)

    question2 = "Explain how Python's asyncio event loop works, with a short code example."
    printer.info(f"Question: {question2}")
    printer.blank()
    printer.info("Streaming response:")

    print("   ", end="", flush=True)
    for chunk in ai_client.chat_stream(question2, max_tokens=512, temperature=0.7):
        print(chunk, end="", flush=True)
    print()

    # Step 4: Code Debugging with History
    printer.blank()
    printer.separator(width=70)
    printer.info("4. Code Debugging with Conversation History")
    printer.separator(width=70)

    from langchain_core.messages import AIMessage, HumanMessage

    history = [
        HumanMessage(content="I have a function that sorts a list but it's running slowly on large inputs."),
        AIMessage(
            content="That could be due to using a less efficient sorting algorithm. What algorithm are you using?"
        ),
    ]

    question3 = "I'm using bubble sort. Can you help me improve it?"
    printer.info(f"Conversation history: {len(history)} messages")
    printer.info(f"Question: {question3}")

    response3 = ai_client.chat(question3, max_tokens=512, temperature=0.7, history=history)

    printer.blank()
    printer.success("Response:")
    print(f"   {response3}")

    # Summary
    printer.blank()
    printer.separator(width=70)
    printer.success("Demo Complete!")
    printer.separator(width=70)
    printer.blank()

    printer.info("Features demonstrated:")
    printer.info("  - Code generation via Z.AI Coding Plan")
    printer.info("  - Streaming code explanations")
    printer.info("  - Code debugging with conversation history")

    printer.blank()
    printer.info("Usage in your code:")
    print("""
from src.lib import AIClient

# Initialize with Coding Plan
client = AIClient(provider="zai_coding")

# Generate code
response = client.chat("Write a function that...")

# Stream response
for chunk in client.chat_stream("Explain this code..."):
    print(chunk, end="", flush=True)

# Available models: glm-5, glm-5-turbo, glm-4.7, glm-4.6, glm-4.5
client = AIClient(provider="zai_coding", model="glm-5")
    """)


if __name__ == "__main__":
    main()
