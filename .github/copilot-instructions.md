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

**GUIApp** (`src/apps/gui/`)
- Desktop GUI built with CustomTkinter featuring modern messenger-style chat interface
- Modular architecture: `app.py` (main), `config.py`, `theme.py` (theming), `components/` (UI widgets)
- Three main components: ChatPanel (messages), InputPanel (text entry + buttons), SettingsPanel (configuration)
- Dynamic theme switching: Light/Dark/System modes with full UI refresh
- Conversation history integration: Passes last N messages to AI for context
- Voice toggle: Enable/disable TTS output via settings
- MCP tool integration: AI can execute 20+ tools with visual feedback in chat

**Console Commands** (`src/apps/console/tools/`)
- Modular command handlers: Each command in separate `*_cmd.py` file
- Registry pattern in `index.py`: `get_command_registry()`, `register_commands()`
- Easy to extend: Create new `*_cmd.py`, add to registry, done
- 12 built-in commands: help, exit, clear, history, voice, info, toggle-voice, tools, agent, provider, model, debug

**GUI Components** (`src/apps/gui/components/`)
- **ChatPanel** (`chat_panel.py`): Scrollable message display with messenger-style bubbles
  - User messages: Right-aligned purple bubbles
  - AI messages: Left-aligned gray bubbles with "🤖 Knik" badge
  - System messages: Centered subtle style for tool execution feedback
  - `refresh_theme()` method rebuilds all messages with new theme colors
- **InputPanel** (`input_panel.py`): Text entry with Send and Voice buttons
  - Modern rounded corners (25px radius)
  - Theme-aware colors for input field and buttons
  - Enter key support for quick sending
- **SettingsPanel** (`settings_panel.py`): Configuration modal dialog
  - AI Provider selection (vertex, mock)
  - Model selection (gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash)
  - Temperature slider (0.0-2.0)
  - Voice settings (enable/disable, voice selection)
  - Theme selection (dark, light, system)
  - Triggers full UI refresh on save

**Theme System** (`src/apps/gui/theme.py`)
- **DarkTheme**: Dark color palette (black backgrounds, white text, vibrant accents)
- **LightTheme**: Light color palette (white backgrounds, black text, subtle accents)
- **ColorTheme**: Dynamic theme class that switches between light/dark modes
  - `set_mode(mode)` method updates all 26 color attributes at runtime
  - `get_mode()` returns current theme ("light" or "dark")
  - Color categories: Backgrounds, Message Bubbles, Text, Buttons, Status, Borders
- **Fonts**: Font size constants with helper methods (title, message, input, button, badge)
- **Spacing**: Padding, margin, and size constants for consistent layout

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

### GUI Theme Refresh Pattern
```python
# When theme changes, update ColorTheme and refresh all UI
ColorTheme.set_mode("light")  # or "dark" or "system"
self._refresh_theme()  # Updates all widgets with new colors

# _refresh_theme() updates:
# - Main window background
# - Top bar and title
# - All buttons (Settings, Clear, Send, Voice)
# - Input panel (background, text entry, buttons)
# - Chat panel (background + all messages)
# - Status label
```

### Coding Patterns

- Code should be self explanatory
- Avoid useless comments here and there. Keep comments when necessary
- Documentations should be simple and straight forward instead of complex
- Code should be structured with small modules as small as possible
- Use helper functions to break down complex logic
- Share common logic via unified base functions
- Return structured dicts with `success` flag and descriptive `error` messages
- Always add `text_color` to CustomTkinter buttons for visibility across themes
- Store widget references as instance variables (self.*) when need to update them later

## Development Workflows

### Running the App
```bash
# GUI mode (recommended for visual interface)
npm run start:gui

# Console mode (terminal-based chat)
npm run start:console

# Split pane with logs
npm run start:console:split

# Direct Python (must be in src/ directory)
python src/main.py --mode gui
python src/main.py --mode console
```

### Code Quality
```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
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
- `src/main.py` - Application launcher (supports --mode gui/console)
- `src/imports.py` - Central import hub
- `src/apps/console/app.py` - Console app main logic
- `src/apps/gui/app.py` - GUI app main logic
- `src/apps/console/history.py` - ConversationHistory class (shared by both apps)
- `src/apps/console/tools/index.py` - Command registry
- `src/apps/gui/theme.py` - Theme system (ColorTheme, DarkTheme, LightTheme)
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

### User Documentation
- `docs/README.md` - Doc index and quick links
- `docs/ROADMAP.md` - **Development roadmap: what's built, what's planned, and how to extend Knik into a JARVIS-like assistant**
- `docs/MCP.md` - MCP tools architecture (100+ lines with examples)
- `docs/CONSOLE.md` - Console app commands and usage
- `docs/GUI.md` - GUI app architecture and components
- `docs/CONVERSATION_HISTORY.md` - Conversation memory system implementation
- `docs/ENVIRONMENT_VARIABLES.md` - All config options

### AI/Copilot Context
- `.github/copilot/SESSION_SUMMARY.md` - **Last session details, what was accomplished, next steps**
- `.github/copilot/QUICK_START.md` - **Quick reference for starting new sessions**
- `.github/copilot-instructions.md` - **This file - comprehensive project guide for AI assistants**

## Recent Major Updates (December 2025)

### Dynamic Theme System
- Implemented full light/dark theme switching in GUI app
- Created centralized theme system with ColorTheme, DarkTheme, LightTheme classes
- Theme changes update all UI components in real-time (top bar, buttons, input panel, chat messages)
- 26 color attributes dynamically switch between light and dark palettes
- All buttons have proper text_color for visibility in both themes

### Conversation History
- Both console and GUI apps now maintain conversation context
- Last N messages (configurable via KNIK_HISTORY_CONTEXT_SIZE, default: 5) sent to AI
- Uses LangChain message format (HumanMessage, AIMessage)
- Improves AI responses by providing conversation context
- Implemented in shared ConversationHistory class

### Code Quality Improvements
- Fixed 110+ linting issues (trailing whitespace, formatting)
- All code formatted with ruff
- Consistent code style across entire codebase
- All lint checks passing

### Bug Fixes
- Fixed tool_callback parameter warning in ChatVertexAI
- Fixed button text visibility issues in light theme
- Fixed emoji rendering issues in GUI buttons
- Proper widget reference storage for theme updates
