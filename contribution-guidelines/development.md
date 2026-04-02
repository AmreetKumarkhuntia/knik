# Development

## Running the App

```bash
# GUI mode
npm run start:gui

# Console mode
npm run start:console

# Split pane with logs
npm run start:console:split

# Web app (two separate terminals)
npm run start:web:backend
npm run start:web:frontend

# Cron scheduler
npm run start:cron

# Electron desktop app
npm run start:electron

# Direct Python
python src/main.py --mode gui
python src/main.py --mode console
python src/main.py --mode cron
```

## Code Quality

```bash
npm run lint          # Lint backend
npm run lint:fix      # Auto-fix backend lint
npm run lint:frontend # Lint frontend
npm run lint:all      # Lint everything

npm run format        # Format backend
npm run format:check  # Check formatting
npm run format:frontend
npm run format:all

npm run typecheck          # Backend type checking
npm run typecheck:frontend # Frontend type checking (tsc --noEmit)
```

## Environment Setup

- **Required:** `espeak-ng` (install via `brew install espeak-ng` on macOS)
- **Optional:** Set `GOOGLE_CLOUD_PROJECT` for Vertex AI (falls back to mock provider)
- See `docs/reference/environment-variables.md` for all configuration options

## Cache Management

```bash
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
```
