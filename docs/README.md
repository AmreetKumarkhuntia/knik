# Knik Documentation

High-quality text-to-speech with async processing and AI console.

## Quick Links

- **[Setup Guide](SETUP.md)** - Installation and configuration
- **[Console App](CONSOLE.md)** - Interactive AI chat with voice
- **[MCP Tools](MCP.md)** - Model Context Protocol tools system
- **[API Reference](API.md)** - Code documentation
- **[Environment Variables](ENVIRONMENT_VARIABLES.md)** - Configuration options

## Key Features

- **Async Voice Processing** - Non-blocking TTS with background threads
- **Smart Wait System** - Blocks input until audio playback completes
- **AI Console** - Interactive chat with streaming voice responses
- **Multiple Voices** - Various male and female voice options

## Quick Start

```bash
# Install
brew install espeak-ng
pip install -r requirements.txt

# Run
npm run start:console
```

## Basic Example

```python
from lib import TTSAsyncProcessor

processor = TTSAsyncProcessor(
    sample_rate=24000,
    voice_model="af_sarah"
)
processor.start_async_processing()

processor.play_async("Hello world")

# Wait for completion
while not processor.is_processing_complete():
    time.sleep(0.1)
```

## Project Structure

```
knik/
├── src/
│   ├── apps/console/      # Console app
│   ├── lib/
│   │   ├── core/          # TTSAsyncProcessor
│   │   ├── services/      # AI, voice, audio
│   │   └── utils/         # Helpers
│   └── main.py
├── docs/                  # Documentation
└── demo/                  # Examples
```

## Documentation

### Core Docs

- **[SETUP.md](SETUP.md)** - Get started
- **[CONSOLE.md](CONSOLE.md)** - Console app usage
- **[MCP.md](MCP.md)** - MCP tools system
- **[API.md](API.md)** - Code reference
- **[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)** - Config

### Application Docs

- **[apps/console/MCP_IMPLEMENTATION.md](apps/console/MCP_IMPLEMENTATION.md)** - MCP implementation guide

### Library Reference

- **[library/LIBRARY_REFERENCE.md](library/LIBRARY_REFERENCE.md)** - Detailed API docs
- **[library/EXTENDING_VOICE_MODELS.md](library/EXTENDING_VOICE_MODELS.md)** - Custom TTS engines

### Planning

- **[plan/VOICE_AGENT_PLAN.md](plan/VOICE_AGENT_PLAN.md)** - Roadmap

## Getting Help

1. Check **[SETUP.md](SETUP.md)** for installation issues
2. See **[CONSOLE.md](CONSOLE.md)** for app usage
3. Read **[API.md](API.md)** for code examples
4. Review **[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)** for configuration

## Next Steps

1. Follow **[SETUP.md](SETUP.md)** to install
2. Try **[CONSOLE.md](CONSOLE.md)** for interactive chat
3. See **[API.md](API.md)** for code examples
