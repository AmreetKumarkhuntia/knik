# Knik - AI Coding Agent Instructions

## Project Overview

Knik is a modular Text-to-Speech (TTS) system with an AI-powered voice console app. Built with Python, it features async audio processing, pluggable AI providers, and Model Context Protocol (MCP) tools for extending AI capabilities.

**Core Technologies:** Python 3.12+, Kokoro-82M TTS (82M parameters), Google Vertex AI/Gemini, Sounddevice/Soundfile, Threading

## Architecture

### Three-Layer Structure

1. **`src/lib/`** - Reusable library components (core, services, utils)
2. **`src/apps/`** - Applications built on the library (console app with MCP tools)
3. **`src/imports.py`** - Central import hub to avoid complex import paths

### Key Components

**TTSAsyncProcessor** (`src/lib/core/tts_async_processor.py`)
- Dual-thread architecture: text → audio conversion queue + audio playback queue
- Non-blocking voice output with `play_async(text)` method
- Critical: Use `is_processing_complete()` to check if playback finished before exiting
- Backed by `KokoroVoiceModel` (Kokoro-82M) and `AudioProcessor` (sounddevice)

**AIClient** (`src/lib/services/ai_client/client.py`)
- Unified interface supporting multiple providers via `ProviderRegistry`
- Auto-fallback to mock provider if real provider unconfigured
- Two query modes: `query()` (blocking) and `query_stream()` (generator)
- MCP tool integration via `MCPServerRegistry` and `register_tool()`

**ConsoleApp** (`src/apps/console/`)
- Interactive AI chat with voice responses and conversation history
- Modular architecture: `app.py` (main), `history.py` (context), `tools/` (commands)
- Built-in command system with registry pattern: `/voice`, `/history`, `/tools`, `/provider`, `/model`, `/debug`, etc.
- Integrates AIClient + TTSAsyncProcessor with smart wait system (blocks user input during playback)
- Debug mode support: Toggle with `/debug` to see verbose processing details (uses `print()` for user console output)

**Console Commands** (`src/apps/console/tools/`)
- Modular command handlers: Each command in separate `*_cmd.py` file
- Registry pattern in `index.py`: `get_command_registry()`, `register_commands()`
- Easy to extend: Create new `*_cmd.py`, add to registry, done
- 12 built-in commands: help, exit, clear, history, voice, info, toggle-voice, tools, agent, provider, model, debug

**MCP Tools System** (`src/lib/mcp/`)
- Clean separation: `definitions/` (JSON schemas) → `implementations/` (Python functions) → `index.py` (registry)
- 20 built-in tools across 4 categories:
  - **Utils** (5): calculate, get_current_time, extract_emails, extract_urls, generate_uuid
  - **Text** (5): count_words, reverse_text, to_uppercase, to_lowercase, extract_numbers
  - **Shell** (2): run_shell_command, get_environment_variable
  - **File Operations** (8): read_file (with line ranges), list_directory (recursive), search_in_files (multi-file), file_info (metadata), write_file, append_to_file, find_in_file (with context), count_in_file (pattern counting)
- Tools registered at app startup via `register_all_tools(ai_client)`
- Separate from console commands (MCP = AI tools, console commands = user commands)
- Test suite available: `demo/mcp/test_file_operations.py` (8 tests), `demo/mcp/TEST_PROMPTS.md` (14 scenarios)

## Critical Patterns

### Import Convention
**Always** import from `imports.py` when working in `src/` directory:
```python
from imports import AIClient, TTSAsyncProcessor, printer
```
Not `from lib.services.ai_client.client import AIClient`

### Registry Pattern (Provider & MCP)
- **ProviderRegistry**: Maps provider names to implementation classes (`vertex`, `mock`, etc.)
- **MCPServerRegistry**: Stores tool schemas + implementations as class attributes
- Both use class methods for global state management (no instances needed)

### Async TTS Workflow
```python
processor = TTSAsyncProcessor(sample_rate=24000, voice_model='af_sarah')
processor.start_async_processing()  # Starts background threads
processor.play_async("Text to speak")  # Non-blocking
while not processor.is_processing_complete():  # Wait for completion
    time.sleep(0.1)
```

### Adding Console Commands
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

### Adding MCP Tools
1. Define schema in `lib/mcp/definitions/category_defs.py` with JSON Schema format
2. Implement function in `lib/mcp/implementations/category_impl.py`
3. Export in `definitions/__init__.py` (`ALL_DEFINITIONS`) and `implementations/__init__.py` (`ALL_IMPLEMENTATIONS`)
4. No changes to `index.py` needed - auto-registered via dictionary lookup

