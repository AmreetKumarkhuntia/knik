"""MCP tool registry"""

import threading
from collections.abc import Callable
from typing import Any

from lib.services.ai_client.base_tool import BaseTool
from lib.services.ai_client.consent import ConsentGate, ConsentRequest
from lib.utils.printer import printer


try:
    from langchain_core.tools import StructuredTool
    from pydantic import Field, create_model

    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    StructuredTool = None


class MCPServerRegistry:
    """Registry for tool schemas and implementations.

    Each instance owns its own tool state. Create a new instance for an
    isolated set of tools; reuse an existing instance when you want to
    share tools across components (e.g. an app-level registry).
    """

    def __init__(self):
        self._tools: list[dict[str, Any]] = []
        self._implementations: dict[str, Callable] = {}
        self._tool_instances: list[BaseTool] = []
        self._consent_gate: ConsentGate | None = None
        self._allowed_tools: set[str] = set()
        self._consent_lock = threading.Lock()

    def set_consent_gate(self, gate: ConsentGate) -> None:
        self._consent_gate = gate
        printer.info(f"Consent gate attached: {type(gate).__name__}")

    def register_tool(self, tool_dict: dict[str, Any], implementation: Callable | None = None) -> None:
        self._tools.append(tool_dict)
        if implementation:
            tool_name = tool_dict.get("name")
            if tool_name:
                self._implementations[tool_name] = implementation

    def get_tools(self) -> list[dict[str, Any]]:
        return self._tools

    def get_implementation(self, tool_name: str) -> Callable | None:
        return self._implementations.get(tool_name)

    def execute_tool(self, tool_name: str, **kwargs) -> Any:
        if not self._consent_gate:
            printer.debug(f"No consent gate attached — executing {tool_name} without approval check")
        else:
            with self._consent_lock:
                needs_consent = tool_name not in self._allowed_tools
            if needs_consent:
                printer.info(f"Consent required for {tool_name}, requesting approval...")
                req = ConsentRequest(tool_name=tool_name, kwargs=kwargs)
                response = self._consent_gate.request_sync(req)
                if response == "yes_all":
                    with self._consent_lock:
                        self._allowed_tools.add(tool_name)
                    printer.info(f"Consent granted for all future {tool_name} calls")
                elif response == "yes":
                    printer.info(f"Consent granted for {tool_name} (this call only)")
                else:
                    printer.warning(f"Consent denied for {tool_name}")
                    return {"error": f"Permission denied for {tool_name}"}
        impl = self.get_implementation(tool_name)
        if impl is None:
            raise ValueError(f"No implementation found for tool: {tool_name}")
        return impl(**kwargs)

    def clear_tools(self) -> None:
        self._tools = []
        self._implementations = {}
        self._tool_instances = []
        with self._consent_lock:
            self._allowed_tools = set()

    def add_tool_instance(self, tool: BaseTool) -> None:
        self._tool_instances.append(tool)

    def revoke_allowed_tools(self) -> None:
        with self._consent_lock:
            cleared = self._allowed_tools.copy()
            self._allowed_tools.clear()
        printer.info(f"Revoked tool approvals: {cleared}")

    def get_tool_instances(self) -> list[BaseTool]:
        return list(self._tool_instances)

    def cleanup_tools(self) -> None:
        for tool in self._tool_instances:
            try:
                tool.cleanup()
            except Exception as e:
                printer.warning(f"[MCPServerRegistry] cleanup error for {tool.name}: {e}")

    def create_langchain_tools(self) -> list:
        if not LANGCHAIN_AVAILABLE:
            return []

        tools = []
        type_mapping = {
            "string": str,
            "integer": int,
            "number": float,
            "boolean": bool,
            "object": dict[str, Any],
            "array": list[Any],
        }

        for schema in self._tools:
            func_def = schema.get("function", schema)
            tool_name = func_def.get("name")
            description = func_def.get("description", "")
            params = func_def.get("parameters", {})

            if not tool_name:
                continue

            if tool_name not in self._implementations:
                continue

            def make_tool_func(name: str) -> Callable:
                def tool_func(**kwargs):
                    printer.info(f"Tool Input: {name}({kwargs})")
                    try:
                        result = self.execute_tool(name, **kwargs)
                        printer.info(f"Tool Output: {name} -> {result}")
                        return result
                    except Exception as e:
                        printer.error(f"Tool Error: {name} -> {e}")
                        return {"error": str(e)}

                return tool_func

            fields = {}
            for name, prop in params.get("properties", {}).items():
                prop_type = prop.get("type", "string")
                is_required = name in params.get("required", [])

                if prop_type not in type_mapping:
                    printer.warning(
                        f"Unknown parameter type '{prop_type}' for tool '{tool_name}', defaulting to 'string'"
                    )
                    prop_type = "string"

                if prop_type == "object":
                    fields[name] = (
                        dict[str, Any] if is_required else dict[str, Any] | None,
                        Field(description=prop.get("description", ""), default=None if not is_required else ...),
                    )
                elif prop_type == "array":
                    fields[name] = (
                        list[Any] if is_required else list[Any] | None,
                        Field(description=prop.get("description", ""), default=None if not is_required else ...),
                    )
                else:
                    py_type = type_mapping.get(prop_type, str)
                    is_required = name in params.get("required", [])
                    fields[name] = (
                        py_type if is_required else py_type | None,
                        Field(description=prop.get("description", ""), default=None if not is_required else ...),
                    )

            ArgsModel = create_model(f"{tool_name}Args", **fields)

            tools.append(
                StructuredTool(
                    name=tool_name,
                    description=description or f"Execute {tool_name}",
                    func=make_tool_func(tool_name),
                    args_schema=ArgsModel,
                )
            )

        return tools
