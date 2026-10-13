# Environment Variables

Knik is configured through environment variables, each with a default. Copy `.env.example` to `.env` and
customize your settings. The apps load `.env` from the repository root.

## AI Configuration

### General

| Variable                     | Default            | Description                                                                                                                                               |
| ---------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KNIK_AI_PROVIDER`           | `vertex`           | AI provider: `vertex`, `gemini`, `zhipuai`, `zai`, `zai_coding`, `custom`, `mock`. An unknown or unconfigured provider falls back to `mock`               |
| `KNIK_AI_MODEL`              | `gemini-1.5-flash` | Model for the console and the web backend (until one is saved in its settings). The Telegram bot passes none, so the provider's own default applies there |
| `KNIK_MAX_TOKENS`            | `25565`            | Maximum reply tokens the console asks for with each message. The web backend shows it on its settings page when none is saved                             |
| `KNIK_TEMPERATURE`           | `0.7`              | Temperature the console sends with each message (0.0 - 2.0). The web backend shows it on its settings page when none is saved                             |
| `KNIK_AI_SYSTEM_INSTRUCTION` | _(built-in)_       | Custom system instruction for the AI assistant                                                                                                            |

### Vertex AI (Google Cloud)

Set `KNIK_AI_PROVIDER=vertex` to use this provider.

| Variable               | Default       | Description                                          |
| ---------------------- | ------------- | ---------------------------------------------------- |
| `GOOGLE_CLOUD_PROJECT` | None          | Google Cloud project ID (**required** for Vertex AI) |
| `KNIK_AI_LOCATION`     | `us-central1` | Google Cloud region                                  |

### Gemini AI Studio

Set `KNIK_AI_PROVIDER=gemini` to use this provider.

| Variable         | Default | Description                             |
| ---------------- | ------- | --------------------------------------- |
| `GEMINI_API_KEY` | None    | Gemini AI Studio API key (**required**) |

### ZhipuAI (GLM)

Set `KNIK_AI_PROVIDER=zhipuai` to use this provider.

| Variable          | Default | Description                                                    |
| ----------------- | ------- | -------------------------------------------------------------- |
| `ZHIPUAI_API_KEY` | None    | ZhipuAI API key (**required**). Get one at https://bigmodel.cn |

### Z.AI Platform

Set `KNIK_AI_PROVIDER=zai` to use this provider.

| Variable       | Default                         | Description                                                    |
| -------------- | ------------------------------- | -------------------------------------------------------------- |
| `ZAI_API_KEY`  | None                            | Z.AI API key (**required**). Get one at https://z.ai/model-api |
| `ZAI_API_BASE` | `https://api.z.ai/api/paas/v4/` | Z.AI API base URL                                              |

### Z.AI Coding Plan

Set `KNIK_AI_PROVIDER=zai_coding` to use this provider. Requires a GLM Coding Plan subscription. Uses the coding-specific endpoint optimized for coding agents.

| Variable              | Default                               | Description                                                                                                |
| --------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ZAI_CODING_API_KEY`  | None                                  | Z.AI Coding API key (**required**). Falls back to `ZAI_API_KEY` if not set. Get one at https://bigmodel.cn |
| `ZAI_CODING_API_BASE` | `https://api.z.ai/api/coding/paas/v4` | Z.AI Coding API base URL                                                                                   |

### Custom (OpenAI-Compatible Endpoint)

Set `KNIK_AI_PROVIDER=custom` to use this provider. Works with Ollama, LM Studio, Together AI, Groq, vLLM, Fireworks, or any endpoint implementing the OpenAI `/v1/chat/completions` API.

| Variable               | Default | Description                                                |
| ---------------------- | ------- | ---------------------------------------------------------- |
| `KNIK_CUSTOM_API_BASE` | None    | Base URL for the OpenAI-compatible endpoint (**required**) |
| `KNIK_CUSTOM_API_KEY`  | None    | API key (optional — omit for local servers like Ollama)    |

### Available AI Models

| Model                  | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `gemini-2.0-flash-exp` | Latest experimental flash model (December 2024+) |
| `gemini-1.5-flash`     | Fast, efficient model (default)                  |
| `gemini-1.5-flash-8b`  | Smaller, faster flash variant                    |
| `gemini-1.5-pro`       | More capable, slower model                       |
| `gemini-1.0-pro`       | Legacy stable model                              |
| `glm-5`                | Z.AI GLM-5 model (recommended)                   |
| `glm-5-turbo`          | Z.AI GLM-5 Turbo model                           |
| `glm-4`                | Z.AI GLM-4 model                                 |
| `glm-4-flash`          | Faster GLM-4 variant                             |
| `glm-4.7`              | Z.AI GLM-4.7 Coding model                        |
| `glm-4.6`              | Z.AI GLM-4.6 Coding model                        |
| `glm-4.5`              | Z.AI GLM-4.5 Coding model                        |

