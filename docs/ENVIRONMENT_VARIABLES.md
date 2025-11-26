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
| `KNIK_CONSOLE_MAX_HISTORY` | `50` | Maximum conversation history entries |
| `KNIK_CONSOLE_AI_PROVIDER` | `vertex` | AI provider: 'vertex' or 'mock' |

**Note for Console App**: To use the console app with Vertex AI, you **must** set `GOOGLE_CLOUD_PROJECT` environment variable with your Google Cloud project ID. Without it, the app will fall back to Mock AI for demonstration purposes.

## Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `KNIK_LOG_LEVEL` | `INFO` | Minimum log level (DEBUG, INFO, WARNING, ERROR) |
| `KNIK_SHOW_LOGS` | `true` | Whether to show logs at all |
| `KNIK_USE_COLORS` | `true` | Whether to use colored output |

## Usage Examples

### Bash/Zsh
```bash
# Set default voice to male
export KNIK_VOICE=am_adam

# Set log level to DEBUG for verbose output
export KNIK_LOG_LEVEL=DEBUG

# Disable colored output
export KNIK_USE_COLORS=false

# Configure Google Cloud for AI
export GOOGLE_CLOUD_PROJECT=my-project-id

# Run your script
python src/main.py
```

### Python Code
```python
from lib.core.config import AudioConfig

# Get config values (automatically loads from env)
voice = AudioConfig.get_voice()  # Returns env var or default
language = AudioConfig.get_language()
log_level = AudioConfig.get_log_level()

print(f"Voice: {voice}")
print(f"Language: {language}")
print(f"Log Level: {log_level}")
```

### .env File (with python-dotenv)
```bash
# .env file
KNIK_VOICE=am_michael
KNIK_LANGUAGE=a
KNIK_LOG_LEVEL=DEBUG
KNIK_AI_MODEL=gemini-1.5-pro
GOOGLE_CLOUD_PROJECT=my-gcp-project
```

Then in your code:
```python
from dotenv import load_dotenv
load_dotenv()  # Load .env file

from lib import KokoroVoiceModel, AudioConfig

# Will use environment variables automatically
voice = AudioConfig.get_voice()
voice_model = KokoroVoiceModel(voice=voice)
```

## Priority Order

Configuration is loaded in this order (highest priority first):
1. **Explicitly passed parameters** - Direct arguments to functions/classes
2. **Environment variables** - Set via `export` or `.env` file
3. **Default values** - Built-in defaults in `AudioConfig`

Example:
```python
from lib import KokoroVoiceModel, AudioConfig

# Even if KNIK_VOICE=am_adam is set in env,
# this will use 'af_bella' (explicit parameter takes priority)
model = KokoroVoiceModel(voice='af_bella')

# This will use env var KNIK_VOICE or default
model = KokoroVoiceModel(voice=AudioConfig.get_voice())
```
