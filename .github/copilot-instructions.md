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

**ConsoleApp** (`src/apps/console/app.py`)
- Interactive AI chat with voice responses and conversation history
- Built-in command system: `/voice`, `/history`, `/tools`, `/toggle-voice`, etc.
- Integrates AIClient + TTSAsyncProcessor with smart wait system (blocks user input during playback)

**MCP Tools System** (`src/apps/console/mcp/`)
- Clean separation: `definitions/` (JSON schemas) → `implementations/` (Python functions) → `index.py` (registry)
- 11 built-in tools: calculate, text processing, time/date, email/URL extraction
- Tools registered at app startup via `register_all_tools(ai_client)`

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

### Adding MCP Tools
1. Define schema in `definitions/category_defs.py` with JSON Schema format
2. Implement function in `implementations/category_impl.py`
3. Export in `definitions/__init__.py` (`ALL_DEFINITIONS`) and `implementations/__init__.py` (`ALL_IMPLEMENTATIONS`)
4. No changes to `index.py` needed - auto-registered via dictionary lookup

### Coding Patterns

- Code should be self explanatory
- Avoid useless comments here and there. Keep comments when necessary
- Documentations should be simple and straight forward instead of complex
- Code should be structured with small modules as small as possible

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
- `src/apps/console/mcp/` - MCP tool definitions and implementations
- `docs/` - Comprehensive documentation (MCP.md, CONSOLE.md, API.md, etc.)

**Entry points:**
- `src/main.py` - Application launcher
- `src/imports.py` - Central import hub
- `src/apps/console/app.py` - Console app logic

## Project-Specific Conventions

1. **Printer instead of print/logging:** Use `from imports import printer` then `printer.info()`, `printer.success()`, `printer.error()`
2. **Voice names:** Female `af_*` (sarah, heart, bella) vs Male `am_*` (adam, michael, leo)
3. **Provider naming:** Always lowercase in registry (`vertex`, `mock`, not `Vertex`)
4. **Run from src/:** Most import paths assume `src/` as working directory
5. **Config classes:** Each app has a `Config` class reading from env vars with defaults (e.g., `ConsoleConfig`)

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
- `docs/apps/console/MCP_IMPLEMENTATION.md` - Adding new MCP tools