### File Operations Implementation Pattern
The file operations tools (`file_impl.py`) demonstrate best practices:
- **Unified validation**: `_validate_path()` base function with thin wrappers for file/directory validation
- **Shared logic**: `_write_to_file()` handles both write and append with mode parameter
- **Combined processing**: `_process_file_lines()` supports both find and count operations
- **15 helper functions**: Each with single responsibility (validation, formatting, searching, counting)
- **Error handling**: Try/except with descriptive error messages in returned dicts
- **Resource efficiency**: Line range reading for large files, max_results limits for searches
- **Flexible search**: Regex support, case sensitivity options, context line extraction

### Coding Patterns

- Code should be self explanatory
- Avoid useless comments here and there. Keep comments when necessary
- Documentations should be simple and straight forward instead of complex
- Code should be structured with small modules as small as possible
- Use helper functions to break down complex logic
- Share common logic via unified base functions
- Return structured dicts with `success` flag and descriptive `error` messages

## Development Workflows

### Running the App
```bash
# Primary method (activates venv + sources .env)
npm run start:console

# Direct Python (must be in src/ directory)
python src/main.py --mode console

# Split pane with logs
npm run start:console:split
```

### Environment Setup
- **Required:** `espeak-ng` (install via `brew install espeak-ng` on macOS)
- **Optional:** Set `GOOGLE_CLOUD_PROJECT` for Vertex AI (falls back to mock provider)
- See `docs/ENVIRONMENT_VARIABLES.md` for voice/AI model configuration

### Testing
Demo files in `demo/` illustrate component usage:
- `demo/console/console_app_demo.py` - Full console app
- `demo/tts/async_demo.py` - Async TTS patterns
- `demo/ai/simple_ai_tts.py` - AI + voice integration

### Cache Management
Clean Python cache before debugging import issues:
```bash
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
```

## File Navigation

**Key directories to know:**
- `src/lib/services/ai_client/providers/` - AI provider implementations (vertex, langchain, mock)
- `src/lib/services/ai_client/registry/` - Registry pattern implementations
- `src/lib/mcp/` - MCP tool definitions and implementations (AI-callable tools)
- `src/apps/console/tools/` - Console command handlers (user-callable commands)
- `docs/` - Comprehensive documentation (MCP.md, CONSOLE.md, API.md, etc.)
- `demo/mcp/` - Test files for MCP tools (test_file_operations.py, TEST_PROMPTS.md)

**Entry points:**
- `src/main.py` - Application launcher
- `src/imports.py` - Central import hub
- `src/apps/console/app.py` - Console app main logic
- `src/apps/console/history.py` - ConversationHistory class
- `src/apps/console/tools/index.py` - Command registry
- `src/lib/mcp/index.py` - MCP tool registry

## Project-Specific Conventions

1. **Printer vs print:** Use `printer` for internal logging (`printer.info()`, `printer.success()`, `printer.error()`). Use regular `print()` for direct user output (e.g., debug mode)
2. **Voice names:** Female `af_*` (sarah, heart, bella) vs Male `am_*` (adam, michael, leo)
3. **Provider naming:** Always lowercase in registry (`vertex`, `mock`, not `Vertex`)
4. **Run from src/:** Most import paths assume `src/` as working directory
5. **Config classes:** Each app has a `Config` class reading from env vars with defaults (e.g., `ConsoleConfig`)
6. **Dynamic switching:** `/provider` and `/model` commands recreate AIClient to apply changes while preserving MCP tools and system instructions

## Common Pitfalls

- **Don't forget** `start_async_processing()` before `play_async()` - threads won't start
- **Mock provider confusion:** AIClient auto-switches to mock if Vertex AI unconfigured (check logs)
- **Import errors:** Run from `src/` directory, not project root
- **Blocking on TTS:** Always check `is_processing_complete()` or you'll exit before audio plays
- **MCP tool registration:** Must call `register_all_tools(ai_client)` before AI can use tools

## Documentation Map

- `docs/README.md` - Doc index and quick links
- `docs/MCP.md` - MCP tools architecture (100+ lines with examples)
- `docs/CONSOLE.md` - Console app commands and usage
- `docs/ENVIRONMENT_VARIABLES.md` - All config options
