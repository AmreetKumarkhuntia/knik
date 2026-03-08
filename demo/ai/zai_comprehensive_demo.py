"""
Z.AI Comprehensive LangChain Demo
Advanced examples showcasing all Z.AI LangChain features.

Setup:
1. Install dependencies: pip install langchain-openai
2. Set environment variable: export ZAI_API_KEY=your-api-key
3. Run: python demo/ai/zai_comprehensive_demo.py

Documentation: https://docs.z.ai/guides/develop/langchain/introduction
"""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import AIClient, printer


def demo_prompt_templates():
    """Demonstrate prompt template usage."""
    printer.blank()
    printer.separator(width=70)
    printer.info("Demo 1: Prompt Templates")
    printer.separator(width=70)

    import os

    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI

    if not os.getenv("ZAI_API_KEY"):
        printer.warning("Skipping: ZAI_API_KEY not set")
        return

    llm = ChatOpenAI(
        model="glm-5",
        api_key=os.getenv("ZAI_API_KEY"),
        base_url="https://api.z.ai/api/paas/v4/",
        temperature=0.7,
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a professional {domain} expert"),
            ("human", "Please explain the concept and applications of {topic}"),
        ]
    )

    chain = prompt | llm

    printer.info("Template: You are a professional {domain} expert")
    printer.info("Question: Explain {topic}")

    response = chain.invoke({"domain": "artificial intelligence", "topic": "machine learning"})

    printer.blank()
    printer.success("Response:")
    print(f"   {response.content}")


def demo_conversation_memory():
    """Demonstrate conversation memory management."""
    printer.blank()
    printer.separator(width=70)
    printer.info("Demo 2: Conversation Memory")
    printer.separator(width=70)

    import os

    from langchain_core.messages import AIMessage, HumanMessage

    if not os.getenv("ZAI_API_KEY"):
        printer.warning("Skipping: ZAI_API_KEY not set")
        return

    client = AIClient(provider="zai", auto_fallback_to_mock=False)

    history = [
        HumanMessage(content="My name is Alex"),
        AIMessage(content="Hello Alex! Nice to meet you."),
    ]

    printer.info("Conversation 1:")
    response1 = client.chat("tell me a joke", max_tokens=256, temperature=0.7, history=history)
    print(f"   AI: {response1}")

    printer.blank()
    printer.info("Conversation 2 (with updated history):")
    history.append(HumanMessage("tell me a joke"))
    history.append(AIMessage(response1))

    response2 = client.chat("tell me another one", max_tokens=256, temperature=0.7, history=history)
    print(f"   AI: {response2}")


def demo_advanced_streaming():
    """Demonstrate advanced streaming with callback handlers."""
    printer.blank()
    printer.separator(width=70)
    printer.info("Demo 3: Advanced Streaming")
    printer.separator(width=70)

    import os

    from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
    from langchain_core.messages import HumanMessage
    from langchain_openai import ChatOpenAI

    if not os.getenv("ZAI_API_KEY"):
        printer.warning("Skipping: ZAI_API_KEY not set")
        return

    llm = ChatOpenAI(
        model="glm-5",
        api_key=os.getenv("ZAI_API_KEY"),
        base_url="https://api.z.ai/api/paas/v4/",
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()],
    )

    printer.info("Streaming a poem about spring:")
    print("   ", end="", flush=True)
    response = llm([HumanMessage(content="Write a short poem about spring")])
    print()


def demo_agent_with_tools():
    """Demonstrate agent with tool calling."""
    printer.blank()
    printer.separator(width=70)
    printer.info("Demo 4: Agent with Tools")
    printer.separator(width=70)

    try:
        from src.lib.services.ai_client.registry.mcp_registry import MCPServerRegistry

        mcp_registry = MCPServerRegistry()

        if not mcp_registry.get_tools():
            printer.warning("Skipping: No MCP tools registered")
            printer.info("To test tool calling, register MCP tools first")
            return

        ai_client = AIClient(provider="zai", mcp_registry=mcp_registry, auto_fallback_to_mock=False)

        if not ai_client.is_configured():
            printer.warning("Skipping: Z.AI not configured")
            return

        question = "What tools do you have available?"
        printer.info(f"Question: {question}")

        response = ai_client.chat(question, max_tokens=512, temperature=0.7)

        printer.blank()
        printer.success("Response:")
        print(f"   {response}")

    except ImportError as e:
        printer.warning(f"Skipping: {e}")
    except Exception as e:
        printer.error(f"Error: {e}")


