"""Fixtures for the workflow tests."""

import pytest

from lib.core.config import Config


@pytest.fixture(autouse=True)
def installed_config(monkeypatch):
    """A known installed config, unlike the env and the old hard-coded node defaults, so a node falling back to it shows."""
    monkeypatch.setattr(Config, "_current", Config(ai_provider="mock", ai_model="configured-model", temperature=0.4))
