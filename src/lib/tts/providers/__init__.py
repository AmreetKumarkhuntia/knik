"""
Voice model providers module.
"""

from .base import VoiceModel
from .kokoro import KokoroVoiceModel

__all__ = [
    "VoiceModel",
    "KokoroVoiceModel",
]