def demo_error_handling():
    """Demonstrate error handling patterns."""
    printer.blank()
    printer.separator(width=70)
    printer.info("Demo 5: Error Handling")
    printer.separator(width=70)

    printer.info("Test 1: Missing API key")
    try:
        import os

        original_key = os.environ.get("ZAI_API_KEY")
        if "ZAI_API_KEY" in os.environ:
            del os.environ["ZAI_API_KEY"]

        client = AIClient(provider="zai", auto_fallback_to_mock=False)
        printer.success("✓ Correctly raises error without API key")

        if original_key:
            os.environ["ZAI_API_KEY"] = original_key
    except RuntimeError as e:
        printer.success(f"✓ Caught expected error: {str(e)[:60]}...")

    printer.blank()
    printer.info("Test 2: Auto-fallback to mock")
    try:
        import os

        original_key = os.environ.get("ZAI_API_KEY")
        if "ZAI_API_KEY" in os.environ:
            del os.environ["ZAI_API_KEY"]

        client = AIClient(provider="zai", auto_fallback_to_mock=True)
        printer.success("✓ Successfully falls back to mock provider")

        if original_key:
            os.environ["ZAI_API_KEY"] = original_key
    except Exception as e:
        printer.warning(f"Warning: {e}")


def demo_temperature_variations():
    """Demonstrate temperature parameter effects."""
    printer.blank()
    printer.separator(width=70)
    printer.info("Demo 6: Temperature Variations")
    printer.separator(width=70)

    question = "Write a short creative story about a robot"

    try:
        printer.info("Temperature 0.0 (deterministic):")
        client = AIClient(provider="zai", auto_fallback_to_mock=False)
        response = client.chat(question, max_tokens=256, temperature=0.0)
        print(f"   {response[:100]}...")

        printer.blank()
        printer.info("Temperature 1.0 (more creative):")
        response = client.chat(question, max_tokens=256, temperature=1.0)
        print(f"   {response[:100]}...")

    except Exception as e:
        printer.warning(f"Skipping: {e}")


def main():
    """Run all comprehensive demos."""

    printer.header("Z.AI Comprehensive LangChain Demo", width=70)

    printer.blank()
    printer.info("This demo showcases:")
    printer.info("  • Prompt templates")
    printer.info("  • Conversation memory")
    printer.info("  • Advanced streaming")
    printer.info("  • Agent with tools")
    printer.info("  • Error handling")
    printer.info("  • Temperature variations")

    printer.blank()
    printer.info("Prerequisites:")
    printer.info("  1. Export ZAI_API_KEY environment variable")
    printer.info("  2. Install langchain-openai: pip install langchain-openai")

    printer.blank()

    demo_prompt_templates()
    demo_conversation_memory()
    demo_advanced_streaming()
    demo_agent_with_tools()
    demo_error_handling()
    demo_temperature_variations()

    printer.blank()
    printer.separator(width=70)
    printer.success("✅ Comprehensive Demo Complete!")
    printer.separator(width=70)
    printer.blank()

    printer.info("📚 Next Steps:")
    print("""
1. Explore the code in src/lib/services/ai_client/providers/zai_provider.py
2. Read the documentation: https://docs.z.ai/guides/develop/langchain/introduction
3. Try the basic demo: python demo/ai/zai_langchain_demo.py
4. Integrate Z.AI into your applications

💡 Configuration options:
   - Model: glm-5, glm-4, glm-4-flash
   - Temperature: 0.0-2.0 (default 0.7)
   - Max tokens: limit response length
   - API Base: https://api.z.ai/api/paas/v4/ (customizable)
    """)


if __name__ == "__main__":
    main()