When using the `custom` provider, set `KNIK_AI_MODEL` to any model name supported by your endpoint (e.g., `llama3.1`, `mistral`, `codellama`).

## Text-to-Speech Configuration

| Variable            | Default                | Description                                                                                              |
| ------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `KNIK_VOICE_OUTPUT` | `true`                 | Whether the console speaks its replies                                                                   |
| `KNIK_VOICE`        | `af_heart`             | Voice the web backend speaks with until one is saved on its settings page. The console does not apply it |
| `KNIK_LANGUAGE`     | `a` (American English) | Not used: speech is always American English (`a`)                                                        |
| `KNIK_MODEL`        | `hexgrad/Kokoro-82M`   | Not used: the Kokoro model loaded is always `hexgrad/Kokoro-82M`                                         |

### Available Voices

- **Female**: `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`
- **Male**: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

### Language Codes

Kokoro's language codes, kept for reference; `KNIK_LANGUAGE` does not select one yet.

| Code | Language         |
| ---- | ---------------- |
| `a`  | American English |
| `b`  | British English  |
| `es` | Spanish          |
| `fr` | French           |
| `it` | Italian          |
| `pt` | Portuguese       |
| `de` | German           |
| `ja` | Japanese         |
| `zh` | Chinese          |
| `ko` | Korean           |

## History / Context

| Variable                    | Default | Description                                                                                                                                      |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `KNIK_HISTORY_CONTEXT_SIZE` | `5`     | Earlier user/assistant turn pairs sent as context with each message. A stored conversation that was compacted sends everything since its summary |

## Web Backend

