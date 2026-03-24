# GUI Application Guide

The Knik GUI application provides a modern desktop interface for interacting with the AI assistant.

## Quick Start

```bash
# Using npm (recommended)
npm run start:gui

# Or directly with Python
python src/main.py --mode gui
```

**Prerequisites:** `pip install customtkinter>=5.2.0 Pillow>=10.0.0`

## Features

### Main Interface

- **Chat Panel**: Scrollable conversation history with messenger-style bubbles
  - User messages: Right-aligned purple bubbles
  - AI messages: Left-aligned gray bubbles with Knik badge
  - System messages: Centered subtle style for tool execution feedback
- **Input Panel**: Text entry with Send button and Enter key support
- **Top Bar**: Settings, Clear chat, and status indicator
- **Real-time Streaming**: See AI responses as they're generated
- **Voice Output**: Hear responses with high-quality TTS (Kokoro-82M)
- **Dynamic Theming**: Light/Dark/System modes with full UI refresh
- **Conversation History**: Maintains last N messages (configurable via `KNIK_HISTORY_CONTEXT_SIZE`)
- **MCP Tool Integration**: AI can execute 31 tools across 7 categories with visual feedback

### Settings Panel

Access via the Settings button in the top bar:

- **AI Provider**: Switch between vertex, gemini, zhipuai, zai, custom, mock
- **AI Model**: Choose from available models (gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro, glm-5, etc.)
- **Temperature**: Adjust AI creativity (0.0 - 2.0)
- **Voice Output**: Toggle voice on/off
- **Voice Selection**: Choose from 9 voices (5 female, 4 male)
- **Theme**: Switch between Dark, Light, System

### Theme System

- **ColorTheme** - Dynamic theme class that switches between modes at runtime
  - `set_mode(mode)` - Updates all 26 color attributes ("light", "dark", or "system")
  - `get_mode()` - Returns current theme mode
- **DarkTheme** - Dark color palette (black backgrounds, white text, vibrant accents)
- **LightTheme** - Light color palette (white backgrounds, black text, subtle accents)

Color categories: Backgrounds, Message Bubbles, Text, Buttons, Status, Borders

### Keyboard Shortcuts

- **Enter**: Send message

## Components

1. **ChatPanel** (`components/chat_panel.py`) - Scrollable canvas with messenger-style bubbles. `refresh_theme()` rebuilds all messages with new theme colors.
2. **InputPanel** (`components/input_panel.py`) - Text entry with rounded corners (25px radius), theme-aware colors.
3. **SettingsPanel** (`components/settings_panel.py`) - Configuration modal with provider/model/voice/theme selection. Triggers full UI refresh on save.
4. **GradientBackground** (`components/gradient_background.py`) - Canvas-based animated gradient with GPU-accelerated rendering.

## Troubleshooting

### GUI doesn't start

```bash
pip install customtkinter>=5.2.0 Pillow>=10.0.0
```

### Voice not working

1. Check Settings - Voice Output is enabled
2. Verify espeak-ng is installed: `brew install espeak-ng`
3. Check your system audio output

### AI not responding

1. Check your AI provider configuration (see [Environment Variables](../reference/environment-variables.md))
2. Try switching to Mock provider in Settings
3. Check the terminal for error messages

## Related Docs

- [Console App](console.md) - Terminal-based alternative
- [Web App](web-app.md) - Browser-based interface
- [MCP Tools](mcp.md) - Available AI tools
- [API Reference](../reference/api.md) - Developer API reference
- [Environment Variables](../reference/environment-variables.md) - Configuration options
