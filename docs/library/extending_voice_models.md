# Extending Voice Models

The Knik library uses an abstract base class architecture for voice models, making it easy to add support for new TTS engines.

## Architecture Overview

```
VoiceModel (Abstract Base Class)
    ├── KokoroVoiceModel (Kokoro TTS implementation)
    └── YourCustomVoiceModel (Your implementation)
```

## Base Class: VoiceModel

The `VoiceModel` abstract base class defines the interface that all TTS implementations must follow:

```python
from abc import ABC, abstractmethod
from typing import Generator, Tuple, Optional
import numpy as np

class VoiceModel(ABC):
    """Abstract base class for text-to-speech models."""
    
    def __init__(self, language: str, voice: str, model_name: str):
        self.language = language
        self.voice = voice
        self.model_name = model_name
        self.sample_rate = AudioConfig.SAMPLE_RATE
    
    @abstractmethod
    def load(self) -> None:
        """Load the TTS model."""
        pass
    
    @abstractmethod
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        pass
    
    @abstractmethod
    def generate(self, text: str, voice: Optional[str] = None) 
        -> Generator[Tuple[str, str, np.ndarray], None, None]:
        """Generate speech from text with streaming output."""
        pass
    
    def synthesize(self, text: str, voice: Optional[str] = None) 
        -> Tuple[np.ndarray, int]:
        """Synthesize complete audio from text (provided by base class)."""
        # Default implementation collects all generator output
        pass
    
    @abstractmethod
    def set_voice(self, voice: str) -> None:
        """Set the voice for speech generation."""
        pass
    
    @abstractmethod
    def set_language(self, language: str) -> None:
        """Set the language for speech generation."""
        pass
    
    def get_info(self) -> dict:
        """Get information about the model (provided by base class)."""
        pass
```

## Creating a Custom Voice Model

To add support for a new TTS engine, create a subclass that implements all abstract methods:

### Example: Custom TTS Model

```python
from typing import Generator, Tuple, Optional
import numpy as np
from lib.voice_model import VoiceModel
from lib.config import AudioConfig

class MyCustomVoiceModel(VoiceModel):
    """
    Implementation for a custom TTS engine.
    """
    
    def __init__(
        self, 
        language: str = AudioConfig.DEFAULT_LANGUAGE,
        voice: str = "default_voice",
        model_name: str = "my_custom_tts"
    ):
        super().__init__(language, voice, model_name)
        self._engine = None
        self._is_ready = False
    
    def load(self) -> None:
        """Load the custom TTS model."""
        if self._engine is None:
            print(f"Loading Custom TTS (language: {self.language})...")
            # Initialize your TTS engine here
            # self._engine = YourTTSEngine(language=self.language)
            self._is_ready = True
            print("Custom TTS loaded!")
    
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self._is_ready
    
    def generate(
        self, 
        text: str, 
        voice: Optional[str] = None
    ) -> Generator[Tuple[str, str, np.ndarray], None, None]:
        """
        Generate speech from text.
        
        Yields:
            Tuple of (graphemes, phonemes, audio_chunk)
        """
        if not self.is_loaded():
            self.load()
        
        voice_to_use = voice if voice is not None else self.voice
        
        print(f"Generating speech with voice '{voice_to_use}'...")
        
        # Your TTS generation logic here
        # For each chunk of audio:
        #   1. Get graphemes (text representation)
        #   2. Get phonemes (pronunciation)
        #   3. Get audio (numpy array)
        
        # Example pseudocode:
        # for chunk in self._engine.generate(text, voice=voice_to_use):
        #     graphemes = chunk.text
        #     phonemes = chunk.phonemes
        #     audio = chunk.audio  # Should be numpy array
        #     yield graphemes, phonemes, audio
        
        # Placeholder example:
        graphemes = text
        phonemes = "p l e h o l d ər"
        audio = np.zeros(16000)  # 1 second of silence at 16kHz
        yield graphemes, phonemes, audio
    
    def set_voice(self, voice: str) -> None:
        """Set the voice for the TTS engine."""
        self.voice = voice
        print(f"Voice changed to: {voice}")
    
    def set_language(self, language: str) -> None:
        """Set the language for the TTS engine."""
        if language != self.language:
            self.language = language
            self._engine = None  # Force reload with new language
            self._is_ready = False
            print(f"Language changed to: {language}. Model will reload.")
```

## Using Your Custom Model

Once you've implemented your custom model, you can use it just like the Kokoro model:

