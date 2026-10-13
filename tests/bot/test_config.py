"""Tests for BotConfig dataclass."""

import os
from unittest.mock import patch

from bot.config import BotConfig


class TestBotConfig:
    def test_default_values(self):
        config = BotConfig()
        assert config.bot_concurrent_limit == 10
        assert config.error_message

    def test_busy_message_says_the_message_was_not_taken(self):
        assert "send it again" in BotConfig().busy_message

    @patch.dict(os.environ, {"KNIK_BOT_CONCURRENT_LIMIT": "25"})
    def test_concurrent_limit_override(self):
        config = BotConfig()
        assert config.bot_concurrent_limit == 25

    @patch.dict(os.environ, {"KNIK_BOT_ENABLED": "false"})
    def test_bot_enabled_override(self):
        config = BotConfig()
        assert config.bot_enabled is False
