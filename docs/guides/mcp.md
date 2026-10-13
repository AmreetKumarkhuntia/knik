# Tools

Tools are Python functions the AI can call during a chat. They live in `src/lib/tools/` and form an
in-process LangChain tool registry, not a Model Context Protocol server. The "MCP" in some names
(`McpToolsDB`, the admin endpoints under `/api/admin/mcp-tools`, the console's `/tools` heading) is historical.

## Layout

```
src/lib/tools/
  base_tool.py      BaseTool: the base class of a tool group
  *_tool.py         one tool group each: file, shell, text, utils, cron, workflow, browser
  catalog.py        ALL_TOOL_CLASSES, the list of tool group classes
  registry.py       ToolRegistry, cleanup_all_tools()
  consent.py        ConsentGate, ConsentRequest, parse_consent_reply(), format_consent_prompt()
  index.py          register_all_tools(), create_tool_registry(), build_workflow_client(),
                    get_all_tools(), get_tool_info()
```

A tool group is a `BaseTool` subclass. `get_definitions()` returns one JSON Schema definition per tool,
`get_implementations()` maps each tool name to the function that runs it, and `consent_required_for` names the
tools that need the user's approval. `cleanup()` releases what the group holds (the browser group closes its
browser).

## Built-in tools (30)

| Group (`name`) | Tools                                                                                                                          | Need consent |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| `file` (8)     | `read_file`, `list_directory`, `search_in_files`, `file_info`, `write_file`, `append_to_file`, `find_in_file`, `count_in_file` | all          |
| `shell` (1)    | `run_shell_command`                                                                                                            | all          |
| `text` (5)     | `word_count`, `find_and_replace`, `extract_emails`, `extract_urls`, `text_case_convert`                                        | none         |
| `utils` (4)    | `calculate`, `get_current_time`, `get_current_date`, `reverse_string`                                                          | none         |
| `cron` (3)     | `list_cron_schedules`, `add_cron_schedule`, `remove_cron_schedule`                                                             | all          |
| `workflow` (4) | `create_workflow`, `remove_workflow`, `list_workflows`, `get_workflow_templates`                                               | all          |
| `browser` (5)  | `browser_navigate`, `browser_get_text`, `browser_get_links`, `browser_click`, `browser_type`                                   | all          |

The browser group also defines `browser_screenshot`, but its implementation is not registered, so the AI never
gets it. Lists built from the definitions (the console's `/tools`, the tool counts in
`GET /api/admin/mcp-tools`) still include it, as 31 tools and a browser group of 6.

