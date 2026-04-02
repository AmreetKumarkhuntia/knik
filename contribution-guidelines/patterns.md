# Patterns

## Import Convention

**Always** import from `imports.py` when working in `src/`:

```python
from imports import AIClient, TTSAsyncProcessor, printer
```

Never use deep paths like `from lib.services.ai_client.client import AIClient`.

## Registry Pattern (Providers & MCP)

- **ProviderRegistry**: Maps provider names to implementation classes. Use class methods - no instances needed.
- **MCPServerRegistry**: Stores tool schemas + implementations as class attributes. Use class methods - no instances needed.

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

These delegate to `CommandService` from `lib/commands/`. Add a handler in `src/apps/console/commands/handlers.py`:

```python
def handle_my_cmd(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return asyncio.run(command_service.some_operation(user_id, args))
```

Register in `src/apps/console/commands/__init__.py`:

```python
registry.register("my-cmd", "Description of command", handle_my_cmd)
```

### Console-only commands (exit, clear, history, voice, etc.)

These interact with app state directly. Create a handler in `src/apps/console/tools/my_cmd.py`:

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

## Adding MCP Tools

1. Define schema in `lib/mcp/definitions/category_defs.py` using JSON Schema format
2. Implement function in `lib/mcp/implementations/category_impl.py`
3. Export in `definitions/__init__.py` (`ALL_DEFINITIONS`) and `implementations/__init__.py` (`ALL_IMPLEMENTATIONS`)
4. No changes to `index.py` needed - auto-registered via dictionary lookup

## Coding Style

- Write self-explanatory code
- **Remove** comments/docstrings that restate what the code does. **Keep only** comments that explain why a decision was made, or document non-obvious constraints (error conditions, side effects, design rationale)
- Module-level one-liner docstrings are fine. Remove class/method docstrings that just paraphrase the name
- Keep documentation simple and straightforward
- Prefer small modules, helper functions, and shared logic via unified base functions
- Return structured dicts with a `success` flag and descriptive `error` messages
- Always add `text_color` to CustomTkinter buttons for visibility across themes
- Store widget references as instance variables (`self.*`) when you need to update them later
- Use `printer` for internal logging (`printer.info()`, `printer.success()`, `printer.error()`). Use `print()` for direct user output
