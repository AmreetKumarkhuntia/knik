# Development

## Running the App

```bash
# Web app (two separate terminals)
npm run start:web:backend    # FastAPI on http://localhost:8010
npm run start:web:frontend   # Vite dev server on http://localhost:8020

# Telegram bot (needs KNIK_TELEGRAM_BOT_TOKEN)
npm run start:bot

# Workflow scheduler (start:cron is an alias)
npm run start:worker

# Console mode
npm run start:console

# Split pane with logs
npm run start:console:split

# Electron desktop app
npm run start:electron

# Direct Python, from the repo root (default mode is backend)
python src/main.py --mode backend
python src/main.py --mode bot
python src/main.py --mode worker    # --mode cron still works
python src/main.py --mode console
```

## Code Quality

```bash
npm run lint          # Lint backend
npm run lint:fix      # Auto-fix backend lint
npm run lint:imports  # Check import-linter contracts (pyproject.toml)
npm run lint:frontend # Lint frontend
npm run lint:all      # Lint everything

npm run format        # Format backend
npm run format:check  # Check formatting
npm run format:frontend
npm run format:all

npm run typecheck          # Backend type checking
npm run typecheck:frontend # Frontend type checking (tsc --noEmit)

npm run test          # Backend tests (pytest; src/ is on the path via pyproject.toml)
```

## Environment Setup

- **Required:** `espeak-ng` (install via `brew install espeak-ng` on macOS)
- **Optional:** Set `GOOGLE_CLOUD_PROJECT` for Vertex AI (falls back to mock provider)
- See `docs/reference/environment-variables.md` for all configuration options

## Cache Management

```bash
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
```
