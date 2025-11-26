"""
Console Processor module for handling inline text input from console.
Supports command-based text processing with custom command handlers.
"""

from typing import Optional, List, Dict, Any, Callable
from abc import ABC, abstractmethod
import sys

from .printer import printer


class BaseProcessor(ABC):
    
    @abstractmethod
    def process(self, text: str, **kwargs) -> str:
        pass
    
    @abstractmethod
    def validate(self, text: str) -> bool:
        pass
    
    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        pass


class CommandProcessor(BaseProcessor):
    
    def __init__(self, command_prefix: str = "/", parse_args: bool = True):
        self.command_prefix = command_prefix
        self.parse_args = parse_args
        self._commands: Dict[str, Callable] = {}
    
    def register_command(self, name: str, handler: Callable) -> None:
        self._commands[name] = handler
    
    def process(self, text: str, **kwargs) -> str:
        if not text.startswith(self.command_prefix):
            return f"Invalid command format. Commands must start with '{self.command_prefix}'"
        
        command_text = text[len(self.command_prefix):].strip()
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
        return text.startswith(self.command_prefix) and len(text) > len(self.command_prefix)
    
    def get_info(self) -> Dict[str, Any]:
        return {
            'processor': 'CommandProcessor',
            'command_prefix': self.command_prefix,
            'registered_commands': list(self._commands.keys()),
            'parse_args': self.parse_args
        }


class ConsoleProcessor:
    
    def __init__(
        self,
        command_prefix: str = "/",
        parse_args: bool = True,
        echo_input: bool = True,
        auto_validate: bool = True
    ):
        self.echo_input = echo_input
        self.auto_validate = auto_validate
        self._processor = CommandProcessor(command_prefix=command_prefix, parse_args=parse_args)
        self._history: List[Dict[str, str]] = []
    
    def read_input(self, prompt: str = "> ") -> str:
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
        if self.auto_validate and not self._processor.validate(text):
            return f"[VALIDATION FAILED] Invalid command format"
        
        result = self._processor.process(text, **kwargs)
        
        self._history.append({
            'input': text,
            'output': result,
            'processor': 'command'
        })
        
        return result
    
    def process_inline(self, text: str, **kwargs) -> str:
        return self.process_text(text, **kwargs)
    
    def interactive_loop(
        self, 
        prompt: str = "> ",
        exit_commands: Optional[List[str]] = None
    ) -> None:
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
    
    def get_history(self) -> List[Dict[str, str]]:
        return self._history.copy()
    
    def clear_history(self) -> None:
        self._history.clear()
    
    def get_processor(self) -> CommandProcessor:
        return self._processor
    
    def register_command(self, name: str, handler: Callable) -> None:
        self._processor.register_command(name, handler)
    
    def get_info(self) -> Dict[str, Any]:
        info = self._processor.get_info()
        info.update({
            'echo_input': self.echo_input,
            'auto_validate': self.auto_validate,
            'history_size': len(self._history)
        })
        return info


class MockConsoleProcessor(ConsoleProcessor):
    
    def __init__(self, mock_responses: Optional[List[str]] = None):
        super().__init__(command_prefix="/")
        self.mock_responses = mock_responses or ["Mock response"]
        self._response_index = 0
    
    def process_inline(self, text: str, **kwargs) -> str:
        response = self.mock_responses[self._response_index % len(self.mock_responses)]
        self._response_index += 1
        return f"[MOCK] Input: '{text}' -> Output: '{response}'"


def create_processor(command_prefix: str = "/", **kwargs) -> ConsoleProcessor:
    return ConsoleProcessor(command_prefix=command_prefix, **kwargs)
