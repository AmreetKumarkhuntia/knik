"""Config as the settings model: what schema() describes, what coerce() accepts, and how overrides layer on env."""

import logging
from dataclasses import dataclass
from typing import Literal

import pytest

from lib.core.config import Config, setting


@pytest.fixture(autouse=True)
def env_without_user_settings(monkeypatch):
    """Defaults under test are the built-in ones, whatever the developer's .env sets."""
    for item in Config.schema():
        monkeypatch.delenv(item["env"], raising=False)


def test_schema_describes_every_user_setting_and_no_infra_one():
    schema = {item["key"]: item for item in Config.schema()}

    assert {"ai_provider", "ai_model", "temperature", "custom_api_key", "voice_name", "display_name"} <= set(schema)
    assert not {"db_host", "telegram_bot_token", "scheduler_workers", "ai_location"} & set(schema)
    types = (schema["temperature"]["type"], schema["max_tokens"]["type"], schema["enable_voice_output"]["type"])
    assert types == ("float", "int", "bool")
    assert (schema["custom_api_key"]["type"], schema["custom_api_key"]["secret"]) == ("str", True)
    assert schema["voice_name"]["options"] == list(Config.VOICES)
    temperature = schema["temperature"]
    assert (temperature["env"], temperature["default"], temperature["group"]) == ("KNIK_TEMPERATURE", 0.7, "AI")
    assert (temperature["nullable"], temperature["minimum"], temperature["maximum"]) == (False, 0, 2)
    assert (schema["max_tokens"]["nullable"], schema["max_tokens"]["minimum"]) == (True, 1)


def test_unset_model_and_max_tokens_leave_the_provider_its_own_defaults():
    config = Config()

    assert (config.ai_model, config.max_tokens) == (None, None)


def test_a_user_setting_of_an_unsupported_type_is_refused_when_the_schema_is_built():
    @dataclass
    class Listy(Config):
        tags: list[str] = setting("KNIK_TAGS", [], user=True)

    @dataclass
    class Literally(Config):
        mode: Literal["a", "b"] = setting("KNIK_MODE", "a", user=True)

    with pytest.raises(TypeError, match="tags: a user setting must be str, int, float or bool"):
        Listy.schema()
    with pytest.raises(TypeError, match="mode: a user setting must be"):
        Literally.coerce("mode", "a")


@pytest.mark.parametrize(
    ("key", "value", "expected"),
    [
        ("temperature", 1, 1.0),
        ("max_tokens", 5, 5),
        ("custom_api_base", None, None),
        ("enable_voice_output", False, False),
        ("voice_name", "am_adam", "am_adam"),
        ("ai_model", "m", "m"),
        ("ai_model", None, None),
        ("history_context_size", 0, 0),
        ("temperature", 2, 2.0),
        ("compaction_threshold", 1, 1.0),
    ],
)
def test_coerce_accepts_a_value_of_the_settings_type(key, value, expected):
    result = Config.coerce(key, value)

    assert result == expected
    assert type(result) is type(expected)


@pytest.mark.parametrize(
    ("key", "value", "message"),
    [
        ("temperature", "hot", "temperature must be float"),
        ("max_tokens", True, "max_tokens must be int"),
        ("max_tokens", "5", "max_tokens must be int"),
        ("enable_voice_output", 1, "enable_voice_output must be bool"),
        ("ai_provider", None, "ai_provider cannot be empty"),
        ("system_instruction", "   ", "system_instruction cannot be empty"),
        ("system_instruction", "a\x00b", "system_instruction cannot contain a NUL character"),
        ("temperature", float("nan"), "temperature must be a finite number"),
        ("temperature", float("inf"), "temperature must be a finite number"),
        ("temperature", 3, "temperature must be between 0 and 2"),
        ("temperature", 10**400, "temperature is out of range"),
        ("max_tokens", 0, "max_tokens must be at least 1"),
        ("history_context_size", -1, "history_context_size must be at least 0"),
        ("compaction_threshold", 95, "compaction_threshold must be between 0.05 and 1"),
        ("voice_name", "nope", "voice_name must be one of"),
        ("db_host", "x", "unknown setting 'db_host'"),
        ("bogus", 1, "unknown setting 'bogus'"),
    ],
)
def test_coerce_rejects_a_wrong_type_an_unknown_key_and_a_value_outside_the_options(key, value, message):
    with pytest.raises(ValueError, match=message):
        Config.coerce(key, value)


def test_validate_coerces_everything_or_raises_on_the_first_bad_key():
    assert Config.validate({"temperature": 1, "ai_model": "m"}) == {"temperature": 1.0, "ai_model": "m"}
    with pytest.raises(ValueError, match="bogus"):
        Config.validate({"temperature": 0.2, "bogus": 1})


@dataclass
class AppConfig(Config):
    extra: int = 1


def test_with_overrides_applies_valid_keys_keeps_the_subclass_and_skips_a_bad_key_with_a_warning(monkeypatch, caplog):
    monkeypatch.setenv("KNIK_AI_MODEL", "from-env")
    config = AppConfig()

    with caplog.at_level(logging.WARNING, logger="lib.core.config"):
        layered = config.with_overrides({"ai_model": "stored", "temperature": 0, "bogus": 1, "max_tokens": 0})

    assert isinstance(layered, AppConfig)
    assert (layered.ai_model, layered.temperature, layered.extra, layered.max_tokens) == ("stored", 0.0, 1, None)
    assert config.ai_model == "from-env"
    assert [record.getMessage() for record in caplog.records] == [
        "Ignoring setting: unknown setting 'bogus'",
        "Ignoring setting: max_tokens must be at least 1",
    ]
    assert Config.accept({"ai_model": "m", "bogus": 1}) == {"ai_model": "m"}


def test_with_overrides_does_not_reread_the_env(monkeypatch):
    monkeypatch.setenv("KNIK_AI_SYSTEM_INSTRUCTION", "before")
    config = Config()
    monkeypatch.setenv("KNIK_AI_SYSTEM_INSTRUCTION", "after")

    assert config.with_overrides({"temperature": 0.1}).system_instruction == "before"


def test_current_is_a_fresh_env_config_until_one_is_installed(monkeypatch):
    monkeypatch.setenv("KNIK_AI_MODEL", "from-env")
    assert Config.current().ai_model == "from-env"

    installed = Config(ai_model="installed")
    Config.install(installed)

    assert Config.current() is installed
