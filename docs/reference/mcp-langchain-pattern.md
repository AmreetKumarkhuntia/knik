# Tool Binding

How the tools in `src/lib/tools/` reach a LangChain model. For what the tools are, how apps build a registry and
how consent works, see the [Tools guide](../guides/mcp.md).

> This page used to describe an older design: a class-level `MCPServerRegistry`, `lib/mcp` definition and
> implementation modules, `AIClient(mcp_registry=...)` and `query()` / `query_stream()`. None of those exist any
> more. Tools are now bound once, when the provider is built, from a `ToolRegistry` instance.

## The path from registry to model

```
create_tool_registry(consent_gate=..., disabled=...)      lib/tools/index.py
        |  ToolRegistry: definitions, implementations, consent gate, tool instances
        v
build_client(ClientSettings, tool_registry=registry)      lib/services/ai_client/factory.py
        |  AIClient(provider=..., tool_registry=registry, system_instruction=..., **provider settings)
        v
provider_class(tool_registry=registry, ...)               lib/services/ai_client/providers/
        |  registry.create_langchain_tools() -> list[StructuredTool]
        |  llm.bind_tools(tools) and langchain.agents.create_agent(model=llm, tools=tools, system_prompt=...)
        v
chat() / chat_stream()                                    the agent runs the tool loop
        |  each tool call -> StructuredTool -> registry.execute_tool(name, **args)
        v
consent gate (if the tool needs it) -> implementation
```

1. **Registry.** `create_tool_registry()` returns a `ToolRegistry` holding the JSON Schema definitions, the
   implementation of each tool name, the tool group instances and the consent gate.
2. **Client.** `build_client(settings, tool_registry=...)` builds the `AIClient`. It passes the provider only
   the settings its constructor declares (`provider_kwargs` in `settings.py`), plus the registry and the system
   instruction. `AIClient` types the registry as `ToolProvider`, the protocol in `tool_provider.py`, so the
   services layer never imports `lib/tools`.
3. **Provider.** Every LangChain provider (`vertex`, `gemini`, `zhipuai`, `zai`, `zai_coding`, `custom`) calls
   `registry.create_langchain_tools()` and builds an agent with `create_agent()` from those tools; the
   `LangChainProvider` base class also keeps the model with the tools bound (`llm.bind_tools(tools)`). When the
   registry has no tools (every group switched off), there is no agent and the model is called directly.
   The `mock` provider accepts a registry and never calls a tool.
4. **Call.** `chat()` invokes the agent, which runs the model, calls tools and feeds their results back until the
   model answers. `chat_stream()` streams the agent's messages as typed events: `TextDelta`, and a
   `ToolCallStarted` / `ToolCallFinished` pair around each tool call (`stream_events.py`).

## What `create_langchain_tools()` builds

For each registered definition that has an implementation, a `StructuredTool` whose:

- name and description come from the definition,
- argument model is a Pydantic model built from `parameters.properties`: `string`, `integer`, `number`,
  `boolean`, `object` and `array` map to `str`, `int`, `float`, `bool`, `dict` and `list`; names not in
  `required` become optional with a `None` default,
- function calls `registry.execute_tool(name, **kwargs)`, logs the input and output, and returns
  `{"error": "<message>"}` instead of raising.

`execute_tool()` asks the consent gate first when the tool is in its group's `consent_required_for`, unless the
tool was approved with "yes all" earlier. A refusal returns `{"error": "Permission denied for <tool>"}`.

## Binding happens once per provider

The tools are fixed when the provider is constructed. A `/model` or `/provider` switch (`AIClient.set_model`,
`set_provider`) builds a new provider from the same registry and system instruction, so the tools carry over.
The web backend applies a tool-group switch by dropping its cached clients, so each conversation's next message
builds a client, and a registry, without the disabled groups.

## Example

From `src/`, with the mock provider (it never calls tools, but the registry and consent wiring are the same):

```python
from lib.services.ai_client.factory import ClientSettings, build_client
from lib.tools.index import create_tool_registry

registry = create_tool_registry()  # no consent gate: every tool runs unasked
client = build_client(ClientSettings(provider="mock"), tool_registry=registry)

print(len(registry.get_tools()))                       # 30
print(registry.execute_tool("calculate", expression="6 * 7"))  # 42
print(client.chat("What is 6 * 7?"))                   # a canned mock reply
registry.cleanup_tools()
```

Apps import these names from `imports.py` instead (`from imports import ClientSettings, build_client,
create_tool_registry`).

## See also

- [LangChain tool calling](https://python.langchain.com/docs/how_to/tool_calling/)
- [Tools guide](../guides/mcp.md)
- [API Reference](api.md)
