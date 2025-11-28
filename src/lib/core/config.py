"""
Configuration module for application settings and constants.
Supports loading configuration from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass
from typing import Literal, Optional


@dataclass
class Config:
    """Configuration class for application settings (TTS, AI, logging, etc.)."""
    
    SAMPLE_RATE: int = 24000
    
    LANGUAGE_CODES = {
        'american_english': 'a',
        'british_english': 'b',
        'spanish': 'es',
        'french': 'fr',
        'italian': 'it',
        'portuguese': 'pt',
        'german': 'de',
        'japanese': 'ja',
        'chinese': 'zh',
        'korean': 'ko',
    }
    
    VOICES = {
        'af_heart': 'af_heart',
        'af_bella': 'af_bella',
        'af_sarah': 'af_sarah',
        'af_nicole': 'af_nicole',
        'af_sky': 'af_sky',
        'am_adam': 'am_adam',
        'am_michael': 'am_michael',
        'am_leo': 'am_leo',
        'am_ryan': 'am_ryan',
    }
    
    # TTS defaults (can be overridden by env vars)
    DEFAULT_TTS: str = 'kokoro'
    DEFAULT_LANGUAGE: str = 'a'
    DEFAULT_VOICE: str = 'af_heart'
    DEFAULT_MODEL: str = 'hexgrad/Kokoro-82M'
    
    # AI defaults (can be overridden by env vars)
    DEFAULT_AI_MODEL: str = 'gemini-1.5-flash'
    DEFAULT_AI_LOCATION: str = 'us-central1'
    DEFAULT_AI_MAX_TOKENS: int = 1024
    DEFAULT_AI_TEMPERATURE: float = 0.7
    
    # Logging defaults (can be overridden by env vars)
    DEFAULT_LOG_LEVEL: str = 'ERROR'
    DEFAULT_SHOW_LOGS: bool = False
    DEFAULT_USE_COLORS: bool = True
    
    AI_MODELS = {
        'gemini-1.5-flash': 'Fast, efficient model',
        'gemini-1.5-pro': 'More capable, slower model',
        'gemini-1.0-pro': 'Legacy stable model',
    }
    
    @classmethod
    def from_env(cls, key: str, default=None, type_cast=str):
        """
        Load a configuration value from environment variable.
        
        Args:
            key: Environment variable name
            default: Default value if env var not set
            type_cast: Function to cast the value (str, int, float, bool)
            
        Returns:
            The configuration value
            
        Example:
            >>> Config.from_env('KNIK_VOICE', 'am_adam')
            'am_adam'  # or value from KNIK_VOICE env var
        """
        value = os.getenv(key)
        if value is None:
            return default
        
        # Handle boolean conversion
        if type_cast == bool:
            return value.lower() in ('true', '1', 'yes', 'on')
        
        # Handle int/float conversion
        try:
            return type_cast(value)
        except (ValueError, TypeError):
            return default
    
    @classmethod
    def get_language(cls) -> str:
        """Get language from env or default."""
        return cls.from_env('KNIK_LANGUAGE', cls.DEFAULT_LANGUAGE)
    
    @classmethod
    def get_voice(cls) -> str:
        """Get voice from env or default."""
        return cls.from_env('KNIK_VOICE', cls.DEFAULT_VOICE)
    
    @classmethod
    def get_model(cls) -> str:
        """Get TTS model from env or default."""
        return cls.from_env('KNIK_MODEL', cls.DEFAULT_MODEL)
    
    @classmethod
    def get_ai_model(cls) -> str:
        """Get AI model from env or default."""
        return cls.from_env('KNIK_AI_MODEL', cls.DEFAULT_AI_MODEL)
    
    @classmethod
    def get_ai_location(cls) -> str:
        """Get AI location from env or default."""
        return cls.from_env('KNIK_AI_LOCATION', cls.DEFAULT_AI_LOCATION)
    
    @classmethod
    def get_ai_project(cls) -> Optional[str]:
        """Get Google Cloud project ID from env."""
        return cls.from_env('GOOGLE_CLOUD_PROJECT', None)
    
    @classmethod
    def get_log_level(cls) -> str:
        """Get log level from env or default."""
        return cls.from_env('KNIK_LOG_LEVEL', cls.DEFAULT_LOG_LEVEL).upper()
    
    @classmethod
    def get_show_logs(cls) -> bool:
        """Get show logs flag from env or default."""
        return cls.from_env('KNIK_SHOW_LOGS', cls.DEFAULT_SHOW_LOGS, bool)
    
    @classmethod
    def get_use_colors(cls) -> bool:
        """Get use colors flag from env or default."""
        return cls.from_env('KNIK_USE_COLORS', cls.DEFAULT_USE_COLORS, bool)
    
    @classmethod
    def get_language_code(cls, language: str) -> str:
        return cls.LANGUAGE_CODES.get(language.lower(), cls.DEFAULT_LANGUAGE)
    
    @classmethod
    def is_valid_voice(cls, voice: str) -> bool:
        return voice in cls.VOICES.values()
