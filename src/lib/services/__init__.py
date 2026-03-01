"""
Services module for Knik library.
Contains independent, feature-complete service modules.
"""

from .ai_client import AIClient, MockAIClient


__all__ = ["AIClient", "MockAIClient"]
