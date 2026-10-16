"""The settings the backend runs with: the env config with the stored overrides layered on top.

``config`` is the env ``WebBackendConfig`` with every row of the settings table applied over it
(``Config.with_overrides``), and new AI clients are built from the ``client_settings`` that follow it. An
update is validated and persisted before it is applied, so a failed write changes nothing. The layered config
is also installed as ``Config.current()``, so library code reads the same values. Tool groups switched off in
the admin panel are left out of every new client's tool registry, and every registry gets the web consent gate.
"""

from __future__ import annotations

import functools
import os
from typing import Any

from backend.config import WebBackendConfig
from backend.consent import WebConsentGate
from imports import (
    ALL_TOOL_CLASSES,
    DB_ERRORS,
    AIClient,
    ClientSettings,
    Config,
    McpToolsDB,
    ProviderRegistry,
    SettingsDB,
    build_client,
    create_tool_registry,
    printer,
)


# What a secret setting reads back as; posting it back leaves the stored value alone.
SECRET_MASK = "••••••"

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
        self._base = config
        self.disabled_tool_groups: frozenset[str] = frozenset()
        self._consent_gate = WebConsentGate(config.tool_consent)
        self._apply({})

    def _apply(self, overrides: dict[str, Any]) -> None:
        self._overrides = overrides
        self.config = self._base.with_overrides(overrides)
        self.client_settings = ClientSettings.from_config(self.config)
        # Library code (compaction, history size, browser) reads the same layered values.
        Config.install(self.config)

    async def load(self) -> None:
        """Apply the stored settings and tool-group overrides; without a database the env values stay."""
        try:
            overrides = await SettingsDB.get_all()
        except DB_ERRORS as e:
            printer.warning(f"Could not load stored settings, env values apply: {e}")
        else:
            self._apply(overrides)
            printer.info(f"Loaded {len(overrides)} stored settings: {self.config.ai_provider}/{self.config.ai_model}")

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

    def view(self) -> dict[str, Any]:
        """Every user setting with its definition, the value in effect and where it comes from (db, env or default)."""
        items = []
        for item in Config.schema():
            key = item["key"]
            value = getattr(self.config, key)
            if item["secret"]:
                value = SECRET_MASK if value else ""
            if key == "ai_provider":
                # The registry lives above lib/core, so the model cannot list the providers itself.
                item["options"] = ProviderRegistry.list_providers()
            if key in self._overrides:
                source = "db"
            elif os.getenv(item["env"]) is not None:
                source = "env"
            else:
                source = "default"
            items.append({**item, "value": value, "source": source})
        return {"settings": items}

    async def update(self, changes: dict[str, Any]) -> None:
        """Validate, persist, then apply. ValueError names the setting that is not valid."""
        valid = Config.validate({key: value for key, value in changes.items() if value != SECRET_MASK})
        providers = ProviderRegistry.list_providers()
        if "ai_provider" in valid and valid["ai_provider"] not in providers:
            raise ValueError(f"ai_provider must be one of {', '.join(providers)}")
        await SettingsDB.set_many(valid)
        self._apply({**self._overrides, **valid})

    async def reset(self, key: str) -> None:
        """Forget the stored value, so the env or built-in default applies again. Any key, so a stale row can go."""
        await SettingsDB.delete(key)
        self._apply({k: v for k, v in self._overrides.items() if k != key})

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
