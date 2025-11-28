"""
Knik Audio Library
A modular library for text-to-speech, audio processing, and AI interactions.
"""

from .core import Config, AudioConfig, TTSAsyncProcessor
from .services import VoiceModel, KokoroVoiceModel, AudioProcessor, AIClient, MockAIClient
from .utils import (
    ConsoleProcessor, 
    CommandProcessor, 
    BaseProcessor, 
    create_processor,
    Printer,
    PrinterConfig,
    LogLevel,
    printer,
)

__all__ = [
    'Config',
    'AudioConfig',
    'VoiceModel', 
    'KokoroVoiceModel', 
    'AudioProcessor', 
    'TTSAsyncProcessor',
    'AIClient', 
    'MockAIClient',
    'ConsoleProcessor',
    'CommandProcessor',
    'BaseProcessor',
    'create_processor',
    'Printer',
    'PrinterConfig',
    'LogLevel',
    'printer',
]
