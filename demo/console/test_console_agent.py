#!/usr/bin/env python3
"""
Quick test of console app with agent streaming by default
"""
import sys
import os

# Add src to path so imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")))

from apps.console.app import ConsoleApp
from apps.console.config import ConsoleConfig

# Create config with voice disabled for testing
config = ConsoleConfig()
config.enable_voice_output = False

app = ConsoleApp(config)

if not app.initialize():
    print("Failed to initialize app!")
    sys.exit(1)

print("\n" + "="*70)
print("Testing Console App with Agent Streaming (Voice Disabled)")
print("="*70 + "\n")

# Test queries
test_queries = [
    "Calculate 25 * 4",
    "Convert 'hello world' to uppercase",
    "Calculate (10 * 5) + (20 / 4) and tell me if it's greater than 50",
]

for query in test_queries:
    print(f"\n{'>'*3} {query}")
    app._handle_user_input(query)
    print()

print("\n" + "="*70)
print("Test completed!")
print("="*70)
