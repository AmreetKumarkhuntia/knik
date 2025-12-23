# Knik - Text-to-Speech System

High-quality text-to-speech powered by Kokoro-82M with a clean, modular Python API.

## Quick Start

```bash
npm run start           # GUI application (default)
python src/main.py      # Or run directly

npm run start:console   # Terminal console
python src/main.py --mode console

npm run start:web       # Web app (React + FastAPI)
npm run start:electron  # Electron desktop app

python demo/tts/demo.py
python demo/console/console_app_demo.py
python demo/ai/simple_ai_tts.py
```

## Documentation

All documentation is in the `docs/` folder:

- [docs/README.md](docs/README.md) - Documentation index & quick start
- [docs/ROADMAP.md](docs/ROADMAP.md) - Development plan & future features
- [docs/SETUP.md](docs/SETUP.md) - Installation and configuration
- [docs/WEB_APP.md](docs/WEB_APP.md) - Web app architecture & API reference
- [docs/ELECTRON.md](docs/ELECTRON.md) - Electron desktop app guide
- [docs/FRONTEND_POLISH.md](docs/FRONTEND_POLISH.md) - Frontend UI/UX details
- [docs/CONSOLE.md](docs/CONSOLE.md) - Console app usage & commands
- [docs/GUI.md](docs/GUI.md) - GUI application guide
- [docs/MCP.md](docs/MCP.md) - MCP tools system & examples
- [docs/LINTING.md](docs/LINTING.md) - Code quality & formatting
- [docs/API.md](docs/API.md) - Code documentation
- [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) - Configuration options

## Installation

```bash
brew install espeak-ng  # Install espeak-ng (required, macOS)
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Features

### Text-to-Speech

- High-quality TTS with Kokoro-82M (82M parameters)
- Multiple voices (male & female)
- Multi-language support
- Real-time streaming playback
- Save to WAV files

### AI Assistant Apps

#### Web Application

- Modern React + TypeScript frontend with Vite
- FastAPI backend with REST API
- Animated gradient UI, dark theme
- Sidebar navigation
- Smooth animations (60fps, GPU-accelerated)
- Real-time chat with streaming responses
- Toast notifications
- Keyboard shortcuts
- Error boundary for graceful error handling
- Voice output with TTS
- Conversation history
- Electron support (macOS/Windows/Linux)

#### GUI Application

- Desktop interface with CustomTkinter
- Rich chat interface with scrollable history
- Real-time AI streaming responses
- Voice output with visual feedback
- Settings panel (AI provider, model, voice, theme)
- Dark/Light/System theme support
- All console features in UI

#### Console Application

- Terminal-based interactive chat
- Command system (12 commands: /help, /history, /voice, /tools, /provider, /model, /debug, etc.)
- Conversation history tracking
- Debug mode for verbose logging

#### AI Features (All Apps)

- Powered by Google Gemini (Vertex AI)
- Voice-enabled responses with Kokoro TTS
- Context-aware conversations
- MCP Tools (20+ built-in tools: calculate, text processing, time, shell, file operations, etc.)
- Function calling with AI
- Dynamic provider switching (Vertex AI, LangChain, Mock)
- AI model switching (gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash, etc.)

### Library

- Modular, reusable components
- Clean Python API
- Easy integration
- Multiple AI provider support (Vertex AI, LangChain, Mock)

## Usage Example

```python
import sys
sys.path.insert(0, 'src')
from lib import KokoroVoiceModel, AudioProcessor

voice_model = KokoroVoiceModel(voice='am_adam')
audio_processor = AudioProcessor()
text = "Hello! This is Knik TTS."
audio_generator = voice_model.generate(text)
audio_processor.stream_play(audio_generator)
```

## Project Structure

```
knik/
├── docs/                # Documentation
│   ├── README.md        # Documentation index
│   ├── ROADMAP.md       # Development plan
│   ├── SETUP.md         # Installation guide
│   ├── WEB_APP.md       # Web app architecture
│   ├── ELECTRON.md      # Electron desktop guide
│   ├── FRONTEND_POLISH.md # UI/UX details
│   ├── CONSOLE.md       # Console app guide
│   ├── GUI.md           # GUI app guide
│   ├── MCP.md           # MCP tools documentation
│   ├── LINTING.md       # Code quality guide
│   └── API.md           # Code reference
├── src/
│   ├── apps/            # Applications
│   │   ├── console/     # Terminal AI console app
│   │   ├── gui/         # Desktop GUI app (CustomTkinter)
│   │   └── web/         # Web app (React + FastAPI)
│   ├── lib/             # Core library
│   │   ├── core/        # Config & TTS async processor
│   │   ├── services/    # AI, Voice, Audio services
│   │   │   └── ai_client/ # AI client with provider registry
│   │   ├── mcp/         # Model Context Protocol tools
│   │   │   ├── definitions/   # Tool schemas (JSON)
│   │   │   └── implementations/ # Tool functions
│   │   └── utils/       # Console processor, printer
│   ├── imports.py       # Central import hub
│   └── main.py          # Main entry point
├── demo/                # Demo scripts
│   ├── console/         # Console app demos
│   ├── tts/             # TTS demos
│   ├── ai/              # AI + TTS integration demos
│   └── mcp/             # MCP tools testing
├── .ruff.toml           # Linter configuration
├── requirements.txt     # Python dependencies
└── package.json         # Project metadata & scripts
```

## Available Voices

Female: `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`
Male: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

## License

Apache 2.0 (via Kokoro-82M)

## Credits

Built with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad

Start with `python src/main.py` or see [docs/README.md](docs/README.md) for details.
