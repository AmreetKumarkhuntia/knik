"""Tests for the consent wording the bot and console gates share."""

import pytest

from lib.tools.consent import ConsentRequest, format_consent_prompt, parse_consent_reply


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("yes all", "yes_all"),
        ("ya", "yes_all"),
        ("  YA \n", "yes_all"),
        ("yes", "yes"),
        ("Y", "yes"),
        ("no", "no"),
        ("n", "no"),
    ],
)
def test_parse_consent_reply_recognises_the_offered_answers(text, expected):
    assert parse_consent_reply(text) == expected


@pytest.mark.parametrize("text", ["", None, "nope", "yes please", "sure"])
def test_parse_consent_reply_returns_none_for_anything_else(text):
    assert parse_consent_reply(text) is None


def test_format_consent_prompt_uses_the_bot_wording_by_default():
    req = ConsentRequest(tool_name="shell", kwargs={"command": "ls", "timeout": 5})

    assert format_consent_prompt(req) == "Allow shell(command='ls', timeout=5)? Reply yes (y) / yes all (ya) / no"


def test_format_consent_prompt_takes_the_choices_wording():
    req = ConsentRequest(tool_name="read_file", kwargs={})

    assert (
        format_consent_prompt(req, "[yes (y) / yes all (ya) / no]")
        == "Allow read_file()? [yes (y) / yes all (ya) / no]"
    )


def test_format_consent_prompt_truncates_long_arguments():
    req = ConsentRequest(tool_name="write_file", kwargs={"content": "x" * 100})

    assert format_consent_prompt(req) == f"Allow write_file(content='{'x' * 59})? Reply yes (y) / yes all (ya) / no"
