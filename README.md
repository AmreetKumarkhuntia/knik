# Knik - Multi-Interface AI Assistant with TTS

High-quality text-to-speech powered by Kokoro-82M, with AI assistant interfaces (Web, Telegram bot, Console), 7 AI providers, 31 MCP tools, workflow scheduling, and conversation history.

## Quick Start

```bash
brew install espeak-ng                 # Install TTS dependency (macOS)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                   # Configure your settings

npm run start:web:backend              # Web backend (port 8010)
npm run start:web:frontend             # Web frontend (port 8020)
npm run start:bot                      # Telegram bot (requires KNIK_TELEGRAM_BOT_TOKEN)
npm run start:worker                   # Workflow scheduler (alias: start:cron)
npm run start:console                  # Terminal console
npm run start:electron                 # Electron desktop app

python src/main.py --mode backend      # Without npm: backend | bot | worker | console
```

## Documentation

All documentation is in the `docs/` folder:

- [docs/README.md](docs/README.md) - Documentation index

## Features

- **TTS**: Kokoro-82M (82M parameters) with 9 voices (5 female, 4 male) and 10 languages
- **AI Providers**: Vertex AI, Gemini, ZhipuAI, Z.AI, Z.AI Coding, Custom (OpenAI-compatible), Mock
- **MCP Tools**: 31 tools across 7 categories (utils, text, shell, file, browser, cron, workflow)
- **Interfaces**: Web (React + FastAPI), Telegram bot, Console, Electron
- **Workflows**: DAG-based workflow engine with natural language scheduling
- **History**: Conversation context management with configurable depth

## Available Voices

Female: `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`
Male: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

## License

Apache 2.0 (via Kokoro-82M)

## Credits

Built with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad
