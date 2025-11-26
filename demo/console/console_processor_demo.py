"""
Demo script for the console_processor module.
Shows command-based text processing.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from src.lib.utils import (
    ConsoleProcessor,
    CommandProcessor,
    BaseProcessor,
    create_processor
)


def demo_basic_commands():
    """Demonstrate basic command processing."""
    print("\n" + "="*60)
    print("DEMO 1: Basic Command Processing")
    print("="*60)
    
    processor = ConsoleProcessor(command_prefix="/")
    
    # Register some commands
    processor.register_command("hello", lambda args: f"Hello, {args or 'World'}!")
    processor.register_command("upper", lambda args: args.upper())
    processor.register_command("reverse", lambda args: args[::-1])
    processor.register_command("count", lambda args: f"Character count: {len(args)}")
    
    test_commands = [
        "/hello GitHub",
        "/upper this is lowercase text",
        "/reverse stressed",
        "/count Hello World",
        "/unknown test",
    ]
    
    for command in test_commands:
        result = processor.process_inline(command)
        print(f"Command: {command}")
        print(f"Result:  {result}\n")


def demo_command_processor_direct():
    """Demonstrate direct CommandProcessor usage."""
    print("\n" + "="*60)
    print("DEMO 2: Direct CommandProcessor")
    print("="*60)
    
    cmd_processor = CommandProcessor(command_prefix="/")
    
    # Register commands
    cmd_processor.register_command("greet", lambda args: f"Greetings, {args}!")
    cmd_processor.register_command("lower", lambda args: args.lower())
    
    test_commands = [
        "/greet Alice",
        "/lower HELLO WORLD",
        "/invalid",
    ]
    
    for command in test_commands:
        if cmd_processor.validate(command):
            result = cmd_processor.process(command)
            print(f"Command: {command}")
            print(f"Result:  {result}\n")
        else:
            print(f"Invalid command: {command}\n")


def demo_factory_function():
    """Demonstrate using factory function."""
    print("\n" + "="*60)
    print("DEMO 3: Factory Function")
    print("="*60)
    
    processor = create_processor(command_prefix="/", echo_input=False)
    
    # Register commands
    processor.register_command("double", lambda args: args + " " + args)
    processor.register_command("len", lambda args: f"Length: {len(args)}")
    
    test_commands = [
        "/double hello",
        "/len this is a test",
    ]
    
    for command in test_commands:
        result = processor.process_inline(command)
        print(f"Command: {command}")
        print(f"Result:  {result}\n")


def demo_processor_info():
    """Show processor information."""
    print("\n" + "="*60)
    print("DEMO 4: Processor Information")
    print("="*60)
    
    processor = ConsoleProcessor(command_prefix="/", echo_input=True, auto_validate=True)
    processor.register_command("test", lambda args: "test")
    
    info = processor.get_info()
    print("Processor Information:")
    for key, value in info.items():
        print(f"  {key}: {value}")


def demo_history():
    """Demonstrate command history."""
    print("\n" + "="*60)
    print("DEMO 5: Command History")
    print("="*60)
    
    processor = ConsoleProcessor(command_prefix="/")
    processor.register_command("echo", lambda args: args)
    
    # Process some commands
    commands = ["/echo first", "/echo second", "/echo third"]
    for cmd in commands:
        processor.process_inline(cmd)
    
    # Show history
    history = processor.get_history()
    print(f"Processed {len(history)} commands:")
    for i, entry in enumerate(history, 1):
        print(f"  {i}. Input: '{entry['input']}' -> Output: '{entry['output']}'")
    
    # Clear history
    processor.clear_history()
    print(f"\nHistory after clearing: {len(processor.get_history())} entries")


def demo_interactive_mode():
    """Demonstrate interactive mode (commented out by default)."""
    print("\n" + "="*60)
    print("DEMO 6: Interactive Mode (Example)")
    print("="*60)
    print("To try interactive mode, uncomment the code below:")
    print("  processor = ConsoleProcessor(command_prefix='/')")
    print("  processor.register_command('hello', lambda args: f'Hello {args}!')")
    print("  processor.interactive_loop()")
    print("\nThen type commands like: /hello World")
    print("Type 'exit' or 'quit' to exit the interactive loop.")
    
    # Uncomment below to try interactive mode:
    # processor = ConsoleProcessor(command_prefix="/")
    # processor.register_command("hello", lambda args: f"Hello, {args}!")
    # processor.register_command("bye", lambda args: f"Goodbye, {args}!")
    # processor.interactive_loop(prompt="cmd> ")


def main():
    """Run all demos."""
    print("\n" + "#"*60)
    print("# Console Processor Module - Comprehensive Demo")
    print("#"*60)
    
    try:
        demo_basic_commands()
        demo_command_processor_direct()
        demo_factory_function()
        demo_processor_info()
        demo_history()
        demo_interactive_mode()
        
        print("\n" + "="*60)
        print("All demos completed successfully!")
        print("="*60)
        
    except Exception as e:
        print(f"\n[ERROR] Demo failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
