"""
Console App Demo
Demonstrates the interactive console application with AI and voice capabilities.
"""

import sys
import os

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))

from src.apps.console import ConsoleApp, ConsoleConfig


def demo_basic_console():
    """Run basic console app with default settings."""
    print("\n" + "="*60)
    print("DEMO: Basic Console App")
    print("="*60)
    print("\nThis will start an interactive console where you can:")
    print("  • Ask questions to an AI")
    print("  • Receive text responses")
    print("  • Hear voice responses (if enabled)")
    print("  • Use special commands (type /help)")
    print("\nPress Ctrl+C or type /exit to quit\n")
    
    # Create default config
    config = ConsoleConfig()
    
    # Create and run app
    app = ConsoleApp(config)
    app.run()


def demo_custom_config():
    """Run console app with custom configuration."""
    print("\n" + "="*60)
    print("DEMO: Console App with Custom Config")
    print("="*60)
    
    # Create custom config
    config = ConsoleConfig(
        ai_provider="mock",  # Use mock AI for demo
        voice_name="am_adam",  # Male voice
        enable_voice_output=True,
        show_timestamps=True,
        welcome_message="🤖 Custom Console - Ask me anything!",
        prompt_symbol="Question: ",
        assistant_symbol="Answer: "
    )
    
    print("\nCustom Configuration:")
    print(f"  AI Provider: {config.ai_provider}")
    print(f"  Voice: {config.voice_name}")
    print(f"  Voice Output: {config.enable_voice_output}")
    print(f"  Timestamps: {config.show_timestamps}")
    print("\n")
    
    # Create and run app
    app = ConsoleApp(config)
    app.run()


def demo_no_voice():
    """Run console app without voice output."""
    print("\n" + "="*60)
    print("DEMO: Console App (Text Only)")
    print("="*60)
    print("\nThis console app will run without voice output")
    print("(useful for testing or environments without audio)\n")
    
    # Create config with voice disabled
    config = ConsoleConfig(
        enable_voice_output=False,
        ai_provider="mock"
    )
    
    # Create and run app
    app = ConsoleApp(config)
    app.run()


def show_menu():
    """Show demo selection menu."""
    print("\n" + "="*60)
    print("Console App Demo Menu")
    print("="*60)
    print("\nAvailable Demos:")
    print("  1. Basic Console (default settings)")
    print("  2. Custom Config (custom voice and settings)")
    print("  3. Text Only (no voice output)")
    print("  4. Exit")
    
    choice = input("\nSelect demo (1-4): ").strip()
    return choice


def main():
    """Main demo function with menu."""
    while True:
        choice = show_menu()
        
        if choice == '1':
            demo_basic_console()
        elif choice == '2':
            demo_custom_config()
        elif choice == '3':
            demo_no_voice()
        elif choice == '4':
            print("\nExiting demo. Goodbye! 👋\n")
            break
        else:
            print("\n❌ Invalid choice. Please select 1-4.")


if __name__ == "__main__":
    # Check if a specific demo is requested
    if len(sys.argv) > 1:
        demo_type = sys.argv[1].lower()
        if demo_type == 'basic':
            demo_basic_console()
        elif demo_type == 'custom':
            demo_custom_config()
        elif demo_type == 'novoice':
            demo_no_voice()
        else:
            print(f"Unknown demo type: {demo_type}")
            print("Usage: python console_app_demo.py [basic|custom|novoice]")
    else:
        main()
