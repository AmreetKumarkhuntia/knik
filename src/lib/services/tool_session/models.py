import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from .resources import SessionResource


@dataclass
class ToolSession:
    conversation_id: str
    resources: "dict[str, SessionResource]" = field(default_factory=dict)
    last_used: float = field(default_factory=time.time)
    created_at: float = field(default_factory=time.time)

    def touch(self) -> None:
        self.last_used = time.time()

    def is_idle(self, timeout: float) -> bool:
        return (time.time() - self.last_used) > timeout

    def get_resource(self, key: str) -> "SessionResource | None":
        return self.resources.get(key)

    def set_resource(self, key: str, resource: "SessionResource") -> None:
        self.resources[key] = resource
