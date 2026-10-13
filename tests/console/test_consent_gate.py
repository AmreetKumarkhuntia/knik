"""Tests for the console consent gate: its prompt wording and the replies it accepts."""

import pytest

from console.tools.consent_gate import ConsoleConsentGate
from lib.tools.consent import ConsentRequest


REQ = ConsentRequest(tool_name="run_shell_command", kwargs={"command": "ls"})


@pytest.mark.parametrize(
    ("answer", "expected"),
    [("ya", "yes_all"), ("Yes All", "yes_all"), ("y", "yes"), (" YES ", "yes"), ("no", "no"), ("whatever", "no")],
)
def test_reply_maps_to_consent(monkeypatch, answer, expected):
    prompts: list[str] = []

    def fake_input(prompt: str) -> str:
        prompts.append(prompt)
        return answer

    monkeypatch.setattr("builtins.input", fake_input)

    assert ConsoleConsentGate().request_sync(REQ) == expected
    assert prompts == ["\nAllow run_shell_command(command='ls')? [yes (y) / yes all (ya) / no]: "]


def test_interrupted_prompt_denies(monkeypatch):
    def interrupted(prompt: str) -> str:
        raise EOFError

    monkeypatch.setattr("builtins.input", interrupted)

    assert ConsoleConsentGate().request_sync(REQ) == "no"
