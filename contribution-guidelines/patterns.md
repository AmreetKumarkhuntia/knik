# Patterns

## Import Convention

**Apps** (`backend`, `bot`, `worker`, `console`) import library names from `imports.py`:

```python
from imports import AIClient, TTSAsyncProcessor, printer
```

Never use deep paths like `from lib.services.ai_client.client import AIClient` in an app. `imports.py` is lazy: a name's module is imported on first access, so an app only loads what it uses. To expose a new name, add it to `_EXPORTS` and to the `TYPE_CHECKING` block (`tests/test_imports_hub.py` checks they match).

**Library code** under `src/lib/` imports its siblings directly and never imports `imports.py` or an app:

```python
from lib.utils.printer import printer
```

Apps never import each other. `npm run lint:imports` checks these rules.

## Registry Pattern (Providers & Tools)

- **ProviderRegistry**: Maps provider names to implementation classes. Use class methods - no instances needed.
- **MCPServerRegistry**: Holds tool schemas + implementations per instance. Each app creates one and fills it with `register_all_tools(registry)`, then passes it to `AIClient(mcp_registry=...)`.

## Async TTS Workflow

```python
processor = TTSAsyncProcessor(sample_rate=24000, voice_model='af_sarah')
processor.start_async_processing()  # Start background threads first
processor.play_async("Text to speak")  # Non-blocking
while not processor.is_processing_complete():  # Wait before exiting
    time.sleep(0.1)
```

## Adding Console Commands

There are two kinds of console commands with different patterns:

### Shared commands (model, provider, sessions, new, resume, status, help)

These delegate to `CommandService` from `lib/commands/`. Add a handler in `src/console/commands/handlers.py` (and `src/bot/commands/handlers.py` for the bot):

```python
def handle_my_cmd(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return asyncio.run(command_service.some_operation(user_id, args))
```

Register in `src/console/commands/__init__.py`:

```python
registry.register("my-cmd", "Description of command", handle_my_cmd)
```

### Console-only commands (exit, clear, history, voice, etc.)

These interact with app state directly. Create a handler in `src/console/tools/my_cmd.py`:

```python
def my_command(app, args: str) -> str:
    return f"Result: {args}"
```

Register in `tools/index.py`:

```python
from .my_cmd import my_command
# Add to get_command_registry() dict: 'my': my_command
```

Use with: `/my argument`

## Adding Tools

Tools live in `src/lib/tools/`, one `*_tool.py` per tool group:

```python
from lib.services.ai_client.base_tool import BaseTool

MY_DEFINITIONS = [
    {
        "name": "my_tool",
        "description": "When the AI should use this",
        "parameters": {"type": "object", "properties": {"text": {"type": "string"}}, "required": ["text"]},
    },
]


class MyTool(BaseTool):
    @property
    def name(self) -> str:
        return "my"

    def get_definitions(self):
        return MY_DEFINITIONS

    def get_implementations(self):
        return {"my_tool": self._my_tool}

    @staticmethod
    def _my_tool(text: str) -> str:
        return text.upper()
```

1. Create `lib/tools/my_tool.py` with the definitions (JSON Schema) and a `BaseTool` subclass
2. Add the class to `ALL_TOOL_CLASSES` in `lib/tools/catalog.py`
3. List tool names that need user approval in the class's `consent_required_for`
4. No changes to `index.py` needed - `register_all_tools()` binds every definition to its implementation
5. Add tests in `tests/lib/tools/`

## Coding Style

- Write self-explanatory code
- **Remove** comments/docstrings that restate what the code does. **Keep only** comments that explain why a decision was made, or document non-obvious constraints (error conditions, side effects, design rationale)
- Module-level one-liner docstrings are fine. Remove class/method docstrings that just paraphrase the name
- Keep documentation simple and straightforward
- Prefer small modules, helper functions, and shared logic via unified base functions
- Return structured dicts with a `success` flag and descriptive `error` messages
- Use `printer` for internal logging (`printer.info()`, `printer.success()`, `printer.error()`). Use `print()` for direct user output
