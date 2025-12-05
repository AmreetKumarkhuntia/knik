# Knik Documentation

AI-powered voice console with async TTS processing.

## Quick Links

- **[Roadmap](ROADMAP.md)** - 🚀 **Development plan & future features**
- **[GUI App](GUI.md)** - 🖥️ **Desktop GUI application guide**
- **[Setup](SETUP.md)** - Installation and configuration
- **[Console](CONSOLE.md)** - Interactive AI chat with voice
- **[Conversation History](CONVERSATION_HISTORY.md)** - 🧠 **AI memory & context** (NEW!)
- **[MCP Tools](MCP.md)** - Model Context Protocol tools
- **[Linting](LINTING.md)** - Code quality & formatting
- **[API](API.md)** - Code documentation
- **[Environment](ENVIRONMENT_VARIABLES.md)** - Configuration options

## Quick Start

```bash
# Install
brew install espeak-ng
pip install -r requirements.txt

# Run
npm run start:console
```

## Project Structure

```text
src/
├── apps/console/      # Console app
├── lib/
│   ├── core/          # TTSAsyncProcessor
│   ├── services/      # AI, voice, audio
│   ├── mcp/           # MCP tools
│   └── utils/         # Helpers
└── main.py
```

## Documentation

- **[ROADMAP](ROADMAP.md)** - 🗺️ Development plan & future features
- **[GUI](GUI.md)** - 🖥️ GUI application guide
- **[SETUP](SETUP.md)** - Installation
- **[CONSOLE](CONSOLE.md)** - Console usage
- **[CONVERSATION_HISTORY](CONVERSATION_HISTORY.md)** - 🧠 AI memory & context
- **[MCP](MCP.md)** - Tool system
- **[LINTING](LINTING.md)** - Code quality & formatting
- **[API](API.md)** - Code reference
- **[MCP_LANGCHAIN_PATTERN](MCP_LANGCHAIN_PATTERN.md)** - Tool binding pattern
