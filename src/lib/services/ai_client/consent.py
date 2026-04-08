"""Consent gate protocol for tool execution approval."""

from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable


@dataclass
class ConsentRequest:
    tool_name: str
    kwargs: dict[str, Any]


@runtime_checkable
class ConsentGate(Protocol):
    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> bool: ...
