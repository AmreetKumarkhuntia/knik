"""Complete function calling test with Vertex AI."""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from src.lib.services.ai_client import AIClient


def print_separator(char="=", width=80):
    print(char * width)


# Tool implementations
def get_weather(location: str, unit: str = "celsius"):
    """Get weather for a location."""
    temps = {
        "mumbai": {"celsius": 28, "fahrenheit": 82},
        "tokyo": {"celsius": 15, "fahrenheit": 59},
        "san francisco": {"celsius": 18, "fahrenheit": 64},
        "new york": {"celsius": 10, "fahrenheit": 50},
        "london": {"celsius": 12, "fahrenheit": 54}
    }
    
    location_key = location.lower().replace(',', '').strip()
    for key in temps:
        if key in location_key:
            temp_data = temps[key]
            return {
                "location": location,
                "temperature": temp_data[unit],
                "unit": unit,
                "condition": "partly cloudy",
                "humidity": 65
            }
    
    return {
        "location": location,
        "temperature": 22,
        "unit": unit,
        "condition": "sunny",
        "humidity": 50
    }


def calculate(operation: str, a: float, b: float):
    """Perform mathematical calculation."""
    operations = {
        "add": a + b,
        "subtract": a - b,
        "multiply": a * b,
        "divide": a / b if b != 0 else None
    }
    result = operations.get(operation)
    return {
        "operation": operation,
        "a": a,
        "b": b,
        "result": result
    }


def search_web(query: str, num_results: int = 5):
    """Simulate web search."""
    return {
        "query": query,
        "results": [
            {
                "title": "Google Gemini 2.0 Released - Major AI Breakthrough",
                "snippet": "Google announces Gemini 2.0 with improved reasoning and multimodal capabilities",
                "url": "https://blog.google/technology/ai/google-gemini-2/"
            },
            {
                "title": "Gemini AI Now Available in 40+ Languages",
                "snippet": "Google expands Gemini AI language support globally",
                "url": "https://ai.google.dev/gemini"
            }
        ],
        "count": 2
    }


def main():
    print_separator()
    print("COMPLETE FUNCTION CALLING TEST - VERTEX AI".center(80))
    print_separator()
    print()
    
    # Initialize
    print("🚀 Initializing Vertex AI...")
    client = AIClient(
        provider="vertex",
        auto_fallback_to_mock=False,
        project_id="breeze-uat-453414",
        location="asia-south1",
        model_name="gemini-2.5-flash"
    )
    print(f"✓ Provider: {client.get_provider_name()}")
    print(f"✓ Model: {client.get_info()['model_name']}")
    print()
    
    # Register tools with implementations
    print("🛠️  Registering Tools...")
    print("-" * 80)
    
    client.register_tool({
        'name': 'get_weather',
        'description': 'Get current weather for any location',
        'parameters': {
            'type': 'object',
            'properties': {
                'location': {'type': 'string', 'description': 'City name'},
                'unit': {'type': 'string', 'enum': ['celsius', 'fahrenheit']}
            }
        },
        'required': ['location']
    }, get_weather)
    
    client.register_tool({
        'name': 'calculate',
        'description': 'Perform arithmetic operations',
        'parameters': {
            'type': 'object',
            'properties': {
                'operation': {'type': 'string', 'enum': ['add', 'subtract', 'multiply', 'divide']},
                'a': {'type': 'number'},
                'b': {'type': 'number'}
            }
        },
        'required': ['operation', 'a', 'b']
    }, calculate)
    
    client.register_tool({
        'name': 'search_web',
        'description': 'Search the internet for information',
        'parameters': {
            'type': 'object',
            'properties': {
                'query': {'type': 'string'},
                'num_results': {'type': 'integer'}
            }
        },
        'required': ['query']
    }, search_web)
    
    print("✓ Registered 3 tools with implementations")
    print()
    
    # Test queries
    tests = [
        {
            "name": "Weather Query",
            "prompt": "What's the weather like in Mumbai right now?",
            "use_tools": True
        },
        {
            "name": "Math Calculation",
            "prompt": "Calculate 156 multiplied by 47",
            "use_tools": True
        },
        {
            "name": "Web Search",
            "prompt": "Search for latest news about Google Gemini AI",
            "use_tools": True
        },
        {
            "name": "Simple Question (No Tools)",
            "prompt": "What is the capital of France?",
            "use_tools": False
        }
    ]
    
    for i, test in enumerate(tests, 1):
        print_separator("=")
        print(f"TEST {i}: {test['name']}".center(80))
        print_separator("=")
        print()
        
        print(f"🧑 USER:")
        print(f"   {test['prompt']}")
        print()
        
        print(f"🔧 Use Tools: {'✓ YES' if test['use_tools'] else '✗ NO'}")
        print()
        
        print("🤖 AI RESPONSE:")
        print("-" * 80)
        
        try:
            response = client.query(
                prompt=test['prompt'],
                use_tools=test['use_tools'],
                temperature=0.7,
                max_tokens=2048
            )
            print(response)
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print()
        print()
    
    print_separator()
    print("ALL TESTS COMPLETE".center(80))
    print_separator()


if __name__ == "__main__":
    main()
