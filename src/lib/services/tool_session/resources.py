from abc import ABC, abstractmethod


class SessionResource(ABC):
    @abstractmethod
    def close(self) -> None: ...


class SessionResourceFactory(ABC):
    requires_dedicated_thread: bool = False
    max_workers: int = 1

    @abstractmethod
    def create(self, conversation_id: str) -> SessionResource: ...

    @abstractmethod
    def shutdown(self) -> None: ...
