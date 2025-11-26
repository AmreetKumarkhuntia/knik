"""
Simple demo for the console_processor module.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from src.lib.utils import ConsoleProcessor
from src.lib import printer


def main():
    printer.header("Console Processor Demo")
    
    processor = ConsoleProcessor(command_prefix="/", echo_input=False)
    
    processor.register_command("hello", lambda args: f"Hello, {args or 'World'}!")
    processor.register_command("upper", lambda args: args.upper())
    processor.register_command("reverse", lambda args: args[::-1])
    processor.register_command("help", lambda args: "Available: hello, upper, reverse, help")
    
    test_commands = [
        "/hello GitHub Copilot",
        "/upper this is a test",
        "/reverse stressed",
        "/help",
    ]
    
    printer.blank()
    printer.info("Processing commands:")
    printer.blank()
    for command in test_commands:
        result = processor.process_inline(command)
        printer.info(f"{command} → {result}")


if __name__ == "__main__":
    main()
