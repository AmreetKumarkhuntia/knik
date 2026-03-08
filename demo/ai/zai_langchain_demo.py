"""
Z.AI LangChain Demo
Basic example of using Z.AI with LangChain integration.

Setup:
1. Install dependencies: pip install langchain-openai
2. Set environment variable: export ZAI_API_KEY=your-api-key
3. Run: python demo/ai/zai_langchain_demo.py

Documentation: https://docs.z.ai/guides/develop/langchain/introduction
"""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import AIClient, printer


def main():
    """Demonstrate basic Z.AI LangChain integration."""

    printer.header("Z.AI LangChain Demo", width=70)

    # Step 1: Initialize Z.AI Client
    printer.blank()
    printer.info("1. Initializing Z.AI client...")
    printer.info("   Provider: zai")
    printer.info("   Model: glm-5")

    try:
        ai_client = AIClient(provider="zai", auto_fallback_to_mock=False)

        if not ai_client.is_configured():
            printer.error("Z.AI not configured!")
            printer.blank()
            printer.info("Setup required:")
            printer.info("1. Get API key from: https://z.ai/model-api")
            printer.info("2. Set environment variable: export ZAI_API_KEY=your-key")
            printer.info("3. Install dependency: pip install langchain-openai")
            return

        info = ai_client.get_info()
        printer.success(f"✓ Z.AI connected: {info['model']}")
        printer.info(f"   API Base: {info['api_base']}")
        printer.info(f"   Supports Tools: {info['supports_tools']}")
        printer.info(f"   Supports Streaming: {info['supports_streaming']}")

    except Exception as e:
        printer.error(f"Error initializing Z.AI: {e}")
        return

    # Step 2: Basic Chat
    printer.blank()
    printer.separator(width=70)
    printer.info("2. Basic Chat Example")
    printer.separator(width=70)

    question = "What is LangChain and what are its main benefits?"
    printer.info(f"Question: {question}")

    response = ai_client.chat(question, max_tokens=512, temperature=0.7)

    printer.blank()
    printer.success("Response:")
    print(f"   {response}")

    # Step 3: Streaming Chat
    printer.blank()
    printer.separator(width=70)
    printer.info("3. Streaming Chat Example")
    printer.separator(width=70)

    question2 = "Explain the concept of machine learning in simple terms."
    printer.info(f"Question: {question2}")
    printer.blank()
    printer.info("Streaming response:")

    print("   ", end="", flush=True)
    for chunk in ai_client.chat_stream(question2, max_tokens=512, temperature=0.7):
        print(chunk, end="", flush=True)
    print()

    # Step 4: With Conversation History
    printer.blank()
    printer.separator(width=70)
    printer.info("4. Conversation with History")
    printer.separator(width=70)

    from langchain_core.messages import AIMessage, HumanMessage

    history = [
        HumanMessage(content="My name is Alex"),
        AIMessage(content="Hello Alex! Nice to meet you."),
    ]

    question3 = "What is my name?"
    printer.info(f"Conversation history: {len(history)} messages")
    printer.info(f"Question: {question3}")

    response3 = ai_client.chat(question3, max_tokens=256, temperature=0.7, history=history)

    printer.blank()
    printer.success("Response:")
    print(f"   {response3}")

    # Step 5: System Instruction
    printer.blank()
    printer.separator(width=70)
    printer.info("5. Custom System Instruction")
    printer.separator(width=70)

    system_prompt = "You are a technical writer. Explain concepts clearly and concisely."
    question4 = "What is a REST API?"

    printer.info(f"System: {system_prompt}")
    printer.info(f"Question: {question4}")

    ai_client_with_system = AIClient(provider="zai", system_instruction=system_prompt, auto_fallback_to_mock=False)

    response4 = ai_client_with_system.chat(question4, max_tokens=256, temperature=0.7)

    printer.blank()
    printer.success("Response:")
    print(f"   {response4}")

    # Summary
    printer.blank()
    printer.separator(width=70)
    printer.success("✅ Demo Complete!")
    printer.separator(width=70)
    printer.blank()

    printer.info("Features demonstrated:")
    printer.info("  • Basic chat with Z.AI")
    printer.info("  • Streaming responses")
    printer.info("  • Conversation history management")
    printer.info("  • Custom system instructions")

    printer.blank()
    printer.info("💡 Usage in your code:")
    print("""
from src.lib import AIClient

# Initialize
client = AIClient(provider="zai")

# Basic chat
response = client.chat("Your question here")

# Streaming
for chunk in client.chat_stream("Your question"):
    print(chunk, end="", flush=True)

# With history
history = [HumanMessage("previous message"), AIMessage("previous response")]
response = client.chat("new question", history=history)
    """)


if __name__ == "__main__":
    main()
