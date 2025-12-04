"""
Core module for Knik library.
Contains base configurations and shared components.
"""

from .config import Config
from .tts_async_processor import TTSAsyncProcessor


# Keep AudioConfig as alias for backward compatibility
AudioConfig = Config

__all__ = ["Config", "AudioConfig", "TTSAsyncProcessor"]
