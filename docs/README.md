# Knik - Text-to-Speech System & AI Console

A modular, easy-to-use Python library for high-quality text-to-speech generation using the Kokoro-82M model, plus an interactive AI console application.

## 🎯 Features

### Text-to-Speech
- **High-Quality TTS**: Powered by Kokoro-82M, an Apache-licensed 82M parameter model
- **Multiple Voices**: Choose from various male and female voices
- **Multi-Language Support**: English, Spanish, French, German, Italian, and more
- **Stream or Save**: Play audio directly or save to files
- **Real-time Playback**: Stream audio as it's generated

### AI Console App (NEW! 🎉)
- **Interactive Chat**: Chat with AI models (Google Gemini) directly in your terminal
- **Voice Responses**: Hear AI responses with text-to-speech
- **Context-Aware**: Maintains conversation history for natural interactions
- **Command System**: Built-in commands for voice control, history, and more
- **Customizable**: Configure AI provider, voice, and behavior

### Library
- **Modular Architecture**: Clean, reusable components
- **Easy Integration**: Simple API for custom applications

## 📦 Installation

### Prerequisites

1. **Python 3.8+** (tested with Python 3.12)
2. **espeak-ng** (required for phoneme conversion)

### Install espeak-ng

**macOS:**
```bash
brew install espeak-ng
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install espeak-ng
```

**Linux (Fedora):**
```bash
sudo dnf install espeak-ng
```

### Install Python Dependencies

```bash
# Clone the repository (or download)
git clone <your-repo-url>
cd knik

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## 🚀 Quick Start

### Basic Usage

```python
from lib import VoiceModel, AudioProcessor

# Initialize model and audio processor
voice_model = VoiceModel(voice='am_adam')  # Male voice
audio_processor = AudioProcessor()

# Generate and play speech
text = "Hello! This is Knik text-to-speech system."
audio_generator = voice_model.generate(text)
audio_processor.stream_play(audio_generator)
```

### Save Audio to File

```python
from lib import VoiceModel, AudioProcessor

voice_model = VoiceModel(voice='af_heart')  # Female voice
audio_processor = AudioProcessor()

text = "This will be saved to a file."

# Synthesize complete audio
audio, sample_rate = voice_model.synthesize(text)

# Save to file
audio_processor.save(audio, "output.wav")
```

### Run the Main Demo

```bash
python src/main.py
```

## 🤖 AI Integration

Knik includes built-in AI integration for querying AI models and speaking responses:

```python
from lib import AIClient, VoiceModel, AudioProcessor

# Initialize AI and TTS
ai = AIClient(provider="vertex", project_id="your-project")
voice = VoiceModel(voice='am_adam')
audio = AudioProcessor()