`run_shell_command` refuses commands containing a blocked pattern (`rm -rf`, `mkfs`, `dd if=`, `sudo rm`, and a
few more in `lib/services/shell/executor.py`) and stops a command after at most 30 seconds. The browser tools
drive one Playwright browser per tool registry (see `KNIK_BROWSER_*` in
[Environment Variables](../reference/environment-variables.md#browser-automation-playwright)). The cron and
workflow tools go through `schedule_service` and `workflow_service`, like the web routes (see
[Workflow Scheduler](scheduler.md)).

## How an app gets tools

Each app builds its own registry and hands it to the AI client factory:

```python
from imports import ClientSettings, build_client, create_tool_registry

registry = create_tool_registry(consent_gate=my_gate, disabled={"browser_navigate"})
client = build_client(ClientSettings(provider="vertex", model="gemini-2.5-flash"), tool_registry=registry)
```

- `create_tool_registry(consent_gate=..., disabled=...)` makes a `ToolRegistry`, attaches the consent gate if one
  is given, and calls `register_all_tools()`. That instantiates every class in `ALL_TOOL_CLASSES` and binds each
  definition to its implementation, leaving out the tool names in `disabled`. A group whose tools are all
  disabled is dropped, so it holds no resources.
- `build_client(settings, tool_registry=...)` (`lib/services/ai_client/factory.py`) is the one way to build an
  `AIClient`. The client knows the registry only through the `ToolProvider` protocol
  (`lib/services/ai_client/tool_provider.py`), so `lib/services` never imports `lib/tools`.
- The registry owns the tool instances it registered. `cleanup_tools()` cleans them up and revokes "yes all"
  approvals; `cleanup_all_tools()` does that for every live registry at app shutdown.

| App               | Registry                                                    | Consent gate                                           |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Console           | one, for the console's client                               | `ConsoleConsentGate` (`console/tools/consent_gate.py`) |
| Telegram bot      | one per user, so tool state never crosses users             | `BotConsentGate` (`bot/consent.py`)                    |
| Web backend       | one per conversation's client, without the disabled groups  | `WebConsentGate` (`backend/consent.py`)                |
| Workflow AI nodes | a fresh one per node run, when the node's `use_tools` is on | none: tools run without asking                         |

Workflow AI nodes get their client from `build_workflow_client(settings, use_tools)`, the factory the backend,
worker and console pass to `Scheduler(ai_client_factory=...)`. The node cleans up its client's tools when its call
ends. The workflows layer never imports `lib/tools`; without a factory, AI nodes run without tools.

## Consent

`ToolRegistry.execute_tool()` asks the registry's consent gate before it runs a tool listed in its group's
`consent_required_for`. A gate's `request_sync()` answers `"yes"` (this call), `"yes_all"` (this tool, until
the approvals are revoked) or `"no"`. On `"no"` the tool does not run and the model gets
`{"error": "Permission denied for <tool>"}` as its result. A registry without a gate runs every tool unasked.

- **Console:** prints `Allow <tool>(<args>)? [yes (y) / yes all (ya) / no]` and blocks on your answer.
- **Telegram bot:** sends `Allow <tool>(<args>)? Reply yes (y) / yes all (ya) / no` to the chat the user last
  wrote from and takes that user's next message there as the answer. No answer within 30 seconds, or anything
  that is not one of those replies, is a no. `/revoke` drops the user's "yes all" approvals.
- **Web backend:** web chats cannot ask yet, so `KNIK_WEB_TOOL_CONSENT` answers for every request: `deny` (the
  default, and what any other value means) refuses, `allow` runs the tool without asking anyone. The backend
  logs a warning at startup when it is `allow`. Workflows run through `POST /api/workflows/{id}/execute` are not
  covered by this setting.

## Switching tool groups off (web backend)

The admin API switches whole tool groups off for every web chat. The choice is stored in Postgres (`McpToolsDB`)
and applies from each conversation's next message on (cached clients are dropped). It does not affect the
console, the bot or workflow AI nodes.

```bash
curl http://localhost:8010/api/admin/mcp-tools
# {"tools": [{"name": "file", "category": "System", "count": 8, "enabled": true}, ...]}

curl -X PUT http://localhost:8010/api/admin/mcp-tools/browser \
  -H 'Content-Type: application/json' -d '{"enabled": false}'
# {"status": "success", "tool_name": "browser", "enabled": false}
```

## Adding a tool group

1. Create `src/lib/tools/<group>_tool.py`:

   ```python
   from lib.tools.base_tool import BaseTool


   MY_DEFINITIONS = [
       {
           "name": "shout",
           "description": "Upper-case a piece of text. Use when the user asks to shout something.",
           "parameters": {
               "type": "object",
               "properties": {"text": {"type": "string", "description": "The text to upper-case"}},
               "required": ["text"],
           },
       },
   ]


   class ShoutTool(BaseTool):
       # Tool names that need the user's approval; leave it out when none do.
       consent_required_for = frozenset()

       @property
       def name(self) -> str:
           return "shout"

       def get_definitions(self):
           return MY_DEFINITIONS

       def get_implementations(self):
           return {"shout": self._shout}

       @staticmethod
       def _shout(text: str) -> str:
           return text.upper()
   ```

2. Add the class to `ALL_TOOL_CLASSES` in `src/lib/tools/catalog.py`. Do not change `index.py`.
3. Add tests under `tests/lib/tools/`.

Parameter types map to Python types when the registry builds the LangChain tools: `string`, `integer`, `number`,
`boolean`, `object` and `array`. Any other type is treated as `string`, with a warning. Parameters not in
`required` are optional and default to `None`. If an implementation raises, the model gets `{"error": "<message>"}`
as the result.

## Debugging

- `/tools` in the console lists every built-in tool definition with its description.
- Logs show `Tool Input: <name>(<args>)` and `Tool Output: <name> -> <result>` for each call
  (`KNIK_SHOW_LOGS=true`, `KNIK_LOG_LEVEL=INFO`).
- Call an implementation directly, from `src/`:

  ```python
  from lib.tools.utils_tool import UtilsTool

  calculate = UtilsTool().get_implementations()["calculate"]
  print(calculate("2 + 2"))  # 4
  ```

## See also

- [Tool binding](../reference/mcp-langchain-pattern.md) - how the registry reaches the LLM
- [Workflow Scheduler](scheduler.md) - workflow AI nodes and the cron/workflow tools
- [Environment Variables](../reference/environment-variables.md) - `KNIK_WEB_TOOL_CONSENT`, `KNIK_BROWSER_*`
