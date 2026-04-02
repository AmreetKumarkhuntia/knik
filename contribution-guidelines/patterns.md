# Patterns

## Import Convention

**Always** import from `imports.py` when working in `src/` directory:

```python
from imports import AIClient, TTSAsyncProcessor, printer
```

Not `from lib.services.ai_client.client import AIClient`

## Registry Pattern (Provider & MCP)

- **ProviderRegistry**: Maps provider names to implementation classes (6 providers)
- **MCPServerRegistry**: Stores tool schemas + implementations as class attributes
- Both use class methods for global state management (no instances needed)

## Async TTS Workflow

```python
processor = TTSAsyncProcessor(sample_rate=24000, voice_model='af_sarah')
processor.start_async_processing()  # Starts background threads
processor.play_async("Text to speak")  # Non-blocking
while not processor.is_processing_complete():  # Wait for completion
    time.sleep(0.1)
```

## Adding Console Commands

1. Create handler in `src/apps/console/tools/my_cmd.py`:
   ```python
   def my_command(app, args: str) -> str:
       return f"Result: {args}"
   ```
2. Add to registry in `tools/index.py`:
   ```python
   from .my_cmd import my_command
   # Add to get_command_registry() dict: 'my': my_command
   ```
3. Use with: `/my argument`

## Adding MCP Tools

1. Define schema in `lib/mcp/definitions/category_defs.py` with JSON Schema format
2. Implement function in `lib/mcp/implementations/category_impl.py`
3. Export in `definitions/__init__.py` (`ALL_DEFINITIONS`) and `implementations/__init__.py` (`ALL_IMPLEMENTATIONS`)
4. No changes to `index.py` needed - auto-registered via dictionary lookup

## Coding Patterns

- Code should be self-explanatory
- Comments/docstrings policy: remove comments that merely restate **what** the code does (the code already says that). Keep only comments/docstrings that explain **why** a decision was made, or document non-obvious constraints (e.g., error conditions, side effects, design rationale)
- Module-level docstrings (one-liners) are fine. Class/method docstrings that just paraphrase the name should be removed
- Documentation should be simple and straightforward
- Small modules, helper functions, shared logic via unified base functions
- Return structured dicts with `success` flag and descriptive `error` messages
- Always add `text_color` to CustomTkinter buttons for visibility across themes
- Store widget references as instance variables (self.*) when needing to update them later
- Use `printer` for internal logging (`printer.info()`, `printer.success()`, `printer.error()`), regular `print()` for direct user output
