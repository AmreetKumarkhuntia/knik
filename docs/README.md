# Knik Documentation

AI-powered voice console with async TTS processing.

## Quick Links

- **[Setup](SETUP.md)** - Installation and configuration
- **[Console](CONSOLE.md)** - Interactive AI chat with voice
- **[MCP Tools](MCP.md)** - Model Context Protocol tools
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

- **[SETUP](SETUP.md)** - Installation
- **[CONSOLE](CONSOLE.md)** - Console usage
- **[MCP](MCP.md)** - Tool system
- **[API](API.md)** - Code reference
- **[MCP_LANGCHAIN_PATTERN](MCP_LANGCHAIN_PATTERN.md)** - Tool binding pattern
