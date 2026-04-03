from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any, ClassVar


class BaseTool(ABC):
    _instances: ClassVar[list["BaseTool"]] = []

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def get_definitions(self) -> list[dict[str, Any]]: ...

    @abstractmethod
    def get_implementations(self) -> dict[str, Callable]: ...

    def cleanup(self) -> None:  # noqa: B027
        pass

    def __init__(self) -> None:
        BaseTool._instances.append(self)

    @classmethod
    def cleanup_all(cls) -> None:
        for instance in cls._instances:
            instance.cleanup()
