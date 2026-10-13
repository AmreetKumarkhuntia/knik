"""Consent gate protocol for tool execution approval, plus the prompt and reply wording the apps share.

Return values from ``request_sync``:
  - ``"yes"``      – approve this single invocation only
  - ``"yes_all"``  – approve all future calls to this tool name
  - ``"no"``       – deny this invocation
"""

from dataclasses import dataclass
from typing import Any, Literal, Protocol, runtime_checkable


ConsentReply = Literal["yes", "yes_all", "no"]

DEFAULT_CONSENT_CHOICES = "Reply yes (y) / yes all (ya) / no"

_REPLIES: dict[str, ConsentReply] = {
    "yes all": "yes_all",
    "ya": "yes_all",
    "yes": "yes",
    "y": "yes",
    "no": "no",
    "n": "no",
}


@dataclass
class ConsentRequest:
    tool_name: str
    kwargs: dict[str, Any]


@runtime_checkable
class ConsentGate(Protocol):
    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str: ...


def parse_consent_reply(text: str | None) -> ConsentReply | None:
    """None when the text is not a recognised answer; the gates treat that as a denial."""
    return _REPLIES.get((text or "").strip().lower())


def format_consent_prompt(req: ConsentRequest, choices: str = DEFAULT_CONSENT_CHOICES) -> str:
    """``choices`` is the part each app words its own way (the bot and console differ only there)."""
    args_preview = ", ".join(f"{k}={repr(v)[:60]}" for k, v in req.kwargs.items())
    return f"Allow {req.tool_name}({args_preview})? {choices}"