# Query AI and speak response
response = ai.query("What is quantum computing?", max_tokens=2048)
audio_gen = voice.generate(response)
audio.stream_play(audio_gen)
```

See [AI Client Guide](./guides/ai_client_guide.md) for full documentation.

## 📖 Documentation

### 📚 Library Documentation
- **[Library Reference](./library/library_reference.md)** - Complete API documentation for all modules
- **[Extending Voice Models](./library/extending_voice_models.md)** - Guide to adding custom TTS engines

### 📘 Guides
- **[Console App Guide](./guides/console_app_guide.md)** - ⭐ Interactive AI console with voice
- **[AI Client Guide](./guides/ai_client_guide.md)** - AI integration and usage
- **[AI Client Quick Reference](./guides/ai_client_quick.md)** - Quick AI examples
- **[Demo Guide](./guides/demo_guide.md)** - Guide to running demo scripts

### 🎯 Planning & Roadmap
- **[Voice Agent Plan](./plan/voice_agent_plan.md)** - Future vision for voice agent development

## 🎭 Available Voices

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

## 🌍 Supported Languages

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

## 🏗️ Project Structure

```
knik/
├── src/
│   ├── lib/                    # Core library modules
│   │   ├── __init__.py         # Package initialization
│   │   ├── config.py           # Configuration and constants
│   │   ├── voice_model.py      # TTS model interface
│   │   ├── audio_processor.py  # Audio I/O and playback
│   │   └── ai_client.py        # AI integration (Vertex AI, etc.)
│   ├── demo/                   # Demo and test scripts
│   │   ├── demo.py             # Feature showcase demos
│   │   ├── test_segments.py    # Segmentation tests
│   │   ├── quick_segment_test.py
│   │   └── main_multisegment.py
│   └── main.py                 # Main application entry point
├── docs/                       # Documentation
│   ├── README.md               # This file (main documentation)
│   ├── library/                # Library API documentation
│   │   ├── library_reference.md
│   │   └── extending_voice_models.md
│   ├── guides/                 # User guides and tutorials
│   │   ├── ai_client_guide.md
│   │   ├── ai_client_quick.md
│   │   ├── demo_guide.md
│   │   └── project_organization.md
│   └── plan/                   # Future planning and roadmap
│       └── voice_agent_plan.md
├── requirements.txt            # Python dependencies
└── package.json                # Project metadata
```

## 🎮 Demo Scripts

The project includes several demo scripts in `src/demo/`:

### 1. Feature Showcase (`demo.py`)
```bash
python src/demo/demo.py
```
Interactive demo showing:
- Streaming playback
- Saving to files
- Multiple voice comparison
- Segment saving
- Custom text input

### 2. Segmentation Tests (`test_segments.py`)
```bash
python src/demo/test_segments.py
```
Demonstrates how text is split into segments.

### 3. Quick Segment Test (`quick_segment_test.py`)
```bash
python src/demo/quick_segment_test.py
```
Quick test to see segmentation in action.

### 4. Multi-Segment Example (`main_multisegment.py`)
```bash
python src/demo/main_multisegment.py
```
Example showing multiple segment generation.

## 💡 Usage Examples

### Change Voice Mid-Session

```python
voice_model = VoiceModel(voice='af_heart')

# Generate with default voice
audio1, _ = voice_model.synthesize("Hello from voice one.")

# Change voice
voice_model.set_voice('am_adam')

# Generate with new voice
audio2, _ = voice_model.synthesize("Hello from voice two.")
```

### Change Language

```python
from lib import AudioConfig

# Start with English
voice_model = VoiceModel(language='a', voice='af_heart')

# Change to Spanish
voice_model.set_language('es')
```

### Save Multiple Segments

```python
audio_generator = voice_model.generate("Long text here...")

saved_files = audio_processor.save_segments(
    audio_generator,
    output_dir="output/segments",
    prefix="segment"
)
```

## 🔧 API Overview

### VoiceModel

```python
# Initialize
model = VoiceModel(language='a', voice='am_adam')

# Generate streaming audio
for graphemes, phonemes, audio in model.generate(text):
    # Process each segment
    pass

# Synthesize complete audio
audio, sample_rate = model.synthesize(text)

# Change settings
model.set_voice('af_heart')
model.set_language('es')

# Get info
info = model.get_info()
```

### AudioProcessor

```python
# Initialize
processor = AudioProcessor(sample_rate=24000)

# Play audio
processor.play(audio, blocking=True)

# Stream and play
processor.stream_play(audio_generator)

# Save to file
processor.save(audio, "output.wav")

# Save segments
processor.save_segments(audio_generator, output_dir="output")

# Load audio
audio = processor.load("input.wav")
```

## 📊 Performance

- **Model Size**: 82 million parameters
- **Sample Rate**: 24kHz
- **Inference Speed**: Real-time or faster (depending on hardware)
- **Cost Efficient**: Lightweight compared to larger TTS models

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project uses the Kokoro-82M model which is licensed under Apache 2.0.

## 🙏 Acknowledgments

- **Kokoro TTS**: [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)
- **StyleTTS 2**: Original architecture by [@yl4579](https://huggingface.co/yl4579)

## 🐛 Troubleshooting

### Import Errors
Make sure you're in the virtual environment:
```bash
source .venv/bin/activate
```

### espeak-ng Not Found
Install espeak-ng for your platform (see Installation section).

### Audio Playback Issues
Check that your audio device is properly configured:
```python
processor = AudioProcessor()
print(processor.get_devices())
```

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

Made with ❤️ using Kokoro TTS
