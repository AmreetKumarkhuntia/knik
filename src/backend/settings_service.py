"""The settings the backend runs with, merged from the env config, the persisted settings and admin updates.

New AI clients are built from ``client_settings``: an admin update wins over the persisted row (read once
at startup), which wins over the env config. Tool groups switched off in the admin panel are left out of
every new client's tool registry, and every registry gets the web consent gate. An update is persisted before
it is applied, so a failed write changes nothing.
"""

from __future__ import annotations

import dataclasses
import functools
from typing import Any

from backend.config import WebBackendConfig
from backend.consent import WebConsentGate
from backend.models.admin import SettingsUpdate
from imports import (
    ALL_TOOL_CLASSES,
    DB_ERRORS,
    AIClient,
    AppSettings,
    ClientSettings,
    McpToolsDB,
    SettingsDB,
    build_client,
    create_tool_registry,
    printer,
)


# Display categories for the built-in tool groups.
_TOOL_CATEGORY = {
    "file": "System",
    "shell": "System",
    "text": "Dev",
    "utils": "Dev",
    "cron": "Automation",
    "workflow": "Automation",
    "browser": "Web",
}


class SettingsService:
    def __init__(self, config: WebBackendConfig) -> None:
        self._config = config
        self.client_settings: ClientSettings = _client_settings(config, AppSettings())
        self.voice: str = config.voice_name
        self.disabled_tool_groups: frozenset[str] = frozenset()
        self._consent_gate = WebConsentGate(config.tool_consent)

    async def load(self) -> None:
        """Apply the persisted settings and tool-group overrides; without a database the env defaults stay."""
        try:
            persisted = await SettingsDB.get()
        except DB_ERRORS as e:
            printer.warning(f"Could not load persisted settings: {e}")
        else:
            if persisted:
                self.client_settings = _client_settings(self._config, persisted)
                self.voice = persisted.voice or self._config.voice_name
                printer.info(f"Loaded persisted settings: {persisted.provider}/{persisted.model}")

        try:
            overrides = await McpToolsDB.get_overrides()
        except DB_ERRORS as e:
            printer.warning(f"Could not load tool overrides, every tool group is enabled: {e}")
        else:
            self.disabled_tool_groups = frozenset(name for name, enabled in overrides.items() if not enabled)

    @property
    def disabled_tools(self) -> frozenset[str]:
        """The tool names of the disabled tool groups, for ``create_tool_registry(disabled=...)``."""
        return frozenset(
            tool_name
            for group, tool_names in _tool_groups()
            if group in self.disabled_tool_groups
            for tool_name in tool_names
        )

    def build_client(self) -> AIClient:
        """A new AI client with the current settings and every enabled tool group, behind the web consent gate."""
        tool_registry = create_tool_registry(consent_gate=self._consent_gate, disabled=self.disabled_tools)
        return build_client(self.client_settings, tool_registry=tool_registry)

    async def view(self) -> dict[str, Any]:
        """The settings page: persisted preferences over the values in effect over the env defaults."""
        # Without a database this still answers with the values in effect, which is then all there is.
        try:
            saved = await SettingsDB.get()
        except DB_ERRORS as e:
            printer.warning(f"Persisted settings unavailable, showing defaults: {e}")
            saved = None
        persisted = saved.to_dict() if saved else {}
        temperature = persisted.get("temperature")
        if temperature is None:
            temperature = self.client_settings.temperature
        return {
            "provider": persisted.get("provider") or self.client_settings.provider,
            "model": persisted.get("model") or self.client_settings.model or self._config.ai_model,
            "voice": persisted.get("voice") or self.voice,
            "temperature": temperature if temperature is not None else self._config.temperature,
            "max_tokens": persisted.get("max_tokens") or self.client_settings.max_tokens or self._config.max_tokens,
            "sample_rate": self._config.sample_rate,
            "stream_responses": persisted.get("stream_responses", True),
            "send_telemetry": persisted.get("send_telemetry", False),
            "display_name": persisted.get("display_name"),
            "username": persisted.get("username"),
            # The client settings and TTS are set up at startup, before any request is served.
            "initialized": True,
        }

    async def update(self, update: SettingsUpdate) -> None:
        """Persist the fields that are set, then apply them to the clients built from now on.

        An empty provider or model keeps the current one. An empty api_base or api_key clears it, and a
        max_tokens of 0 leaves the provider's default, as they read back after a restart.
        """
        await SettingsDB.upsert(update.model_dump(exclude_none=True))

        current = self.client_settings
        self.client_settings = dataclasses.replace(
            current,
            provider=update.provider or current.provider,
            model=update.model or current.model,
            api_base=current.api_base if update.api_base is None else (update.api_base or None),
            api_key=current.api_key if update.api_key is None else (update.api_key or None),
            temperature=current.temperature if update.temperature is None else update.temperature,
            max_tokens=current.max_tokens if update.max_tokens is None else (update.max_tokens or None),
        )
        if update.voice:
            self.voice = update.voice

    async def tool_groups(self) -> list[dict[str, Any]]:
        """Each built-in tool group with its tool count and whether it is enabled (the default)."""
        try:
            overrides = await McpToolsDB.get_overrides()
        except DB_ERRORS as e:
            # Without a database the groups in effect are the ones loaded at startup or switched since.
            printer.warning(f"MCP tool overrides unavailable, showing the groups in effect: {e}")
            overrides = dict.fromkeys(self.disabled_tool_groups, False)
        return [
            {
                "name": group,
                "category": _TOOL_CATEGORY.get(group, "Tools"),
                "count": len(tool_names),
                "enabled": overrides.get(group, True),
            }
            for group, tool_names in _tool_groups()
        ]

    async def set_tool_group_enabled(self, group: str, enabled: bool) -> None:
        """Persist the override, then apply it to the clients built from now on."""
        await McpToolsDB.set_enabled(group, enabled)
        if enabled:
            self.disabled_tool_groups -= {group}
        else:
            self.disabled_tool_groups |= {group}


def _client_settings(config: WebBackendConfig, persisted: AppSettings) -> ClientSettings:
    # Empty strings count as unset, as they did when each setting was only passed on when truthy.
    return ClientSettings(
        provider=persisted.provider or config.ai_provider,
        model=persisted.model or config.ai_model,
        system_instruction=str(config.system_instruction) if config.system_instruction else None,
        project_id=config.ai_project_id or None,
        location=config.ai_location or None,
        api_base=persisted.api_base or None,
        api_key=persisted.api_key or None,
        temperature=persisted.temperature,
        max_tokens=persisted.max_tokens or None,
    )


@functools.cache
def _tool_groups() -> tuple[tuple[str, tuple[str, ...]], ...]:
    """(group name, its tool names) for each tool group in the catalog, in catalog order."""
    groups = []
    for tool_cls in ALL_TOOL_CLASSES:
        try:
            tool = tool_cls()
            tool_names = tuple(definition["name"] for definition in tool.get_definitions())
        except Exception as e:
            printer.debug(f"Skipping MCP tool {tool_cls.__name__}: {e}")
            continue
        groups.append((tool.name, tool_names))
    return tuple(groups)
