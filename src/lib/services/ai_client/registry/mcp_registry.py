"""MCP tool registry"""

from collections.abc import Callable
from typing import Any

from lib.utils.printer import printer


try:
    from langchain_core.tools import StructuredTool
    from pydantic import Field, create_model

    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    StructuredTool = None


def _wrap_with_logging(tool_name: str, func: Callable) -> Callable:
    def wrapper(**kwargs):
        printer.info(f"Tool Input: {tool_name}({kwargs})")
        try:
            result = func(**kwargs)
            printer.info(f"Tool Output: {tool_name} -> {result}")
            return result
        except Exception as e:
            printer.error(f"Tool Error: {tool_name} -> {e}")
            return {"error": str(e)}

    return wrapper


class MCPServerRegistry:
    """Registry for tool schemas and implementations.

    Each instance owns its own tool state. Create a new instance for an
    isolated set of tools; reuse an existing instance when you want to
    share tools across components (e.g. an app-level registry).
    """

    def __init__(self):
        self._tools: list[dict[str, Any]] = []
        self._implementations: dict[str, Callable] = {}

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
        impl = self.get_implementation(tool_name)
        if impl is None:
            raise ValueError(f"No implementation found for tool: {tool_name}")
        return impl(**kwargs)

    def clear_tools(self) -> None:
        self._tools = []
        self._implementations = {}

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

            impl = self._implementations.get(tool_name)
            if not impl:
                continue

            impl = _wrap_with_logging(tool_name, impl)

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
                    name=tool_name, description=description or f"Execute {tool_name}", func=impl, args_schema=ArgsModel
                )
            )

        return tools
