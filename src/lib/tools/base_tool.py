"""Base class for a tool group: JSON Schema definitions plus the functions that implement them."""

from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any, ClassVar


class BaseTool(ABC):
    """Instances are owned by the ToolRegistry that registered them, which calls cleanup()."""

    consent_required_for: ClassVar[frozenset[str]] = frozenset()

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def get_definitions(self) -> list[dict[str, Any]]: ...

    @abstractmethod
    def get_implementations(self) -> dict[str, Callable]: ...

    def cleanup(self) -> None:  # noqa: B027
        pass
