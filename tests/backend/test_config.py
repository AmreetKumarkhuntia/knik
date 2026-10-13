"""WebBackendConfig: the access settings it reads from the environment, and their safe defaults."""

from unittest.mock import patch

import pytest

from backend.config import WebBackendConfig


@pytest.fixture
def env(monkeypatch) -> pytest.MonkeyPatch:
    for name in ("KNIK_WEB_CORS_ORIGINS", "KNIK_WEB_TOOL_CONSENT", "KNIK_WEB_REQUIRE_API_KEY"):
        monkeypatch.delenv(name, raising=False)
    return monkeypatch


def test_defaults_let_in_the_local_frontend_refuse_unasked_tools_and_check_no_key(env):
    config = WebBackendConfig()

    assert config.cors_origins == ("http://localhost:8020", "http://127.0.0.1:8020")
    assert config.tool_consent == "deny"
    assert config.require_api_key is False


def test_cors_origins_are_a_comma_separated_list(env):
    env.setenv("KNIK_WEB_CORS_ORIGINS", " https://knik.example, https://admin.knik.example:8443 ,,")

    assert WebBackendConfig().cors_origins == ("https://knik.example", "https://admin.knik.example:8443")


def test_empty_cors_origins_let_no_other_origin_in(env):
    env.setenv("KNIK_WEB_CORS_ORIGINS", "")

    assert WebBackendConfig().cors_origins == ()


@pytest.mark.parametrize(
    ("value", "expected"), [("allow", "allow"), (" ALLOW ", "allow"), ("deny", "deny"), ("yes", "deny"), ("", "deny")]
)
def test_tool_consent_is_deny_unless_set_to_allow(env, value, expected):
    env.setenv("KNIK_WEB_TOOL_CONSENT", value)

    assert WebBackendConfig().tool_consent == expected


@pytest.mark.parametrize(
    ("value", "expected"),
    [("true", True), ("1", True), (" TRUE ", True), ("false", False), (" Off ", False), ("0", False), ("", False)],
)
def test_require_api_key_is_a_boolean(env, value, expected):
    env.setenv("KNIK_WEB_REQUIRE_API_KEY", value)

    assert WebBackendConfig().require_api_key is expected


@pytest.mark.parametrize("value", ["enabled", "y", "required", "ture"])
def test_an_unrecognised_require_api_key_value_checks_keys_and_warns(env, value):
    env.setenv("KNIK_WEB_REQUIRE_API_KEY", value)

    with patch("backend.config.printer") as printer:
        assert WebBackendConfig().require_api_key is True

    assert repr(value) in printer.warning.call_args.args[0]
