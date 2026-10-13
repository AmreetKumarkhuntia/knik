"""What the routes share, built once at startup: the settings, an AI client per conversation, TTS and the scheduler.

The lifespan in main.py builds the AppState and keeps it on ``app.state``; routes get it through
``deps.get_state``.
"""

from __future__ import annotations

import asyncio
import weakref
from collections.abc import AsyncIterator, Coroutine
from contextlib import asynccontextmanager
from typing import Any

from backend.config import WebBackendConfig
from backend.models.admin import SettingsUpdate
from backend.settings_service import SettingsService
from imports import (
    DB_ERRORS,
    AIClient,
    AIClientCache,
    ApiKeyDB,
    KokoroVoiceModel,
    Scheduler,
    build_workflow_client,
    cleanup_all_tools,
    cleanup_client_tools,
    printer,
)


class AppState:
    def __init__(
        self,
        config: WebBackendConfig,
        settings: SettingsService,
        tts: KokoroVoiceModel,
        scheduler: Scheduler,
    ) -> None:
        self.config = config
        self.settings = settings
        self.tts = tts
        # Runs workflows on request only; the worker process polls the schedules.
        self.scheduler = scheduler
        # One client per conversation, so each keeps its own tools (e.g. its browser) between messages.
        self.clients = AIClientCache(on_release=self._release)
        # How many requests hold each client (see client()); a client is cleaned up only once none do.
        self._in_use: dict[AIClient, int] = {}
        # Bumped by every settings or tool change; a client built under an older one is never cached.
        self._generation = 0
        self._built_in: weakref.WeakKeyDictionary[AIClient, int] = weakref.WeakKeyDictionary()
        # Tool cleanups and API-key stamps still running; close() waits for them.
        self._background: set[asyncio.Task] = set()

    @classmethod
    async def create(cls, config: WebBackendConfig) -> AppState:
        """Load the settings and the TTS model. Copes with the database being down (env defaults apply)."""
        settings = SettingsService(config)
        await settings.load()
        tts = await _load_tts(settings.voice)
        return cls(config, settings, tts, Scheduler(ai_client_factory=build_workflow_client))

    @asynccontextmanager
    async def client(self, conversation_id: str | None) -> AsyncIterator[AIClient]:
        """Lend a request the conversation's client for as long as it runs.

        While a request holds a client, its tools are not cleaned up, even if the client leaves the cache
        (a settings change, a deleted conversation, eviction). A client that is not cached when its last
        request ends, such as one for a chat that never got a conversation id, is cleaned up then.
        """
        client = await self.get_client(conversation_id)
        self._in_use[client] = self._in_use.get(client, 0) + 1
        try:
            yield client
        finally:
            remaining = self._in_use.pop(client) - 1
            if remaining:
                self._in_use[client] = remaining
            elif not self.clients.holds(client):
                self._release(client)

    async def get_client(self, conversation_id: str | None) -> AIClient:
        """The conversation's cached client, or a new one cached under its id. Requests use client() instead.

        A None conversation_id gets a fresh, uncached client: the chat creates the conversation, and the
        caller then caches the client under the new id with set_client().
        """
        if conversation_id is not None:
            cached = self.clients.get(conversation_id)
            if cached is not None:
                return cached

        generation = self._generation
        settings = self.settings.client_settings
        client = await asyncio.to_thread(self.settings.build_client)
        self._built_in[client] = generation
        printer.success(f"AIClient ready: {settings.provider}/{settings.model}")

        if conversation_id is not None:
            # Another request for the same conversation may have cached one while this one was building.
            cached = self.clients.get(conversation_id)
            if cached is not None:
                self._release(client)
                return cached
            self.set_client(conversation_id, client)
        return client

    def set_client(self, conversation_id: str, client: AIClient) -> None:
        """Cache the client under the conversation id, unless one is already cached there or it is out of date.

        A client left uncached still serves the request holding it and is cleaned up when that request ends.
        """
        if self._built_in.get(client) != self._generation or self.clients.get(conversation_id) is not None:
            return
        self.clients.set(conversation_id, client)

    def remove_client(self, conversation_id: str) -> None:
        """Drop the conversation's cached client; its tools are cleaned up once no request holds it."""
        self.clients.remove(conversation_id)

    async def update_settings(self, update: SettingsUpdate) -> None:
        """Persist and apply a settings change. Cached clients are dropped if new ones would be built differently."""
        before = self.settings.client_settings
        await self.settings.update(update)

        after = self.settings.client_settings
        if after != before:
            self._drop_clients()
            printer.info(f"AI client settings updated: {after.provider}/{after.model}")

        if update.voice:
            self.tts.set_voice(update.voice)
            printer.info(f"TTS voice updated: {update.voice}")

    async def set_tool_group_enabled(self, group: str, enabled: bool) -> None:
        """Persist and apply a tool-group switch; cached clients are dropped so every conversation follows it."""
        before = self.settings.disabled_tools
        await self.settings.set_tool_group_enabled(group, enabled)
        if self.settings.disabled_tools != before:
            self._drop_clients()
            printer.info(f"Tool group {group} {'enabled' if enabled else 'disabled'}")

    def record_api_key_use(self, key_id: str) -> None:
        """Stamp the key's last use without making the request wait for the write."""
        self._spawn(_mark_api_key_used(key_id))

    async def close(self) -> None:
        """Clean up the tools of every client built here (closing their browsers), for shutdown."""
        self._drop_clients()
        await asyncio.gather(*self._background, return_exceptions=True)
        # Clients still held by a request that has not finished, or built outside client().
        await asyncio.to_thread(cleanup_all_tools)

    def _drop_clients(self) -> None:
        self._generation += 1
        self.clients.clear()

    def _release(self, client: AIClient) -> None:
        """Clean up a client that left the cache, unless a request still holds it (client() does it then)."""
        if client in self._in_use or client.tool_registry is None:
            return
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            cleanup_client_tools(client)
            return
        # Closing a browser waits for its thread for up to seconds, so keep it off the event loop.
        self._spawn(asyncio.to_thread(cleanup_client_tools, client))

    def _spawn(self, work: Coroutine[Any, Any, Any]) -> None:
        task = asyncio.get_running_loop().create_task(work)
        self._background.add(task)
        task.add_done_callback(self._background.discard)


async def _mark_api_key_used(key_id: str) -> None:
    try:
        await ApiKeyDB.mark_used(key_id)
    except DB_ERRORS as e:
        printer.warning(f"Could not record the use of API key {key_id}: {e}")


async def _load_tts(voice: str) -> KokoroVoiceModel:
    tts = KokoroVoiceModel(voice=voice)
    try:
        await asyncio.to_thread(tts.load)
    except Exception as e:
        # generate() loads the model when it is missing, so the first speech request tries again.
        printer.warning(f"TTS model failed to load, will retry on first use: {e}")
    else:
        printer.success(f"TTS ready: {voice}")
    return tts
