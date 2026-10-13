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

Tests that need Postgres are skipped unless `KNIK_TEST_DATABASE_URL` points at a disposable database. They migrate it and **truncate every table**, so never point it at a database you care about:

```bash
createdb knik_test
KNIK_TEST_DATABASE_URL=postgresql://localhost/knik_test npm run test
```

## Database

The schema lives in `db/migrations/*.sql`. `scripts/migrate.sh` applies every file not yet recorded in the `schema_migrations` table, in name order, each in its own transaction. Running it again applies nothing.

```bash
scripts/migrate.sh   # reads KNIK_DB_HOST/PORT/USER/PASS/NAME from the environment, then .env
```

To change the schema, add the next numbered file (`<NNN>_<what>.sql`, one above the highest number in `db/migrations/`) and write it so it can run twice without error (`IF NOT EXISTS`, guarded `DO` blocks). Never edit a migration that has already shipped. `db/setup/permissions.sql` is an optional, manual step that grants a separate application role access to the tables.

Apps start without Postgres: the pool waits at most `KNIK_DB_CONNECT_TIMEOUT` seconds, logs a warning, and later queries reconnect on their own. The backend answers database routes with HTTP 503 until Postgres is back.

## Environment Setup

- **Required:** `espeak-ng` (install via `brew install espeak-ng` on macOS)
- **Optional:** Set `GOOGLE_CLOUD_PROJECT` for Vertex AI (falls back to mock provider)
- See `docs/reference/environment-variables.md` for all configuration options

## Cache Management

```bash
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
```
