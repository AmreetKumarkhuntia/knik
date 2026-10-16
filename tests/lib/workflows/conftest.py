"""Fixtures for the workflow tests."""

import pytest

from lib.core.config import Config


@pytest.fixture(autouse=True)
def installed_config(no_installed_config, monkeypatch):
    """A known installed config, so the defaults an AI node falls back to do not depend on the env."""
    monkeypatch.setattr(Config, "_current", Config(ai_provider="vertex", ai_model="gemini-3.0-flash", temperature=0.7))
