import atexit
import contextlib
import contextvars
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import TYPE_CHECKING

from ...core.config import Config
from ...utils.printer import printer
from .models import ToolSession
from .resources import SessionResource, SessionResourceFactory


if TYPE_CHECKING:
    pass


# Python 3.12 asyncio.to_thread() copies the current Context, so setting this
# ContextVar before dispatching to a thread makes it visible inside tool
# implementations without any explicit passing.
current_conversation_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "current_conversation_id", default=None
)


class ToolSessionManager:
    _instance: "ToolSessionManager | None" = None
    _instance_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "ToolSessionManager":
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def __init__(self) -> None:
        cfg = Config()
        self._idle_timeout: float = float(cfg.tool_session_idle_timeout)

        self._sessions: dict[str, ToolSession] = {}
        self._sessions_lock = threading.Lock()

        self._resource_factories: dict[str, SessionResourceFactory] = {}
        self._executors: dict[str, ThreadPoolExecutor] = {}
        self._factories_lock = threading.Lock()

        self._shutdown_event = threading.Event()
        self._cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            daemon=True,
            name="tool-session-cleanup",
        )
        self._cleanup_thread.start()

        atexit.register(self.cleanup_all)

    def register_resource_factory(self, key: str, factory: SessionResourceFactory) -> None:
        with self._factories_lock:
            self._resource_factories[key] = factory
            if factory.requires_dedicated_thread:
                self._executors[key] = ThreadPoolExecutor(
                    max_workers=factory.max_workers,
                    thread_name_prefix=f"tool-session-{key}",
                )

    def run_on_thread(self, key: str, fn, *args, **kwargs):
        # copy_context() propagates current_conversation_id into the worker thread.
        executor = self._executors.get(key)
        if executor is None:
            return fn(*args, **kwargs)
        ctx = contextvars.copy_context()
        future = executor.submit(ctx.run, fn, *args, **kwargs)
        return future.result()

    def get_or_create_session(self, conversation_id: str) -> ToolSession:
        with self._sessions_lock:
            session = self._sessions.get(conversation_id)
            if session is None:
                session = ToolSession(conversation_id=conversation_id)
                self._sessions[conversation_id] = session
                printer.info(f"[ToolSession] Created session for conv={conversation_id}")
            session.touch()
            return session

    def get_resource(self, key: str, conversation_id: str) -> SessionResource:
        session = self.get_or_create_session(conversation_id)

        existing = session.get_resource(key)
        if existing is not None:
            return existing

        factory = self._resource_factories.get(key)
        if factory is None:
            raise KeyError(f"No resource factory registered for key '{key}'")

        def _create():
            # Re-check inside the factory thread to avoid double-creation if two
            # callers race before the first creation completes.
            resource = session.get_resource(key)
            if resource is not None:
                return resource
            resource = factory.create(conversation_id)
            session.set_resource(key, resource)
            return resource

        return self.run_on_thread(key, _create)

    def get_page(self, conversation_id: str):
        return self.get_resource("browser", conversation_id).page

    def cleanup_session(self, conversation_id: str) -> None:
        with self._sessions_lock:
            session = self._sessions.pop(conversation_id, None)

        if session is None:
            return

        for key, resource in session.resources.items():

            def _close(r=resource):
                with contextlib.suppress(Exception):
                    r.close()

            try:
                self.run_on_thread(key, _close)
            except RuntimeError:
                _close()  # executor already shut down — call inline

        printer.info(f"[ToolSession] Cleaned up session for conv={conversation_id}")

    def cleanup_idle_sessions(self) -> None:
        with self._sessions_lock:
            idle = [conv_id for conv_id, session in self._sessions.items() if session.is_idle(self._idle_timeout)]

        for conv_id in idle:
            printer.info(f"[ToolSession] Idle timeout: cleaning up conv={conv_id}")
            self.cleanup_session(conv_id)

    def cleanup_all(self) -> None:
        self._shutdown_event.set()

        with self._sessions_lock:
            sessions = list(self._sessions.values())
            self._sessions.clear()

        for session in sessions:
            for key, resource in session.resources.items():

                def _close(r=resource):
                    with contextlib.suppress(Exception):
                        r.close()

                try:
                    self.run_on_thread(key, _close)
                except RuntimeError:
                    _close()

        with self._factories_lock:
            for key, factory in self._resource_factories.items():

                def _shutdown(f=factory):
                    with contextlib.suppress(Exception):
                        f.shutdown()

                try:
                    self.run_on_thread(key, _shutdown)
                except RuntimeError:
                    _shutdown()

            for executor in self._executors.values():
                executor.shutdown(wait=False)

            self._executors.clear()

        printer.info("[ToolSession] All sessions and resource factories cleaned up")

    def _cleanup_loop(self) -> None:
        check_interval = 300
        while not self._shutdown_event.wait(timeout=check_interval):
            try:
                self.cleanup_idle_sessions()
            except Exception as e:
                printer.error(f"[ToolSession] Error in idle cleanup: {e}")
