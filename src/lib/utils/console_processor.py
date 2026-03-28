"""
Console Processor module for handling inline text input from console.
Supports command-based text processing with custom command handlers.
"""

import sys
from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any

from .printer import printer


class BaseProcessor(ABC):
    """Abstract base for text processors."""

    @abstractmethod
    def process(self, text: str, **kwargs) -> str:
        """Process the input text and return a result."""
        pass

    @abstractmethod
    def validate(self, text: str) -> bool:
        """Validate the input text format."""
        pass

    @abstractmethod
    def get_info(self) -> dict[str, Any]:
        """Return processor metadata."""
        pass


class CommandProcessor(BaseProcessor):
    """Command-line text processor with slash-prefixed commands."""

    def __init__(self, command_prefix: str = "/", parse_args: bool = True):
        self.command_prefix = command_prefix
        self.parse_args = parse_args
        self._commands: dict[str, Callable] = {}

    def register_command(self, name: str, handler: Callable) -> None:
        """Register a named command handler."""
        self._commands[name] = handler

    def process(self, text: str, **kwargs) -> str:
        """Parse and execute a command string."""
        if not text.startswith(self.command_prefix):
            return f"Invalid command format. Commands must start with '{self.command_prefix}'"

        command_text = text[len(self.command_prefix) :].strip()
        parts = command_text.split(maxsplit=1)

        if not parts:
            return "Empty command"

        command_name = parts[0]
        args = parts[1] if len(parts) > 1 else ""

        if command_name in self._commands:
            try:
                return self._commands[command_name](args)
            except Exception as e:
                return f"Command error: {e}"
        else:
            return f"Unknown command: {command_name}. Available: {', '.join(self._commands.keys())}"

    def validate(self, text: str) -> bool:
        """Check if text looks like a valid command."""
        return text.startswith(self.command_prefix) and len(text) > len(self.command_prefix)

    def get_info(self) -> dict[str, Any]:
        """Return processor configuration and registered commands."""
        return {
            "processor": "CommandProcessor",
            "command_prefix": self.command_prefix,
            "registered_commands": list(self._commands.keys()),
            "parse_args": self.parse_args,
        }


class ConsoleProcessor:
    """Interactive console with command routing and history."""

    def __init__(
        self, command_prefix: str = "/", parse_args: bool = True, echo_input: bool = True, auto_validate: bool = True
    ):
        self.echo_input = echo_input
        self.auto_validate = auto_validate
        self._processor = CommandProcessor(command_prefix=command_prefix, parse_args=parse_args)
        self._history: list[dict[str, str]] = []

    def read_input(self, prompt: str = "> ") -> str:
        """Read a line of input from stdin."""
        try:
            text = input(prompt)
            if self.echo_input:
                printer.info(f"[INPUT] {text}")
            return text
        except EOFError:
            return ""
        except KeyboardInterrupt:
            printer.info("\n[Interrupted]")
            sys.exit(0)

    def process_text(self, text: str, **kwargs) -> str:
        """Validate and process a text command."""
        if self.auto_validate and not self._processor.validate(text):
            return "[VALIDATION FAILED] Invalid command format"

        result = self._processor.process(text, **kwargs)

        self._history.append({"input": text, "output": result, "processor": "command"})

        return result

    def process_inline(self, text: str, **kwargs) -> str:
        """Alias for process_text."""
        return self.process_text(text, **kwargs)

    def interactive_loop(self, prompt: str = "> ", exit_commands: list[str] | None = None) -> None:
        """Run a blocking read-eval-print loop."""
        exit_commands = exit_commands or ["exit", "quit", "q"]

        printer.info(f"Starting command processor. Type '{exit_commands[0]}' to quit.")
        printer.info(f"Available commands: {', '.join(self._processor._commands.keys())}")

        while True:
            try:
                text = self.read_input(prompt)

                if text.lower().strip() in exit_commands:
                    printer.info("Exiting...")
                    break

                if not text.strip():
                    continue

                result = self.process_text(text)
                printer.success(f"[OUTPUT] {result}")

            except Exception as e:
                printer.error(f"[ERROR] {e}")

    def get_history(self) -> list[dict[str, str]]:
        """Return a copy of the command history."""
        return self._history.copy()

    def clear_history(self) -> None:
        """Clear the command history."""
        self._history.clear()

    def get_processor(self) -> CommandProcessor:
        """Return the underlying CommandProcessor."""
        return self._processor

    def register_command(self, name: str, handler: Callable) -> None:
        """Register a command with the underlying processor."""
        self._processor.register_command(name, handler)

    def get_info(self) -> dict[str, Any]:
        """Return combined info from the processor and console state."""
        info = self._processor.get_info()
        info.update(
            {"echo_input": self.echo_input, "auto_validate": self.auto_validate, "history_size": len(self._history)}
        )
        return info


class MockConsoleProcessor(ConsoleProcessor):
    """Console processor that returns canned responses for testing."""

    def __init__(self, mock_responses: list[str] | None = None):
        super().__init__(command_prefix="/")
        self.mock_responses = mock_responses or ["Mock response"]
        self._response_index = 0

    def process_inline(self, text: str, **kwargs) -> str:
        """Return the next mock response."""
        response = self.mock_responses[self._response_index % len(self.mock_responses)]
        self._response_index += 1
        return f"[MOCK] Input: '{text}' -> Output: '{response}'"


def create_processor(command_prefix: str = "/", **kwargs) -> ConsoleProcessor:
    return ConsoleProcessor(command_prefix=command_prefix, **kwargs)
