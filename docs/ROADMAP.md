# Knik Development Roadmap

**Last Updated:** December 6, 2025

This document tracks what we've built and what's planned for Knik - our journey toward a JARVIS-like AI assistant.

## 🔄 **MAJOR UPDATE: Web App Complete!**

**Decision:** Migrated from CustomTkinter to **React + FastAPI + Tailwind CSS** for professional web interface with smooth 60fps animations.

**Status:** ✅ **Web app implementation complete!** (Todos 1-6 of 9)

- ✅ **Backend:** FastAPI with unified chat endpoint, config system, admin/history APIs
- ✅ **Frontend:** React + TypeScript + Vite with smooth animations
- ✅ **Scripts:** Organized startup scripts with .env loading
- ✅ **Documentation:** Comprehensive WEB_APP.md guide

**Next:** Electron integration for desktop packaging (Todos 7-9)

**See:** `docs/WEB_APP.md` for complete architecture and usage guide.

---

## 📊 Current State

### ✅ What We Have Built

#### **Core TTS System**

- High-quality text-to-speech with Kokoro-82M (82M parameters)
- 6 voices: 3 male (`am_adam`, `am_michael`, `am_leo`), 3 female (`af_sarah`, `af_heart`, `af_bella`)
- Async audio processing with dual-thread architecture
- Real-time streaming playback
- WAV file export capability
- Multi-language support

#### **AI Integration**

- Unified `AIClient` supporting multiple providers via registry pattern
- Provider support:
  - ✅ Google Vertex AI / Gemini (gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash)
  - ✅ LangChain integration
  - ✅ Mock provider for testing
- Streaming responses with `query_stream()` and `chat_with_agent_stream()`
- Dynamic provider and model switching at runtime
- Function calling with tool integration
- Configurable system instructions for AI personality

#### **MCP Tools System (20 Tools)**

Model Context Protocol tools that extend AI capabilities:

**Utils (5 tools)**

- `calculate` - Math expressions
- `get_current_time` - Current timestamp
- `extract_emails` - Email extraction from text
- `extract_urls` - URL extraction from text
- `generate_uuid` - UUID generation

**Text Processing (5 tools)**

- `count_words` - Word count statistics
- `reverse_text` - Reverse strings
- `to_uppercase` - Convert to uppercase
- `to_lowercase` - Convert to lowercase
- `extract_numbers` - Extract numbers from text

**Shell Operations (2 tools)**

- `run_shell_command` - Execute shell commands safely
- `get_environment_variable` - Read env vars

**File Operations (8 tools)**

- `read_file` - Read file contents (with line ranges)
- `list_directory` - List files/directories (recursive)
- `search_in_files` - Multi-file pattern search (text/regex)
- `file_info` - File/directory metadata
- `write_file` - Write content to file
- `append_to_file` - Append to existing file
- `find_in_file` - Search within specific file
- `count_in_file` - Count pattern occurrences

#### **Console Application**

Interactive AI chat with voice responses:

- 12 built-in commands: `/help`, `/exit`, `/clear`, `/history`, `/voice`, `/info`, `/toggle-voice`, `/tools`, `/agent`, `/provider`, `/model`, `/debug`
- Conversation history tracking with context (configurable size)
- Command registry pattern for easy extensibility
- Debug mode for verbose logging
- Smart wait system (blocks input during voice playback)

#### **Architecture**

- Three-layer structure: `lib/` (reusable), `apps/` (applications), `imports.py` (import hub)
- Registry pattern for providers and MCP tools
- Modular, extensible design
- Clean separation of concerns

---

## 🎯 What We Can Build Next

### Phase 1: Desktop UI Foundation (2-3 weeks)

**Goal:** Transform console app into native desktop application

#### **UI Framework Selection**

**Primary Recommendation: CustomTkinter**

```python
# Lightweight, modern, great themes
pip install customtkinter>=5.2.0
```

**Alternative: PyQt6** (if need more features)

```python
# Professional, feature-rich
pip install PyQt6>=6.6.0 PyQt6-WebEngine>=6.6.0
```

#### **UI Components to Build**

