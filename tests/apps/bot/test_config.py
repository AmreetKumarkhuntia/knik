"""Tests for BotConfig dataclass."""

import os
from unittest.mock import patch

from src.apps.bot.config import BotConfig


class TestBotConfig:
    """Tests for BotConfig dataclass."""

    def test_default_values(self):
        """Test default configuration values."""
        config = BotConfig()
        assert config.bot_providers == ["telegram"]
        assert config.bot_concurrent_limit == 10

    @patch.dict(os.environ, {"KNIK_BOT_PROVIDERS": "telegram,whatsapp,discord"})
    def test_providers_parsing(self):
        """Test comma-separated providers parsing."""
        config = BotConfig()
        assert config.bot_providers == ["telegram", "whatsapp", "discord"]

    @patch.dict(os.environ, {"KNIK_BOT_PROVIDERS": "  Telegram , WHATSAPP  "})
    def test_providers_whitespace_handling(self):
        """Test provider name whitespace and case handling."""
        config = BotConfig()
        assert config.bot_providers == ["telegram", "whatsapp"]

    @patch.dict(os.environ, {"KNIK_BOT_PROVIDERS": ""})
    def test_providers_empty_string_uses_default(self):
        """Test empty KNIK_BOT_PROVIDERS uses default."""
        config = BotConfig()
        assert config.bot_providers == ["telegram"]

    @patch.dict(os.environ, {"KNIK_BOT_CONCURRENT_LIMIT": "25"})
    def test_concurrent_limit_override(self):
        """Test KNIK_BOT_CONCURRENT_LIMIT override."""
        config = BotConfig()
        assert config.bot_concurrent_limit == 25

    def test_is_provider_enabled(self):
        """Test is_provider_enabled helper method."""
        config = BotConfig()
        assert config.is_provider_enabled("telegram") is True
        assert config.is_provider_enabled("TELEGRAM") is True
        assert config.is_provider_enabled("whatsapp") is False
