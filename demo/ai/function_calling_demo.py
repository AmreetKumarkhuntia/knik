"""Complete function calling demo - the CORRECT way!

Shows how Gemini    print_separator()
    print("CORRECT FUNCTION CALLING PATTERN".center(80))
    print_separator()nction calling actually works:
1. Register tool schemas + implementations
2. Send schemas to Gemini
3. Gemini returns function_call if needed
4. WE execute the function
5. Send result back to Gemini
6. Gemini generates final response
"""

import os
import sys


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from src.lib.services.ai_client import AIClient
from src.lib.services.ai_client.registry import MCPServerRegistry


def print_separator(char="=", width=80):
    print(char * width)


# Tool implementations
def get_weather(city: str, unit: str = "celsius"):
    """Get weather for a city."""
    temps = {
        "mumbai": {"celsius": 28, "fahrenheit": 82},
        "bangalore": {"celsius": 25, "fahrenheit": 77},
        "tokyo": {"celsius": 15, "fahrenheit": 59},
        "boston": {"celsius": 10, "fahrenheit": 50},
    }

    city_key = city.lower().strip()
    for key in temps:
        if key in city_key:
            temp_data = temps[key]
            return {"city": city, "temperature": temp_data[unit], "unit": unit, "condition": "Sunny"}

    return {"city": city, "temperature": 22, "unit": unit, "condition": "Partly cloudy"}


def calculate(operation: str, a: float, b: float):
    """Perform calculation."""
    operations = {"add": a + b, "subtract": a - b, "multiply": a * b, "divide": a / b if b != 0 else None}
    result = operations.get(operation)
    return {"operation": operation, "a": a, "b": b, "result": result}


def main():
    print_separator()
    print("CORRECT FUNCTION CALLING PATTERN".center(80))
    print_separator()
    print()

    # Initialize Vertex AI client
    client = AIClient(
        provider="vertex", project_id="breeze-uat-453414", location="asia-south1", model_name="gemini-2.5-flash"
    )

    print(f"✓ Using: {client.get_provider_name()}")
    print()

    # Clear and register tools
    MCPServerRegistry.clear_tools()

    print("📝 Registering tools...")

    # Register tool 1: Weather
    MCPServerRegistry.register_tool(
        {
            "name": "get_weather",
            "description": "Get current weather of a given city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature unit"},
                },
                "required": ["city"],
            },
        },
        get_weather,  # ← Implementation!
    )

    # Register tool 2: Calculate
    MCPServerRegistry.register_tool(
        {
            "name": "calculate",
            "description": "Perform mathematical calculations",
            "parameters": {
                "type": "object",
                "properties": {
                    "operation": {"type": "string", "enum": ["add", "subtract", "multiply", "divide"]},
                    "a": {"type": "number"},
                    "b": {"type": "number"},
                },
                "required": ["operation", "a", "b"],
            },
        },
        calculate,  # ← Implementation!
    )

    print(f"✓ Registered {len(MCPServerRegistry.get_tools())} tools")
    print()

    # Test queries
    queries = [
        "What is the weather in Bangalore in celsius?",
        "Calculate 156 multiplied by 47",
        "What's 100 divided by 4?",
    ]

    for i, query in enumerate(queries, 1):
        print_separator("-")
        print(f"TEST {i}: {query}")
        print_separator("-")
        print()

        try:
            response = client.query(query, use_tools=True, temperature=0.0)

            print("💬 Gemini Response:")
            print(f"   {response}")
            print()

        except Exception as e:
            print(f"❌ Error: {e}")
            print()

    print_separator()
    print("HOW IT WORKS")
    print_separator()
    print("""
1. We register tool SCHEMAS (for Gemini) + IMPLEMENTATIONS (Python functions)
2. Gemini receives only the schemas (FunctionDeclaration)
3. User asks: "What's the weather in Bangalore?"
4. Gemini returns: function_call("get_weather", city="Bangalore")
5. vertex_provider._check_and_execute_tool_call() extracts the function call
6. MCPServerRegistry.execute_tool() runs our Python function: get_weather(city="Bangalore")
7. Result: {"city": "Bangalore", "temperature": 25, "unit": "celsius", ...}
8. We send result back to Gemini via function_response
9. Gemini generates natural language: "The weather in Bangalore is 25°C and sunny."

✅ This is the CORRECT industry pattern!
✅ Used by OpenAI, Anthropic, Google - all work this way
✅ LLM never executes code - it only REQUESTS execution
✅ We control what gets executed (security!)
    """)
    print_separator()


if __name__ == "__main__":
    main()