```
src/apps/gui/
├── __init__.py
├── app.py                  # Main GUI application
├── config.py              # GUI-specific configuration
├── components/
│   ├── __init__.py
│   ├── chat_panel.py      # Chat history with markdown
│   ├── input_panel.py     # Text/voice input area
│   ├── voice_viz.py       # Audio waveform visualization
│   ├── status_bar.py      # System status indicators
│   ├── settings_panel.py  # Settings & configuration
│   ├── command_palette.py # Quick command access (Cmd+K)
│   └── sidebar.py         # Navigation & tools
└── themes/
    ├── __init__.py
    ├── dark_theme.py      # Dark mode
    └── light_theme.py     # Light mode
```

#### **Features**

- 💬 Rich chat interface with markdown rendering
- 🎙️ Voice visualization during listening/speaking
- ⚙️ Settings panel (API keys, voice, model selection)
- 🔍 Command palette for quick actions
- 📊 System monitor widget (CPU, RAM, battery)
- 🌓 Dark/Light theme toggle
- 🔔 Notification center
- 📝 Quick notes sidebar
- 🎨 Customizable layout

**Deliverables:**

- Basic GUI shell with CustomTkinter
- Chat panel with conversation history
- Input panel with send button
- Integration with existing ConsoleApp logic
- Settings panel for configuration

---

### Phase 2: Speech-to-Text & Voice Input (2-3 weeks)

**Goal:** Enable voice commands and conversations

#### **STT Implementation**

```python
# Option 1: SpeechRecognition (easy, cloud-based)
pip install speechrecognition>=3.10.0
pip install pyaudio>=0.2.13

# Option 2: Whisper (better accuracy, local)
pip install openai-whisper>=20231117

# Option 3: Faster Whisper (optimized)
pip install faster-whisper>=0.10.0
```

#### **Hotword Detection**

```python
# Wake word: "Hey Jarvis" or "Jarvis"
pip install pvporcupine>=3.0.0  # Porcupine wake word

# Or use Vosk for offline detection
pip install vosk>=0.3.45
```

#### **New Components**

```python
src/lib/core/
├── stt_processor.py        # Speech-to-text engine
├── hotword_detector.py     # Wake word detection
└── audio_manager.py        # Unified audio I/O management
```

#### **Features**

- 🎤 Push-to-talk button in GUI
- 🔴 Always-on listening mode
- 🌟 Hotword activation ("Hey Jarvis")
- 📊 Real-time audio level meter
- 🔇 Noise cancellation
- 🎛️ Microphone selection
- ⏸️ Pause/resume listening

**Deliverables:**

- STT integration with GUI
- Hotword detection service
- Audio input visualization
- Configuration for STT provider

---

### Phase 3: Extended MCP Tools (3-4 weeks)

**Goal:** Add 30+ new capabilities for JARVIS-like intelligence

#### **System & Hardware Tools (8)**

```python
src/lib/mcp/definitions/system_defs.py
src/lib/mcp/implementations/system_impl.py
```

**Tools:**

- `get_system_info` - CPU, RAM, disk usage, OS info
- `get_battery_status` - Battery level, charging state, time remaining
- `get_network_status` - WiFi status, IP, connectivity
- `get_running_processes` - List active processes with PID, CPU, memory
- `kill_process` - Stop process by name or PID
- `set_volume` - Control system audio volume
- `take_screenshot` - Capture screen to file
- `get_clipboard` - Read clipboard content

#### **Web & Internet Tools (6)**

```python
src/lib/mcp/definitions/web_defs.py
src/lib/mcp/implementations/web_impl.py
```

**Tools:**

- `web_search` - Google/DuckDuckGo search integration
- `fetch_url` - Download webpage content
- `download_file` - Download files from URL with progress
- `check_website_status` - Check if website is up
- `shorten_url` - URL shortener integration
- `extract_webpage_text` - Clean text extraction from HTML

#### **Productivity Tools (8)**

```python
src/lib/mcp/definitions/productivity_defs.py
src/lib/mcp/implementations/productivity_impl.py
```

**Tools:**

- `set_reminder` - Create timed reminders
- `set_timer` - Countdown timer with notification
- `set_alarm` - Alarm clock functionality
- `create_note` - Quick note taking
- `todo_add` - Add todo item
- `todo_list` - List todos
- `todo_complete` - Mark todo as done
- `open_application` - Launch applications by name

#### **Communication Tools (5)**

