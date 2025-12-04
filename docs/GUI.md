# GUI Application Guide

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

- **Chat Panel**: Scrollable conversation history with user and assistant messages
- **Input Panel**: Text entry with Send button and voice input button (STT coming in Phase 2)
- **Top Bar**: Settings, Clear chat, and status indicator
- **Real-time Streaming**: See AI responses as they're generated
- **Voice Output**: Hear responses with high-quality TTS

### Settings Panel

Access via the ⚙️ Settings button in the top bar:

- **AI Provider**: Switch between Vertex AI, Mock
- **AI Model**: Choose from gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash
- **Temperature**: Adjust AI creativity (0.0 - 2.0)
- **Voice Output**: Toggle voice on/off
- **Voice Selection**: Choose from 6 voices (3 male, 3 female)
- **Theme**: Switch between Dark, Light, System

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
