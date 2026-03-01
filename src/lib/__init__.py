"""
Knik Audio Library
A modular library for text-to-speech, audio processing, and AI interactions.
"""

from .core import AudioConfig, Config
from .services import AIClient, MockAIClient
from .tts import AudioProcessor, KokoroVoiceModel, TTSAsyncProcessor, VoiceModel
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
    "Config",
    "AudioConfig",
    "VoiceModel",
    "KokoroVoiceModel",
    "AudioProcessor",
    "TTSAsyncProcessor",
    "AIClient",
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
