"""
Knik Audio Library
A modular library for text-to-speech, audio processing, and AI interactions.
4:"""

from lib.commands import CommandService

from .core import AudioConfig, Config
from .services import AIClient, MockAIClient
from .services.tts import AudioProcessor, KokoroVoiceModel, TTSAsyncProcessor, VoiceModel
from .utils import (
    BaseProcessor,
    CommandProcessor,
    ConsoleProcessor,
    LogLevel,
    Printer,
    PrinterConfig,
    create_processor,
    printer,
)


__all__ = [
    "AIClient",
    "CommandService",
    "Config",
    "AudioConfig",
    "VoiceModel",
    "KokoroVoiceModel",
    "AudioProcessor",
    "TTSAsyncProcessor",
    "MockAIClient",
    "ConsoleProcessor",
    "CommandProcessor",
    "BaseProcessor",
    "create_processor",
    "Printer",
    "PrinterConfig",
    "LogLevel",
    "printer",
]
