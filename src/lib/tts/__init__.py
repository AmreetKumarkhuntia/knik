"""
TTS (Text-to-Speech) module.
Consolidates TTS generation and audio playback.
"""

from .audio import AudioProcessor
from .processor import TTSAsyncProcessor
from .providers.base import VoiceModel
from .providers.kokoro import KokoroVoiceModel
from .utils import filter_tts_text

__all__ = [
    "AudioProcessor",
    "KokoroVoiceModel",
    "TTSAsyncProcessor",
    "VoiceModel",
    "filter_tts_text",
]
