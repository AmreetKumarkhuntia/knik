# Knik - Text-to-Speech System

High-quality text-to-speech powered by Kokoro-82M with a clean, modular Python API.

## 🚀 Quick Start

```bash
# Run the interactive AI console with voice (default mode)
python src/main.py

# Or explicitly specify console mode
python src/main.py --mode console

# Try demos
python demo/tts/demo.py
python demo/console/console_app_demo.py
python demo/ai/simple_ai_tts.py
```

## 📚 Documentation

All documentation is in the `docs/` folder:

- **[docs/README.md](docs/README.md)** - Complete documentation, installation, usage
- **[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)** - Configuration via environment variables
- **[docs/library/](docs/library/)** - API reference and technical docs
- **[docs/guides/](docs/guides/)** - User guides and tutorials
- **[docs/plan/](docs/plan/)** - Roadmap and future plans

## 📦 Installation

```bash
# Install espeak-ng (required)
brew install espeak-ng  # macOS

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 🎯 Features

### Text-to-Speech
- ✅ High-quality TTS with Kokoro-82M (82M parameters)
- ✅ Multiple voices (male & female)
- ✅ Multi-language support
- ✅ Real-time streaming playback
- ✅ Save to WAV files

### AI Console App (NEW! 🎉)
- ✅ Interactive chat with AI (Google Gemini)
- ✅ Voice-enabled responses
- ✅ Context-aware conversations
- ✅ Command system (/help, /history, /voice, etc.)
- ✅ Conversation history tracking

### Library
- ✅ Modular, reusable components
- ✅ Clean Python API
- ✅ Easy integration

## 💡 Usage Example

```python
# Import from the lib package (when running from src/)
import sys
sys.path.insert(0, 'src')

from lib import KokoroVoiceModel, AudioProcessor

# Initialize
voice_model = KokoroVoiceModel(voice='am_adam')
audio_processor = AudioProcessor()

# Generate and play
text = "Hello! This is Knik TTS."
audio_generator = voice_model.generate(text)
audio_processor.stream_play(audio_generator)
```

## 📁 Project Structure

```
knik/
├── docs/                       # 📚 Documentation
│   ├── guides/                 # User guides (Console App, AI Client, etc.)
│   ├── library/                # API reference
│   └── plan/                   # Roadmap and future plans
├── src/
│   ├── apps/                   # 🎯 Applications
│   │   └── console/            # Interactive AI console app
│   ├── lib/                    # 🔧 Core library
│   │   ├── core/               # Config & core utilities
│   │   ├── services/           # AI, Voice, Audio services
│   │   └── utils/              # Console processor, printer
│   └── main.py                 # 🚀 Main entry point
├── demo/                       # 🎮 Demo scripts
│   ├── console/                # Console app demos
│   ├── tts/                    # TTS demos
│   └── ai/                     # AI + TTS integration demos
├── requirements.txt            # Python dependencies
└── package.json                # Project metadata & scripts
```

## 🎭 Available Voices

**Female**: `af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_sky`  
**Male**: `am_adam`, `am_michael`, `am_leo`, `am_ryan`

## 📄 License

Apache 2.0 (via Kokoro-82M)

## 🙏 Credits

Built with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad

---

**Ready to use!** Start with `python src/main.py` or see [docs/README.md](docs/README.md) for details.