```python
from lib import AudioProcessor
from your_module import MyCustomVoiceModel

# Initialize your custom model
voice_model = MyCustomVoiceModel(
    language='en',
    voice='custom_voice_name'
)

# Use it like any other voice model
audio_processor = AudioProcessor()
text = "Hello from my custom TTS engine!"

# Stream playback
audio_generator = voice_model.generate(text)
audio_processor.stream_play(audio_generator)

# Or synthesize complete audio
audio, sample_rate = voice_model.synthesize(text)
audio_processor.play(audio)
```

## Integration with Existing Code

To add your model to the library's exports:

1. Add your model class to `src/lib/voice_model.py`
2. Update `src/lib/__init__.py`:

```python
from .voice_model import VoiceModel, KokoroVoiceModel, MyCustomVoiceModel

__all__ = [
    'VoiceModel', 
    'KokoroVoiceModel', 
    'MyCustomVoiceModel',
    'AudioProcessor', 
    'AudioConfig', 
    'AIClient', 
    'MockAIClient'
]
```

## Example: Adding gTTS (Google Text-to-Speech)

Here's a real-world example of adding support for gTTS:

```python
from typing import Generator, Tuple, Optional
import numpy as np
from gtts import gTTS
from io import BytesIO
import soundfile as sf
from lib.voice_model import VoiceModel
from lib.config import AudioConfig

class GTTSVoiceModel(VoiceModel):
    """Google Text-to-Speech implementation."""
    
    def __init__(
        self, 
        language: str = 'en',
        voice: str = 'default',  # gTTS doesn't have multiple voices per language
        model_name: str = "gTTS"
    ):
        super().__init__(language, voice, model_name)
        self._loaded = False
    
    def load(self) -> None:
        """gTTS doesn't require pre-loading."""
        self._loaded = True
        print("gTTS ready!")
    
    def is_loaded(self) -> bool:
        return self._loaded
    
    def generate(
        self, 
        text: str, 
        voice: Optional[str] = None
    ) -> Generator[Tuple[str, str, np.ndarray], None, None]:
        """Generate speech using gTTS."""
        if not self.is_loaded():
            self.load()
        
        # gTTS generates complete audio, not streaming
        tts = gTTS(text=text, lang=self.language)
        
        # Save to BytesIO buffer
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        # Read audio data
        audio, sr = sf.read(fp)
        
        # Resample if needed to match AudioConfig.SAMPLE_RATE
        if sr != self.sample_rate:
            from scipy import signal
            audio = signal.resample(
                audio, 
                int(len(audio) * self.sample_rate / sr)
            )
        
        # Yield as single segment
        yield text, "", audio.astype(np.float32)
    
    def set_voice(self, voice: str) -> None:
        """gTTS doesn't support multiple voices per language."""
        print("Note: gTTS doesn't support voice selection.")
    
    def set_language(self, language: str) -> None:
        """Set the language code for gTTS."""
        self.language = language
        print(f"Language changed to: {language}")
```

## Key Implementation Notes

1. **Streaming vs. Complete Generation**: The `generate()` method should yield audio chunks. If your TTS engine only produces complete audio, yield it as a single chunk.

2. **Audio Format**: Audio should be returned as numpy arrays of type `float32` or `float64`, with values typically in the range [-1.0, 1.0].

3. **Sample Rate**: Ensure your audio matches `AudioConfig.SAMPLE_RATE` (default: 24000 Hz). Resample if necessary.

4. **Graphemes and Phonemes**: The generator yields tuples of (graphemes, phonemes, audio). If your TTS doesn't provide phonemes, you can use an empty string.

5. **Error Handling**: Add appropriate error handling in your implementation for robustness.

6. **Model Loading**: Implement lazy loading in `load()` to avoid loading the model until it's actually needed.

## Testing Your Implementation

Create a simple test script:

```python
from your_module import MyCustomVoiceModel
from lib import AudioProcessor

def test_custom_model():
    model = MyCustomVoiceModel()
    processor = AudioProcessor()
    
    text = "Testing my custom voice model."
    
    # Test loading
    model.load()
    assert model.is_loaded()
    
    # Test generation
    audio_gen = model.generate(text)
    processor.stream_play(audio_gen)
    
    # Test synthesis
    audio, sr = model.synthesize(text)
    assert len(audio) > 0
    assert sr == model.sample_rate
    
    print("All tests passed!")

if __name__ == "__main__":
    test_custom_model()
```

## Benefits of This Architecture

- **Separation of Concerns**: Each TTS engine is isolated in its own class
- **Easy Testing**: Mock implementations can be created for testing
- **Consistent Interface**: All TTS models work the same way for users
- **Extensibility**: New models can be added without modifying existing code
- **Type Safety**: Abstract methods ensure all required functionality is implemented
