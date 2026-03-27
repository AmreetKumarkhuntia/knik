# Environment Variables

Knik supports configuration via environment variables. All have sensible defaults. Copy `.env.example` to `.env` and customize your settings.

## AI Configuration

### General

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_AI_PROVIDER` | `vertex` | AI provider: `vertex`, `gemini`, `zhipuai`, `zai`, `zai_coding`, `custom`, `mock` |
| `KNIK_AI_MODEL` | `gemini-1.5-flash` | AI model name (see available models below) |
| `KNIK_MAX_TOKENS` | `25565` | Maximum tokens for AI responses |
| `KNIK_TEMPERATURE` | `0.7` | AI temperature (0.0 - 2.0) |
| `KNIK_AI_SYSTEM_INSTRUCTION` | *(built-in)* | Custom system instruction for the AI assistant |

### Vertex AI (Google Cloud)

Set `KNIK_AI_PROVIDER=vertex` to use this provider.

| Variable | Default | Description |
| --- | --- | --- |
| `GOOGLE_CLOUD_PROJECT` | None | Google Cloud project ID (**required** for Vertex AI) |
| `KNIK_AI_LOCATION` | `us-central1` | Google Cloud region |

### Gemini AI Studio

Set `KNIK_AI_PROVIDER=gemini` to use this provider.

| Variable | Default | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | None | Gemini AI Studio API key (**required**) |

### ZhipuAI (GLM)

Set `KNIK_AI_PROVIDER=zhipuai` to use this provider.

| Variable | Default | Description |
| --- | --- | --- |
| `ZHIPUAI_API_KEY` | None | ZhipuAI API key (**required**). Get one at https://bigmodel.cn |

### Z.AI Platform

Set `KNIK_AI_PROVIDER=zai` to use this provider.

| Variable | Default | Description |
| --- | --- | --- |
| `ZAI_API_KEY` | None | Z.AI API key (**required**). Get one at https://z.ai/model-api |
| `ZAI_API_BASE` | `https://api.z.ai/api/paas/v4/` | Z.AI API base URL |

### Z.AI Coding Plan

Set `KNIK_AI_PROVIDER=zai_coding` to use this provider. Requires a GLM Coding Plan subscription. Uses the coding-specific endpoint optimized for coding agents.

| Variable | Default | Description |
| --- | --- | --- |
| `ZAI_CODING_API_KEY` | None | Z.AI Coding API key (**required**). Falls back to `ZAI_API_KEY` if not set. Get one at https://bigmodel.cn |
| `ZAI_CODING_API_BASE` | `https://open.bigmodel.cn/api/coding/paas/v4` | Z.AI Coding API base URL |

### Custom (OpenAI-Compatible Endpoint)

Set `KNIK_AI_PROVIDER=custom` to use this provider. Works with Ollama, LM Studio, Together AI, Groq, vLLM, Fireworks, or any endpoint implementing the OpenAI `/v1/chat/completions` API.

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_CUSTOM_API_BASE` | None | Base URL for the OpenAI-compatible endpoint (**required**) |
| `KNIK_CUSTOM_API_KEY` | None | API key (optional — omit for local servers like Ollama) |

### Available AI Models

| Model | Description |
| --- | --- |
| `gemini-2.0-flash-exp` | Latest experimental flash model (December 2024+) |
| `gemini-1.5-flash` | Fast, efficient model (default) |
| `gemini-1.5-flash-8b` | Smaller, faster flash variant |
| `gemini-1.5-pro` | More capable, slower model |
| `gemini-1.0-pro` | Legacy stable model |
| `glm-5` | Z.AI GLM-5 model (recommended) |
| `glm-5-turbo` | Z.AI GLM-5 Turbo model |
| `glm-4` | Z.AI GLM-4 model |
| `glm-4-flash` | Faster GLM-4 variant |
| `glm-4.7` | Z.AI GLM-4.7 Coding model |
| `glm-4.6` | Z.AI GLM-4.6 Coding model |
| `glm-4.5` | Z.AI GLM-4.5 Coding model |

When using the `custom` provider, set `KNIK_AI_MODEL` to any model name supported by your endpoint (e.g., `llama3.1`, `mistral`, `codellama`).

## Text-to-Speech Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_VOICE_OUTPUT` | `true` | Enable/disable TTS voice output |
| `KNIK_VOICE` | `af_heart` | Voice to use for TTS |
| `KNIK_LANGUAGE` | `a` (American English) | Language code for TTS |
| `KNIK_MODEL` | `hexgrad/Kokoro-82M` | TTS model name |

### Available Voices

- **Female**: `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`
- **Male**: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

### Language Codes

| Code | Language |
| --- | --- |
| `a` | American English |
| `b` | British English |
| `es` | Spanish |
| `fr` | French |
| `it` | Italian |
| `pt` | Portuguese |
| `de` | German |
| `ja` | Japanese |
| `zh` | Chinese |
| `ko` | Korean |

## History / Context

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_HISTORY_CONTEXT_SIZE` | `5` | Number of conversation turns sent as context to AI |
| `KNIK_MAX_HISTORY_SIZE` | `50` | Maximum messages stored in history |

## Web Backend

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_WEB_HOST` | `0.0.0.0` | Web backend host |
| `KNIK_WEB_PORT` | `8000` | Web backend port |
| `KNIK_WEB_RELOAD` | `true` | Enable auto-reload during development |

## Database (PostgreSQL)

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_DB_HOST` | `localhost` | Database host |
| `KNIK_DB_PORT` | `5432` | Database port |
| `KNIK_DB_USER` | `postgres` | Database user |
| `KNIK_DB_PASS` | *(empty)* | Database password |
| `KNIK_DB_NAME` | `knik` | Database name |

## Scheduler

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_SCHEDULER_CHECK_INTERVAL` | `60` | Seconds between schedule poll checks |
| `KNIK_SCHEDULER_WORKERS` | `4` | Worker pool size |
| `KNIK_SCHEDULER_MAX_CONCURRENT` | `10` | Maximum concurrent workflow executions |

## Logging

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_LOG_LEVEL` | `INFO` | Minimum log level: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `KNIK_SHOW_LOGS` | `true` | Whether to show logs |
| `KNIK_USE_COLORS` | `true` | Whether to use colored output |

## Browser Automation (Playwright)

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_BROWSER_HEADLESS` | `false` | `false` = visible browser window (headful), `true` = headless |
| `KNIK_BROWSER_PROFILE_DIR` | None | Persistent session storage directory (cookies, logins survive restarts) |

## Messaging (Telegram)

| Variable | Default | Description |
| --- | --- | --- |
| `KNIK_TELEGRAM_BOT_TOKEN` | None | Telegram bot token. Create a bot via @BotFather on Telegram |

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
npm run start:gui
npm run start:web:backend
```
