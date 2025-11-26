# Knik Audio Library

A modular Python library for text-to-speech generation and audio processing using Kokoro TTS.

## Modules

### 1. `lib.core.config` - Config
Configuration and constants for the audio system.

**Features:**
- Audio sample rate settings (default: 24kHz)
- Language code mappings (English, Spanish, French, etc.)
- Voice preset definitions (male and female voices)
- Default configuration values
- Environment variable loading

**Usage:**
```python
import sys
sys.path.insert(0, 'src')

from lib import Config

# Get language code
lang = Config.get_language_code('american_english')  # Returns 'a'

# Check if voice is valid
is_valid = Config.is_valid_voice('af_heart')  # Returns True

# Access sample rate
sample_rate = Config.SAMPLE_RATE  # 24000

# Get values from environment or defaults
voice = Config.get_voice()  # From KNIK_VOICE or default
language = Config.get_language()  # From KNIK_LANGUAGE or default
```

### 2. `lib.services.voice_model` - KokoroVoiceModel
Handles text-to-speech generation using the Kokoro TTS model.

**Features:**
- Load and manage Kokoro TTS models
- Generate speech from text with various voices
- Support for multiple languages
- Stream generation or complete synthesis
- Voice and language switching

**Usage:**
```python
import sys
sys.path.insert(0, 'src')

from lib import KokoroVoiceModel

# Initialize model
model = KokoroVoiceModel(language='a', voice='af_heart')

# Generate audio (streaming)
for graphemes, phonemes, audio in model.generate("Hello world"):
    # Process each segment
    pass

# Synthesize complete audio
audio, sample_rate = model.synthesize("Hello world")

# Change voice
model.set_voice('am_adam')

# Get model info
info = model.get_info()
```

### 3. `lib.services.audio_processor` - AudioProcessor
Handles audio playback, recording, and file I/O operations.

**Features:**
- Play audio through speakers (blocking or non-blocking)
- Stream audio segments with real-time playback
- Save audio to files (WAV, FLAC, etc.)
- Load audio from files
- Save multiple segments to separate files
- Query available audio devices

**Usage:**
```python
import sys
sys.path.insert(0, 'src')

from lib import AudioProcessor
import numpy as np

# Initialize processor
processor = AudioProcessor(sample_rate=24000)

# Play audio
audio = np.random.randn(24000)  # 1 second of audio
processor.play(audio, blocking=True)

# Save audio
processor.save(audio, "output.wav")

# Stream and play from generator
processor.stream_play(audio_generator)

# Load audio
loaded_audio = processor.load("input.wav")
```

## Additional Modules

### 4. `lib.services.ai_client` - AIClient
AI integration for querying AI models.

**Features:**
- Support for Vertex AI (Google Gemini)
- Mock AI for testing
- Streaming and non-streaming responses
- Context-aware conversations

**Usage:**
```python
import sys
sys.path.insert(0, 'src')

from lib import AIClient

# Initialize AI client
ai = AIClient(provider="vertex", project_id="your-project")

# Query AI
response = ai.query("What is AI?", max_tokens=2048)

# Stream response
for chunk in ai.query_stream("Explain machine learning"):
    print(chunk, end='', flush=True)
```

### 5. `lib.utils` - Utilities
Console processing, printing, and other utilities.

**Available utilities:**
- `ConsoleProcessor` - Process console input/output
- `printer` - Logging and formatted output
- `CommandProcessor` - Command parsing

## Complete Example

```python
import sys
sys.path.insert(0, 'src')

from lib import KokoroVoiceModel, AudioProcessor, Config

# Initialize components
voice_model = KokoroVoiceModel(
    language=Config.DEFAULT_LANGUAGE,
    voice='am_adam'
)

audio_processor = AudioProcessor()

# Generate and play speech
text = "Hello! This is a modular text-to-speech system."
audio_generator = voice_model.generate(text)
audio_processor.stream_play(audio_generator)

# Or synthesize and save
audio, sample_rate = voice_model.synthesize(text)
audio_processor.save(audio, "output/speech.wav")
```

## Available Voices

### Female Voices
- `af_heart` - Heart (warm, expressive)
- `af_bella` - Bella (friendly)
- `af_sarah` - Sarah (clear)
- `af_nicole` - Nicole
- `af_sky` - Sky

### Male Voices
- `am_adam` - Adam (deep, authoritative)
- `am_michael` - Michael (professional)
- `am_leo` - Leo
- `am_ryan` - Ryan

## Supported Languages

- American English (`'a'`)
- British English (`'b'`)
- Spanish (`'es'`)
- French (`'fr'`)
- Italian (`'it'`)
- Portuguese (`'pt'`)
- German (`'de'`)
- Japanese (`'ja'`)
- Chinese (`'zh'`)
- Korean (`'ko'`)

## Architecture

```
src/lib/
├── __init__.py                # Package initialization & exports
├── core/
│   ├── __init__.py
│   └── config.py              # Configuration and constants
├── services/
│   ├── __init__.py
│   ├── voice_model.py         # TTS model interface
│   ├── audio_processor.py     # Audio I/O and playback
│   └── ai_client.py           # AI integration
└── utils/
    ├── __init__.py
    ├── console_processor.py   # Console input processing
    └── printer.py             # Logging and output
```

Each module is designed to be independent and reusable, following single-responsibility principles.

## Importing

All main classes are exported from the `lib` package:

```python
import sys
sys.path.insert(0, 'src')

from lib import (
    Config,
    KokoroVoiceModel,
    AudioProcessor,
    AIClient,
    MockAIClient,
    ConsoleProcessor,
    printer
)
```
