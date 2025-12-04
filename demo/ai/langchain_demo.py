"""
LangChain Function Calling Demo
Shows how to use AIClient with LangChain tools
"""

import os
import sys
import warnings


# Suppress Google Cloud SDK warnings
warnings.filterwarnings("ignore", message=".*end user credentials.*")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.lib.services.ai_client import AIClient
from src.lib.services.ai_client.registry.mcp_registry import MCPServerRegistry


# Define tool functions
def get_weather(city: str, unit: str = "celsius") -> str:
    """Get the current weather for a city."""
    weather_data = {
        "bangalore": {"condition": "Sunny", "temp_c": 25, "temp_f": 77},
        "mumbai": {"condition": "Humid", "temp_c": 32, "temp_f": 90},
        "delhi": {"condition": "Clear", "temp_c": 20, "temp_f": 68},
    }

    city_lower = city.lower()
    if city_lower in weather_data:
        data = weather_data[city_lower]
        temp = data["temp_c"] if unit == "celsius" else data["temp_f"]
        unit_symbol = "°C" if unit == "celsius" else "°F"
        return f"{data['condition']}, {temp}{unit_symbol}"
    return f"Weather data not available for {city}"


def calculate(operation: str, a: float, b: float) -> float:
    """Perform a mathematical calculation."""
    operations = {
        "add": lambda x, y: x + y,
        "subtract": lambda x, y: x - y,
        "multiply": lambda x, y: x * y,
        "divide": lambda x, y: x / y if y != 0 else "Error: Division by zero",
    }

    if operation in operations:
        return operations[operation](a, b)
    return f"Unknown operation: {operation}"


def register_tools_in_mcp():
    """Register tools in MCP registry"""
    MCPServerRegistry.clear_tools()

    # Weather tool schema
    weather_schema = {
        "name": "get_weather",
        "description": "Get the current weather for a city",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "The name of the city"},
                "unit": {
                    "type": "string",
                    "description": "Temperature unit ('celsius' or 'fahrenheit')",
                    "enum": ["celsius", "fahrenheit"],
                },
            },
            "required": ["city"],
        },
    }

    # Calculator tool schema
    calc_schema = {
        "name": "calculate",
        "description": "Perform a mathematical calculation",
        "parameters": {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "description": "Math operation ('add', 'subtract', 'multiply', 'divide')",
                    "enum": ["add", "subtract", "multiply", "divide"],
                },
                "a": {"type": "number", "description": "First number"},
                "b": {"type": "number", "description": "Second number"},
            },
            "required": ["operation", "a", "b"],
        },
    }

    MCPServerRegistry.register_tool(weather_schema, get_weather)
    MCPServerRegistry.register_tool(calc_schema, calculate)


def main():
    print("🚀 LangChain Tool Calling Demo with AIClient\n")
    print("=" * 70)

    # Register tools in MCP registry
    register_tools_in_mcp()

    # Initialize AIClient with Vertex AI provider
    client = AIClient(
        provider="vertex",
        project_id="breeze-uat-453414",
        location="asia-south1",
        model_name="gemini-2.5-flash",
        temperature=0.0,
    )

    print(f"\n✅ Provider: {client.provider_name}")
    print(f"✅ Configured: {client.is_configured()}")
    print(f"✅ Tools registered: {len(MCPServerRegistry.get_tools())}")

    # Test queries
    test_queries = [
        "What is the weather in Bangalore?",
        "Calculate 156 multiplied by 47",
        "What's the weather in Mumbai in fahrenheit?",
        "What is 100 divided by 4?",
    ]

    print("\n\n🧪 Testing Tool Calling with Streaming\n")
    print("-" * 70)

    for i, query in enumerate(test_queries, 1):
        print(f"\n{i}. Query: {query}")
        print("-" * 70)
        print("Response: ", end="", flush=True)

        try:
            for chunk in client.query_stream(
                prompt=query, use_tools=True, system_instruction="You are a helpful assistant. Use tools when needed."
            ):
                print(chunk, end="", flush=True)
            print()
        except Exception as e:
            print(f"\n❌ Error: {e}")

    # Test streaming
    print("\n\n🌊 Testing Streaming with Tools\n")
    print("-" * 70)

    stream_query = "What's the weather in Delhi and multiply 20 by 5?"
    print(f"\nQuery: {stream_query}")
    print("-" * 70)
    print("Response: ", end="", flush=True)

    try:
        for chunk in client.query_stream(
            prompt=stream_query,
            use_tools=True,
            system_instruction="You are a helpful assistant. Use tools when needed.",
        ):
            print(chunk, end="", flush=True)
        print()
    except Exception as e:
        print(f"\n❌ Error: {e}")

    print("\n" + "=" * 70)
    print("✅ Demo completed!")


if __name__ == "__main__":
    main()
