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

- [docs/README.md](docs/README.md) - Documentation index & getting started

## Installation

```bash
brew install espeak-ng  # Install espeak-ng (required, macOS)
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Features

High-quality TTS with Kokoro-82M (82M parameters), AI assistant apps (GUI, Console, Web), MCP tools, conversation history, and multiple AI provider support.

## Available Voices

Female: `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`
Male: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

## License

Apache 2.0 (via Kokoro-82M)

## Credits

Built with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad

See [docs/README.md](docs/README.md) for complete documentation.