```python
src/lib/mcp/definitions/comms_defs.py
src/lib/mcp/implementations/comms_impl.py
```

**Tools:**

- `send_email` - Email via SMTP
- `send_desktop_notification` - System notifications
- `send_sms` - SMS via Twilio (optional)
- `play_sound` - Play audio files/alerts
- `read_qr_code` - Decode QR codes from image

#### **AI Vision Tools (5)**

```python
src/lib/mcp/definitions/vision_defs.py
src/lib/mcp/implementations/vision_impl.py
```

**Tools:**

- `analyze_image` - Describe image with AI
- `ocr_extract_text` - Extract text from image
- `detect_objects` - Object detection
- `analyze_screen` - Analyze current screen
- `compare_images` - Find differences between images

#### **Data & Knowledge Tools (6)**

```python
src/lib/mcp/definitions/knowledge_defs.py
src/lib/mcp/implementations/knowledge_impl.py
```

**Tools:**

- `save_memory` - Store information in persistent memory
- `recall_memory` - Query memory database
- `summarize_text` - AI text summarization
- `translate_text` - Multi-language translation
- `define_word` - Dictionary lookup
- `convert_units` - Unit conversion (distance, temp, currency)

#### **Smart Home/IoT Tools (3)** *(Optional)*

```python
src/lib/mcp/definitions/iot_defs.py
src/lib/mcp/implementations/iot_impl.py
```

**Tools:**

- `control_lights` - Philips Hue, LIFX integration
- `control_thermostat` - Nest, Ecobee integration
- `iot_device_status` - Check IoT device states

**Dependencies:**

```python
# requirements.txt additions
psutil>=5.9.0              # System monitoring
requests>=2.31.0           # Web requests
beautifulsoup4>=4.12.0     # HTML parsing
Pillow>=10.0.0             # Image processing
pytesseract>=0.3.10        # OCR
opencv-python>=4.8.0       # Computer vision
schedule>=1.2.0            # Task scheduling
plyer>=2.1.0               # Cross-platform notifications
```

**Deliverables:**

- 30+ new MCP tools across 6 categories
- Tool definitions with JSON schemas
- Implementation functions
- Unit tests for each tool
- Documentation with examples

---

### Phase 4: Advanced Intelligence (3-4 weeks)

**Goal:** Proactive assistance and context awareness

#### **Proactive Assistant Service**

```python
src/lib/services/proactive_assistant.py
```

**Features:**

- 📅 Calendar monitoring (upcoming events, conflicts)
- 🔋 System health alerts (battery low, high CPU, disk space)
- 🌐 Network status changes
- 📧 Email monitoring (optional)
- 💡 Context-based suggestions
- ⏰ Smart reminders based on behavior patterns

#### **Enhanced Context Awareness**

```python
src/lib/services/context_manager.py
```

**Tracks:**

- Active application/window
- Files being worked on
- Time of day patterns
- User preferences and habits
- Location (if available)
- Recent conversations

#### **Memory & Knowledge System**

```python
src/lib/services/memory_store.py
```

**Features:**

- Vector database for semantic search (ChromaDB, FAISS)
- Long-term memory persistence
- Knowledge graph of user information
- Smart recall based on context
- Privacy-focused local storage

#### **Screen Analysis**

```python
src/lib/services/screen_analyzer.py
```

**Features:**

- Periodic screen capture
- Vision AI analysis
- OCR text extraction
- Contextual help based on screen content
- "What's on my screen?" command

#### **Automation Workflows**

```python
src/lib/workflows/
├── __init__.py
├── workflow_engine.py      # Workflow execution
├── workflow_parser.py      # Parse user-defined workflows
└── builtin_workflows.py    # Pre-built workflows
```

**Features:**

- Trigger-action rules ("When X, do Y")
- Scheduled tasks
- Conditional logic
- Custom user scripts
- Workflow templates

**Dependencies:**

```python
# requirements.txt additions
chromadb>=0.4.0           # Vector database
faiss-cpu>=1.7.4          # Similarity search
apscheduler>=3.10.0       # Advanced scheduling
pyyaml>=6.0               # Workflow definitions
```

**Deliverables:**

- Proactive monitoring system
- Context tracking service
- Memory/knowledge persistence
- Screen analysis capability
- Workflow automation engine

---

### Phase 5: Polish & Production (2-3 weeks)

**Goal:** Production-ready with extensibility

#### **Theme System**

- Complete dark/light theme support
- Custom color schemes
- Accent color customization
- Font size/family options

#### **Plugin Architecture**

```python
src/lib/plugins/
├── __init__.py
├── plugin_manager.py
├── plugin_loader.py
└── examples/
    ├── weather_plugin.py
    └── spotify_plugin.py
```

**Features:**

- Hot-reload plugins
- Plugin marketplace concept
- Sandboxed execution
- Plugin configuration UI

#### **Advanced Features**

- Multi-language UI support (i18n)
- Keyboard shortcuts customization
- Voice command training
- Export/import settings
- Cloud sync (optional)
- Multi-user profiles

#### **Documentation**

- User guide with screenshots
- Video tutorials
- Plugin development guide
- API reference updates
- Contribution guidelines

#### **Testing & Quality**

- Unit test coverage >80%
- Integration tests
- UI automation tests
- Performance benchmarks
- Security audit

**Deliverables:**

- Complete theme system
- Plugin architecture
- Comprehensive documentation
- Test suite
- Installer/packaging (PyInstaller, py2app)

---

## 📈 Priority Matrix

### High Priority (Must Have)

1. ✅ Desktop UI (Phase 1)
2. ✅ Speech-to-Text (Phase 2)
3. ✅ System monitoring tools (Phase 3)
4. ✅ Web search capability (Phase 3)

### Medium Priority (Should Have)

5. ✅ Productivity tools (Phase 3)
6. ✅ Vision/OCR capabilities (Phase 3)
7. ✅ Proactive assistance (Phase 4)
8. ✅ Memory system (Phase 4)

### Low Priority (Nice to Have)

9. ⚪ Smart home integration (Phase 3)
10. ⚪ Cloud sync (Phase 5)
11. ⚪ Multi-user support (Phase 5)

---

## 🗓️ Timeline Summary

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Desktop UI | 2-3 weeks | 🔜 Next |
| **Phase 2** | Voice Input | 2-3 weeks | 📋 Planned |
| **Phase 3** | Extended Tools | 3-4 weeks | 📋 Planned |
| **Phase 4** | Intelligence | 3-4 weeks | 📋 Planned |
| **Phase 5** | Production | 2-3 weeks | 📋 Planned |
| **Total** | | **12-17 weeks** | |

---

## 🚦 Getting Started

### Immediate Next Steps

**Week 1-2: UI Foundation**

1. Choose UI framework (CustomTkinter recommended)
2. Create basic window and layout
3. Implement chat panel component
4. Integrate with existing ConsoleApp
5. Add settings panel

**Commands to start:**

```bash
# Install UI dependencies
pip install customtkinter>=5.2.0

# Create GUI app structure
mkdir -p src/apps/gui/components
mkdir -p src/apps/gui/themes

# Run GUI app (once created)
python src/main.py --mode gui
```

---

## 🤝 Contributing

Want to contribute? Check specific phases:

- **UI/UX designers:** Phase 1 (UI components, themes)
- **Backend developers:** Phase 3 (MCP tools)
- **ML/AI engineers:** Phase 4 (Vision, memory systems)
- **DevOps:** Phase 5 (Packaging, deployment)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines (to be created).

---

## 📚 Related Documentation

- [MCP Tools](./MCP.md) - Current tool documentation
- [Console App](./CONSOLE.md) - Console interface guide
- [API Reference](./API.md) - Library API docs
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Configuration
- [Setup Guide](./SETUP.md) - Installation instructions

---

## 💭 Vision Statement

**Goal:** Create a JARVIS-like AI assistant that is:

- 🎯 **Proactive** - Anticipates needs, not just reactive
- 🧠 **Intelligent** - Uses AI for reasoning and decision making
- 🎙️ **Voice-first** - Natural voice interaction
- 👁️ **Context-aware** - Understands what you're doing
- 🔒 **Private** - Local-first, user data stays secure
- 🔌 **Extensible** - Plugin system for customization
- 🖥️ **Native** - Desktop app, not web-based
- ⚡ **Fast** - Responsive and efficient

---

**Questions or suggestions?** Open an issue or discussion on GitHub!

**Last Review:** December 4, 2025
