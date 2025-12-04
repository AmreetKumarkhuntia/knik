"""
Modified version of main.py showing multiple segments.
"""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import AudioProcessor, Config, KokoroVoiceModel


def main():
    """Main application function with multi-segment text."""

    voice_model = KokoroVoiceModel(language=Config.DEFAULT_LANGUAGE, voice="am_adam")

    audio_processor = AudioProcessor()

    # Multi-segment text example
    text = """
    Hello! I am the greatest of all.
    I am the almighty ruler.
    Listen to my powerful voice.
    Hahahaha! Witness my magnificence.
    Bow before my greatness.
    """

    print("=" * 60)
    print("Knik Text-to-Speech System")
    print("=" * 60)
    print(f"\nInput text:\n{text}")
    print("=" * 60)
    print("\nGenerating speech (watch for multiple segments):\n")

    audio_generator = voice_model.generate(text)
    audio_processor.stream_play(audio_generator, show_progress=True)


if __name__ == "__main__":
    main()