| Variable                   | Default                                       | Description                                                                                |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `KNIK_WEB_HOST`            | `0.0.0.0`                                     | Web backend host                                                                           |
| `KNIK_WEB_PORT`            | `8010`                                        | Web backend port                                                                           |
| `KNIK_WEB_RELOAD`          | `true`                                        | Enable auto-reload during development                                                      |
| `KNIK_WEB_CORS_ORIGINS`    | `http://localhost:8020,http://127.0.0.1:8020` | Origins whose pages may call the API from a browser, comma-separated (see [CORS](#cors))   |
| `KNIK_WEB_TOOL_CONSENT`    | `deny`                                        | `deny` or `allow` tools that need consent in web chats (see [Tool consent](#tool-consent)) |
| `KNIK_WEB_REQUIRE_API_KEY` | `false`                                       | Require a stored API key in `X-API-Key` on every `/api` route (see [API keys](#api-keys))  |

### CORS

`KNIK_WEB_CORS_ORIGINS` lists exact origins (`scheme://host[:port]`), e.g.
`https://yourdomain.com,https://www.yourdomain.com`. Requests from these origins may carry credentials. An
empty value lets no other origin in. `*` lets any origin in, and then never with credentials.

### Tool consent

Some tools need the user's approval before they run: shell commands, file access, the browser, and the
schedule and workflow tools. The Telegram bot and the console ask for it; web chats cannot ask yet.
With `KNIK_WEB_TOOL_CONSENT=deny` (the default) such a tool is not run, and the model gets
`Permission denied for <tool>` as its result. With `allow` they run without asking anyone, which the backend
warns about at startup: use it only for a trusted single-user setup. Any other value means `deny`.
Workflows run from the web app (`POST /api/workflows/{id}/execute`) are not covered by this setting.

### API keys

With `KNIK_WEB_REQUIRE_API_KEY=true`, every `/api` route needs a stored key in the `X-API-Key` header. A
request without one, or with an unknown one, gets `401`; while the database is down it gets `503`. `/` and
`/health` stay open. Each key's `last_used_at` is updated when it opens a request.

Keys are created, listed and deleted under `/api/admin/api-keys`. Only a hash of each key is stored, so the
full key is shown once, when it is created. Create the first key while the check is still off, then restart
with it on:

```bash
curl -X POST http://localhost:8010/api/admin/api-keys \
  -H 'Content-Type: application/json' -d '{"label": "me"}'
# {"id": "...", "label": "me", "key_prefix": "knik_live_...", "scopes": [], "key": "knik_live_..."}  <- keep "key"

export KNIK_WEB_REQUIRE_API_KEY=true   # then restart the backend
curl http://localhost:8010/api/admin/api-keys -H 'X-API-Key: knik_live_...'
```

Scopes are stored with each key but not enforced: any stored key opens every `/api` route.

## Database (PostgreSQL)

| Variable                  | Default     | Description                                                                       |
| ------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `KNIK_DB_HOST`            | `localhost` | Database host                                                                     |
| `KNIK_DB_PORT`            | `5432`      | Database port                                                                     |
| `KNIK_DB_USER`            | `postgres`  | Database user                                                                     |
| `KNIK_DB_PASS`            | _(empty)_   | Database password                                                                 |
| `KNIK_DB_NAME`            | `knik`      | Database name                                                                     |
| `KNIK_DB_POOL_MIN_SIZE`   | `1`         | Connections the pool keeps open                                                   |
| `KNIK_DB_POOL_MAX_SIZE`   | `10`        | Most connections the pool opens                                                   |
| `KNIK_DB_CONNECT_TIMEOUT` | `5`         | Seconds to wait for Postgres to accept a connection, and for a free one per query |

## Scheduler

| Variable                                 | Default | Description                                                                                                                       |
| ---------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `KNIK_SCHEDULER_CHECK_INTERVAL`          | `60`    | Seconds between schedule poll checks                                                                                              |
| `KNIK_SCHEDULER_WORKERS`                 | `4`     | Not used; `KNIK_SCHEDULER_MAX_CONCURRENT` bounds scheduled runs                                                                   |
| `KNIK_SCHEDULER_MAX_CONCURRENT`          | `10`    | Most scheduled workflow runs a worker executes at once; further due runs wait for a free slot                                     |
| `KNIK_SCHEDULER_STALE_EXECUTION_SECONDS` | `3600`  | At worker startup, executions still `running` that started longer ago than this are marked failed (newer ones may be manual runs) |

## Logging

| Variable          | Default | Description                                            |
| ----------------- | ------- | ------------------------------------------------------ |
| `KNIK_LOG_LEVEL`  | `INFO`  | Minimum log level: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `KNIK_SHOW_LOGS`  | `true`  | Whether to show logs                                   |
| `KNIK_USE_COLORS` | `true`  | Whether to use colored output                          |

## Browser Automation (Playwright)

| Variable                    | Default                   | Description                                                                  |
| --------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `KNIK_BROWSER_HEADLESS`     | `false`                   | `false` = visible browser window (headful), `true` = headless                |
| `KNIK_BROWSER_PROFILE_DIR`  | `~/.knik/browser-profile` | Persistent session storage directory (cookies, logins survive restarts)      |
| `KNIK_BROWSER_IDLE_TIMEOUT` | `1800`                    | Seconds a browser session may sit unused before the backend or bot closes it |

## Context Compaction

Applies to conversations stored in Postgres (web backend and bot).

| Variable                          | Default | Description                                                                                     |
| --------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `KNIK_COMPACTION_ENABLED`         | `true`  | Enable/disable automatic context compaction                                                     |
| `KNIK_COMPACTION_THRESHOLD`       | `0.95`  | Fraction of the model's context window whose use triggers compaction                            |
| `KNIK_COMPACTION_CIRCUIT_BREAKER` | `3`     | A conversation whose compaction failed this many times in a row is not compacted again          |
| `KNIK_COMPACTION_PROMPT_BUFFER`   | `1024`  | Tokens of the context window kept free for the summary; the oldest messages are left out to fit |
| `KNIK_MODEL_DISCOVERY_TIMEOUT`    | `5`     | Not used: model discovery requests always time out after 5 seconds                              |

## Messaging (Telegram)

| Variable                  | Default | Description                                                 |
| ------------------------- | ------- | ----------------------------------------------------------- |
| `KNIK_TELEGRAM_BOT_TOKEN` | None    | Telegram bot token. Create a bot via @BotFather on Telegram |

## Bot App

| Variable                    | Default | Description                                                               |
| --------------------------- | ------- | ------------------------------------------------------------------------- |
| `KNIK_BOT_ENABLED`          | `true`  | When false, `--mode bot` logs a warning and exits without starting        |
| `KNIK_BOT_CONCURRENT_LIMIT` | `10`    | Maximum replies generated at once across all chats; further messages wait |

## Usage

```bash
# Copy the example and edit
cp .env.example .env

# Or set variables directly
export KNIK_AI_PROVIDER=custom
export KNIK_CUSTOM_API_BASE=http://localhost:11434/v1
export KNIK_AI_MODEL=llama3.1
export GOOGLE_CLOUD_PROJECT=your-project-id

# Run any app
npm run start:console
npm run start:web:backend
```
