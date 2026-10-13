"""Tool registration and discovery."""

from collections.abc import Collection
from typing import Any

from lib.services.ai_client.client import AIClient
from lib.services.ai_client.factory import ClientSettings, build_client
from lib.tools.catalog import ALL_TOOL_CLASSES
from lib.tools.consent import ConsentGate
from lib.tools.registry import ToolRegistry


def register_all_tools(registry: ToolRegistry, *, disabled: Collection[str] = ()) -> int:
    """Returns the number of tools registered. Tool names in ``disabled`` are left out."""
    if registry is None:
        raise ValueError("A ToolRegistry instance is required")

    count = 0
    for tool_cls in ALL_TOOL_CLASSES:
        tool = tool_cls()
        impls = tool.get_implementations()
        bound = [
            (tool_def, impls[tool_def.get("name")])
            for tool_def in tool.get_definitions()
            if tool_def.get("name") in impls and tool_def.get("name") not in disabled
        ]
        # A group with every tool disabled is not kept, so it holds no resources and adds no consent rules.
        if not bound:
            continue
        registry.add_tool_instance(tool)
        for tool_def, impl in bound:
            registry.register_tool(tool_def, impl)
            count += 1

    return count


def create_tool_registry(*, consent_gate: ConsentGate | None = None, disabled: Collection[str] = ()) -> ToolRegistry:
    registry = ToolRegistry()
    if consent_gate is not None:
        registry.set_consent_gate(consent_gate)
    register_all_tools(registry, disabled=disabled)
    return registry


def build_workflow_client(settings: ClientSettings, use_tools: bool) -> AIClient:
    """The AI-client factory the apps hand to the workflow engine: every tool when ``use_tools``, else none."""
    return build_client(settings, tool_registry=create_tool_registry() if use_tools else None)


def get_all_tools() -> list[dict[str, Any]]:
    definitions = []
    for tool_cls in ALL_TOOL_CLASSES:
        definitions.extend(tool_cls().get_definitions())
    return definitions


def get_tool_info() -> dict[str, Any]:
    tools = get_all_tools()
    return {"total_tools": len(tools), "tool_names": [t["name"] for t in tools], "tools": tools}
