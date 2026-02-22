# GUI Application Guide

**Last Updated:** February 22, 2026

The Knik GUI application provides a modern desktop interface for interacting with your AI assistant.

## 🚀 Quick Start

### Installation

1. **Install dependencies:**
```bash
# Make sure you have the GUI dependencies
pip install customtkinter>=5.2.0 Pillow>=10.0.0
```

2. **Run the GUI:**
```bash
# Using npm
npm run start

# Or directly with Python
python src/main.py --mode gui
```

## 🎨 Features

### Main Interface

- **Chat Panel**: Scrollable conversation history with messenger-style bubbles
  - User messages: Right-aligned purple bubbles
  - AI messages: Left-aligned gray bubbles with "🤖 Knik" badge
  - System messages: Centered subtle style for tool execution feedback
- **Animated Gradient Background**: Smooth color transitions with GPU-accelerated rendering
- **Input Panel**: Text entry with Send button
- **Top Bar**: Settings, Clear chat, and status indicator
- **Real-time Streaming**: See AI responses as they're generated
- **Voice Output**: Hear responses with high-quality TTS
- **Dynamic Theming**: Full theme refresh support for all UI components
- **Conversation History**: Maintains context with last N messages sent to AI
- **MCP Tool Integration**: AI can execute 20+ tools with visual feedback in chat

### Settings Panel

Access via the ⚙️ Settings button in the top bar:

- **AI Provider**: Switch between Vertex AI, Mock
- **AI Model**: Choose from gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash
- **Temperature**: Adjust AI creativity (0.0 - 2.0)
- **Voice Output**: Toggle voice on/off
- **Voice Selection**: Choose from 6 voices (3 male, 3 female)
- **Theme**: Switch between Dark, Light, System

### Theme System

The GUI features a sophisticated dynamic theme system:

#### **Theme Classes**

- **ColorTheme** - Dynamic theme class that switches between modes at runtime
  - `set_mode(mode)` - Updates all 26 color attributes ("light", "dark", or "system")
  - `get_mode()` - Returns current theme mode
- **DarkTheme** - Dark color palette (black backgrounds, white text, vibrant accents)
- **LightTheme** - Light color palette (white backgrounds, black text, subtle accents)

#### **Color Categories (26 attributes)**

- **Backgrounds**: Main window, top bar, chat panel, input panel
- **Message Bubbles**: User bubbles, AI bubbles, system messages
- **Text Colors**: Primary, secondary, user text, AI text
- **Buttons**: Settings, clear, send, voice (with hover states)
- **Status Colors**: Ready (green), thinking (orange), speaking (blue), error (red)
- **Borders**: Panel borders and separators

#### **Theme Refresh Pattern**

When theme changes, all UI components update automatically:

```python
# User changes theme in settings
ColorTheme.set_mode("light")  # or "dark" or "system"
self._refresh_theme()  # Updates all widgets

# _refresh_theme() rebuilds:
# - Main window background
# - Top bar with new colors
# - All buttons (Settings, Clear, Send)
# - Input panel background and text entry
# - Chat panel background + all message bubbles
# - Status label colors
```

### Animated Gradient Background

GPU-accelerated gradient animation:

- Smooth color transitions between multiple gradient stops
- Canvas-based rendering for 60fps performance
- Configurable animation speed and color palette
- Automatic resize handling
- Implemented in `GradientBackground` component

### Conversation History Integration

- Maintains last N messages (default: 5, configurable via `KNIK_HISTORY_CONTEXT_SIZE`)
- Messages sent to AI in LangChain format (HumanMessage, AIMessage)
- Improves AI responses by providing conversation context
- Shared `ConversationHistory` class used by both Console and GUI apps

### MCP Tools Support

- AI automatically uses 20+ built-in tools when needed
- Visual feedback in chat (system messages show tool execution)
- Categories: Utils (6), Text (5), Shell (1), File (8)
- See [MCP.md](./MCP.md) for complete tool documentation

### Keyboard Shortcuts

- **Enter**: Send message
- **Escape**: (Future) Cancel current operation

## 🎯 Usage Examples

### Basic Conversation

1. Type your question in the input field
2. Press Enter or click Send
3. Watch the response stream in real-time
4. Hear the voice output (if enabled)

### Using MCP Tools

The AI automatically uses tools when needed:

