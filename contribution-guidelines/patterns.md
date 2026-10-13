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
- **ToolRegistry** (`lib/tools/registry.py`): Holds tool schemas + implementations per instance. Each app builds one with `create_tool_registry(consent_gate=..., disabled=...)` and passes it to `build_client(settings, tool_registry=...)`.

## Async TTS Workflow

```python
processor = TTSAsyncProcessor(sample_rate=24000)  # voice_model is accepted but not applied yet
processor.start_async_processing()  # Start background threads first
processor.play_async("Text to speak")  # Non-blocking
while not processor.is_processing_complete():  # Wait before exiting
    time.sleep(0.1)
```

## Adding Console Commands

There are two kinds of console commands with different patterns:

### Shared commands (model, provider, sessions, new, resume, status)

These delegate to `CommandService` and live in `src/lib/commands/handlers.py`, so the console and the bot both get them. `/help` is not shared: each app words it for its own commands. An app can replace a shared command by registering the same name after `register_shared_commands()`; the bot does this for `/new` (its welcome text and tool cleanup), so a change to the shared `/new` also needs `src/bot/commands/handlers.py`. Add an async handler and an entry in `SHARED_COMMANDS`:

```python
async def handle_my_cmd(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return await command_service.some_operation(user_id, args)


SHARED_COMMANDS = (
    ...,
    ("my-cmd", "Description of command", handle_my_cmd),
)
```

A command only one app has goes in `src/console/commands/handlers.py` or `src/bot/commands/handlers.py` and is registered in that package's `create_command_system()`.

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
from lib.tools.base_tool import BaseTool

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
- AI tool implementations return structured dicts with a `success` flag and descriptive `error` messages
- `workflow_service` and `schedule_service` raise `NotFoundError`/`ValidationError` (`lib/workflows/errors.py`) instead of returning error dicts; routes map them to 404/400, and tools return `e.to_dict()`
- Use `printer` for internal logging (`printer.info()`, `printer.success()`, `printer.error()`). Use `print()` for direct user output
