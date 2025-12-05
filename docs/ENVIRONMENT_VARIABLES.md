# Environment Variables

Knik supports configuration via environment variables. All have sensible defaults.

## Text-to-Speech Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KNIK_LANGUAGE` | `a` (American English) | Language code for TTS |
| `KNIK_VOICE` | `af_heart` | Voice to use for TTS |
| `KNIK_MODEL` | `hexgrad/Kokoro-82M` | TTS model name |

### Available Voices
- **Female**: `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`
- **Male**: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

### Language Codes
- `a` - American English
- `b` - British English
- `es` - Spanish
- `fr` - French
- `it` - Italian
- `pt` - Portuguese
- `de` - German
- `ja` - Japanese
- `zh` - Chinese
- `ko` - Korean

## AI Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KNIK_AI_MODEL` | `gemini-1.5-flash` | AI model to use |
| `KNIK_AI_LOCATION` | `us-central1` | Google Cloud region |
| `GOOGLE_CLOUD_PROJECT` | None | Google Cloud project ID (**required** for Vertex AI) |

### Available AI Models
- `gemini-1.5-flash` - Fast, efficient model (recommended)
- `gemini-1.5-pro` - More capable, slower model
- `gemini-1.0-pro` - Legacy stable model

### Console App Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KNIK_CONSOLE_VOICE` | `af_sarah` | Default voice for console app |
| `KNIK_CONSOLE_ENABLE_VOICE` | `true` | Enable voice output in console |
| `KNIK_MAX_HISTORY_SIZE` | `50` | Maximum conversation history entries |
| `KNIK_HISTORY_CONTEXT_SIZE` | `5` | Number of conversation turns sent to AI |
| `KNIK_CONSOLE_AI_PROVIDER` | `vertex` | AI provider: 'vertex' or 'mock' |

**Note for Console App**: To use the console app with Vertex AI, you **must** set `GOOGLE_CLOUD_PROJECT` environment variable with your Google Cloud project ID. Without it, the app will fall back to Mock AI for demonstration purposes.

## Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KNIK_LOG_LEVEL` | `INFO` | Minimum log level (DEBUG, INFO, WARNING, ERROR) |
| `KNIK_SHOW_LOGS` | `true` | Whether to show logs at all |
| `KNIK_USE_COLORS` | `true` | Whether to use colored output |

## Usage

```bash
export KNIK_VOICE_NAME="am_adam"
export KNIK_VOICE_OUTPUT="true"
export GOOGLE_CLOUD_PROJECT="your-project-id"
python src/main.py
```