```
You: What's 15 * 8 + 20?
AI: Let me calculate that for you... The result is 140.

You: List files in the current directory
AI: [Uses list_directory tool and shows results]

You: Read the README.md file
AI: [Uses read_file tool and summarizes content]
```

### Changing Settings

1. Click ⚙️ Settings in the top bar
2. Adjust your preferences:
   - Switch to gemini-1.5-flash for faster responses
   - Toggle voice output if you prefer silent mode
   - Change theme to light mode
   - Adjust temperature for more creative responses
3. Click Save

The AI client will be reinitialized with your new settings.

### Clearing Chat

- Click 🗑️ Clear to start fresh
- This clears both the visual chat and conversation history

## 🎨 Appearance

### Components

The GUI app consists of four main components:

1. **ChatPanel** (`components/chat_panel.py`) - Message display
   - Scrollable canvas with messenger-style bubbles
   - Theme-aware colors that update on theme change
   - `refresh_theme()` method rebuilds all messages with new theme
   
2. **InputPanel** (`components/input_panel.py`) - Text entry
   - Modern rounded corners (25px radius)
   - Theme-aware colors for input field and buttons
   - Enter key support for quick sending
   
3. **SettingsPanel** (`components/settings_panel.py`) - Configuration modal
   - AI provider and model selection
   - Temperature slider (0.0-2.0)
   - Voice settings (enable/disable, voice selection)
   - Theme selection (dark, light, system)
   - Triggers full UI refresh on save
   
4. **GradientBackground** (`components/gradient_background.py`) - Animated background
   - Canvas-based gradient rendering
   - Smooth color transitions
   - GPU-accelerated for performance

### Themes

- **Dark Mode**: Default, easy on the eyes
- **Light Mode**: Bright and clear
- **System**: Follows your OS theme

### Colors

- **User messages**: Blue-gray background
- **Assistant messages**: Slightly different blue
- **Status indicator**: 
  - 🟢 Green = Ready
  - 🟠 Orange = Thinking
  - 🔵 Blue = Speaking
  - 🔴 Red = Error

## 🔧 Troubleshooting

### GUI doesn't start

**Error: `Import "customtkinter" could not be resolved`**

Solution:
```bash
pip install customtkinter>=5.2.0 Pillow>=10.0.0
```

### Voice not working

1. Check Settings → Voice Output is enabled
2. Verify espeak-ng is installed: `brew install espeak-ng`
3. Check your system audio output

### AI not responding

1. Check your `GOOGLE_CLOUD_PROJECT` environment variable
2. Try switching to Mock provider in Settings
3. Check the terminal/console for error messages

### Window too small/large

- Resize the window manually
- Minimum size: 800x600
- Default size: 1200x800

## 🎯 Tips & Tricks

### Performance

- Use gemini-1.5-flash for faster responses
- Use gemini-1.5-pro for better quality
- Lower temperature (0.3-0.5) for consistent responses
- Higher temperature (0.8-1.5) for creative responses

### Best Practices

- Clear chat periodically to manage context
- Use specific questions for better AI responses
- Check Settings if behavior changes
- Watch the status indicator to know when AI is working

### Future Features (Coming Soon)

- 🎤 Voice input with hotword detection ("Hey Jarvis")
- 📊 Voice visualization waveform
- 📝 Quick notes sidebar
- 🔍 Command palette (Cmd+K)
- 📈 System monitor widget
- 🔔 Notification center

## 📚 Related Docs

- [ROADMAP.md](./ROADMAP.md) - Future development plans
- [CONSOLE.md](./CONSOLE.md) - Console app commands
- [MCP.md](./MCP.md) - Available tools
- [API.md](./API.md) - Developer API reference

## 🆚 GUI vs Console

| Feature | GUI | Console |
|---------|-----|---------|
| Interface | Desktop window | Terminal |
| Easy to use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Settings | Visual panel | Commands |
| History | Visual scroll | `/history` command |
| Voice control | Button (future) | Always on |
| Multitasking | Background window | Blocks terminal |

Choose GUI for:
- Better visual experience
- Easy settings management
- Multitasking
- Non-technical users

Choose Console for:
- SSH/remote sessions
- Server environments
- Scripting/automation
- Minimal resource usage

---

**Questions?** Check the [main README](../README.md) or open an issue!
