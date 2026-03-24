# Setup Guide

## Prerequisites

- Python 3.12+
- Node.js (for npm scripts)
- espeak-ng (for TTS)
- PostgreSQL (for scheduler/workflows, optional)

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd knik

# 2. Install espeak-ng
brew install espeak-ng           # macOS
sudo apt-get install espeak-ng   # Ubuntu/Debian

# 3. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Install frontend dependencies (for web app)
cd src/apps/web/frontend && npm install && cd -

# 6. Configure environment
cp .env.example .env
# Edit .env with your settings (see docs/reference/environment-variables.md)
```

## Configuration

At minimum, copy `.env.example` to `.env`. For Vertex AI, set `GOOGLE_CLOUD_PROJECT`. For other providers, set the appropriate API key. See [Environment Variables](../reference/environment-variables.md) for all options.

```bash
# Vertex AI (Google Cloud)
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Or use Gemini AI Studio
export KNIK_AI_PROVIDER=gemini
export GEMINI_API_KEY=your-key

# Or use a local model via Ollama
export KNIK_AI_PROVIDER=custom
export KNIK_CUSTOM_API_BASE=http://localhost:11434/v1
export KNIK_AI_MODEL=llama3.1

# Without any AI provider configured, Knik falls back to mock provider
```

## Running

```bash
# GUI (default)
npm run start:gui

# Console
npm run start:console

# Web app (two terminals)
npm run start:web:backend     # Backend on :8000
npm run start:web:frontend    # Frontend on :12414

# Cron scheduler
npm run start:cron

# Electron desktop app
npm run start:electron
```

## Code Quality

```bash
npm run lint           # Lint backend (ruff)
npm run lint:fix       # Auto-fix backend lint
npm run lint:frontend  # Lint frontend (eslint)
npm run lint:all       # Lint everything

npm run format         # Format backend (ruff)
npm run format:check   # Check formatting
npm run format:frontend
npm run format:all

npm run typecheck          # Backend type checking
npm run typecheck:frontend # Frontend type checking
```

## Troubleshooting

- **No espeak-ng**: `which espeak-ng` to verify installation
- **Import errors**: Ensure you're running from project root with venv activated
- **No audio**: Test with `espeak-ng "test"`
- **Mock provider**: If AI responses seem canned, check your provider configuration — AIClient auto-falls back to mock when unconfigured
