"""Consent gate protocol for tool execution approval.

Return values from ``request_sync``:
  - ``"yes"``      – approve this single invocation only
  - ``"yes_all"``  – approve all future calls to this tool name
  - ``"no"``       – deny this invocation
"""

from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable


@dataclass
class ConsentRequest:
    tool_name: str
    kwargs: dict[str, Any]


@runtime_checkable
class ConsentGate(Protocol):
    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str: ...
