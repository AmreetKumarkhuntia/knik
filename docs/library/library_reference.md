# Knik Audio Library

A modular Python library for text-to-speech generation and audio processing using Kokoro TTS.

## Modules

### 1. `config.py` - AudioConfig
Configuration and constants for the audio system.

**Features:**
- Audio sample rate settings (default: 24kHz)
- Language code mappings (English, Spanish, French, etc.)
- Voice preset definitions (male and female voices)
- Default configuration values

**Usage:**
```python
from lib.config import AudioConfig

# Get language code
lang = AudioConfig.get_language_code('american_english')  # Returns 'a'

# Check if voice is valid
is_valid = AudioConfig.is_valid_voice('af_heart')  # Returns True

# Access sample rate
sample_rate = AudioConfig.SAMPLE_RATE  # 24000
```

### 2. `voice_model.py` - VoiceModel
Handles text-to-speech generation using the Kokoro TTS model.

**Features:**
- Load and manage Kokoro TTS models
- Generate speech from text with various voices
- Support for multiple languages
- Stream generation or complete synthesis
- Voice and language switching

**Usage:**
```python
from lib.voice_model import VoiceModel

# Initialize model
model = VoiceModel(language='a', voice='af_heart')

# Generate audio (streaming)
for graphemes, phonemes, audio in model.generate("Hello world"):
    # Process each segment
    pass

# Synthesize complete audio
audio, sample_rate = model.synthesize("Hello world")

# Change voice
model.set_voice('am_adam')
```

### 3. `audio_processor.py` - AudioProcessor
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
from lib.audio_processor import AudioProcessor
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

## Complete Example

```python
from lib import VoiceModel, AudioProcessor, AudioConfig

# Initialize components
voice_model = VoiceModel(
    language=AudioConfig.DEFAULT_LANGUAGE,
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
lib/
├── __init__.py          # Package initialization
├── config.py            # Configuration and constants
├── voice_model.py       # TTS model interface
└── audio_processor.py   # Audio I/O and playback
```

Each module is designed to be independent and reusable, following single-responsibility principles.
