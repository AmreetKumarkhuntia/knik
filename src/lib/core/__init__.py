"""
Core module for Knik library.
Contains base configurations and shared components.
"""

from .config import Config

# Keep AudioConfig as alias for backward compatibility
AudioConfig = Config

__all__ = ['Config', 'AudioConfig']
