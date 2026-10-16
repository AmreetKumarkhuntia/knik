"""Config as the settings model: what schema() describes, what coerce() accepts, and how overrides layer on env."""

from dataclasses import dataclass

import pytest

from lib.core.config import Config


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


@pytest.mark.parametrize(
    ("key", "value", "expected"),
    [
        ("temperature", 1, 1.0),
        ("max_tokens", 5, 5),
        ("custom_api_base", None, None),
        ("enable_voice_output", False, False),
        ("voice_name", "am_adam", "am_adam"),
        ("ai_model", "m", "m"),
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
        ("ai_model", None, "ai_model cannot be empty"),
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


def test_with_overrides_applies_valid_keys_keeps_the_subclass_and_skips_a_bad_key_with_a_warning(monkeypatch):
    monkeypatch.setenv("KNIK_AI_MODEL", "from-env")
    config = AppConfig()

    with pytest.warns(UserWarning, match="unknown setting 'bogus'"):
        layered = config.with_overrides({"ai_model": "stored", "temperature": 0, "bogus": 1})

    assert isinstance(layered, AppConfig)
    assert (layered.ai_model, layered.temperature, layered.extra) == ("stored", 0.0, 1)
    assert config.ai_model == "from-env"


def test_with_overrides_does_not_reread_the_env(monkeypatch):
    monkeypatch.setenv("KNIK_AI_SYSTEM_INSTRUCTION", "before")
    config = Config()
    monkeypatch.setenv("KNIK_AI_SYSTEM_INSTRUCTION", "after")

    assert config.with_overrides({"temperature": 0.1}).system_instruction == "before"


def test_current_is_a_fresh_env_config_until_one_is_installed():
    assert Config.current() is not Config.current()

    installed = Config(ai_model="installed")
    Config.install(installed)

    assert Config.current() is installed
