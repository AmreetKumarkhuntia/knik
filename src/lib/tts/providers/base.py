"""
Voice model base module for text-to-speech generation.
Provides abstract base class for TTS models.
"""

from abc import ABC, abstractmethod
from collections.abc import Generator

import numpy as np

from ...core.config import Config


class VoiceModel(ABC):
    """
    Abstract base class for text-to-speech models.

    This class defines the interface that all TTS model implementations must follow.
    Subclasses should implement the abstract methods to provide specific TTS functionality.
    """

    def __init__(
        self,
        language: str = Config.DEFAULT_LANGUAGE,
        voice: str = Config.DEFAULT_VOICE,
        model_name: str = Config.DEFAULT_MODEL,
    ):
        self.language = language
        self.voice = voice
        self.model_name = model_name
        self.sample_rate = Config.SAMPLE_RATE

    @abstractmethod
    def load(self) -> None:
        """Load the TTS model."""
        pass

    @abstractmethod
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        pass

    @abstractmethod
    def generate(self, text: str, voice: str | None = None) -> Generator[tuple[str, str, np.ndarray], None, None]:
        """
        Generate speech from text with streaming output.

        Args:
            text: The text to convert to speech
            voice: Optional voice to use (overrides default)

        Yields:
            Tuple of (graphemes, phonemes, audio_chunk)
        """
        pass

    @abstractmethod
    def set_voice(self, voice: str) -> None:
        """Set the voice for speech generation."""
        pass

    @abstractmethod
    def set_language(self, language: str) -> None:
        """Set the language for speech generation."""
        pass

    def get_info(self) -> dict:
        """Get information about the model configuration."""
        return {
            "model_name": self.model_name,
            "language": self.language,
            "voice": self.voice,
            "sample_rate": self.sample_rate,
            "loaded": self.is_loaded(),
        }
