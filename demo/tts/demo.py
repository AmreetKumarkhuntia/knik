"""
Demo script showcasing different features of the Knik TTS library.
"""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import AudioProcessor, Config, KokoroVoiceModel


def demo_streaming_playback():
    """Demo 1: Stream audio directly to speakers."""
    print("\n" + "=" * 60)
    print("DEMO 1: Streaming Playback")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="af_heart")
    audio_processor = AudioProcessor()

    text = "This is a demonstration of streaming audio playback."

    audio_generator = voice_model.generate(text)
    audio_processor.stream_play(audio_generator)


def demo_save_to_file():
    """Demo 2: Generate and save complete audio to file."""
    print("\n" + "=" * 60)
    print("DEMO 2: Save Audio to File")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="am_michael")
    audio_processor = AudioProcessor()

    text = "This audio will be saved to a file for later playback."

    # Synthesize complete audio
    audio, sample_rate = voice_model.synthesize(text)

    # Save to file
    output_path = Path("output/demo_output.wav")
    output_path.parent.mkdir(exist_ok=True)
    audio_processor.save(audio, output_path)


def demo_multiple_voices():
    """Demo 3: Compare different voices."""
    print("\n" + "=" * 60)
    print("DEMO 3: Multiple Voice Comparison")
    print("=" * 60)

    audio_processor = AudioProcessor()
    text = "Hello, this is a voice test."

    voices = ["af_heart", "am_adam", "af_bella"]

    for voice in voices:
        print(f"\nGenerating with voice: {voice}")
        voice_model = KokoroVoiceModel(voice=voice)

        audio, _ = voice_model.synthesize(text)

        print(f"Playing: {voice}")
        audio_processor.play(audio)


def demo_save_segments():
    """Demo 4: Save individual audio segments."""
    print("\n" + "=" * 60)
    print("DEMO 4: Save Audio Segments")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="af_sarah")
    audio_processor = AudioProcessor()

    text = "This longer text will be split into multiple segments. Each segment will be saved separately."

    audio_generator = voice_model.generate(text)

    output_dir = Path("output/segments")
    saved_files = audio_processor.save_segments(audio_generator, output_dir=output_dir, prefix="demo_segment")

    print(f"\nSaved {len(saved_files)} files:")
    for file in saved_files:
        print(f"  - {file}")


def demo_custom_text():
    """Demo 5: Interactive custom text input."""
    print("\n" + "=" * 60)
    print("DEMO 5: Custom Text Input")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="am_adam")
    audio_processor = AudioProcessor()

    print("\nAvailable voices:")
    for voice_name in Config.VOICES.values():
        print(f"  - {voice_name}")

    try:
        voice = input("\nChoose a voice (or press Enter for default 'am_adam'): ").strip()
        if voice and voice in Config.VOICES.values():
            voice_model.set_voice(voice)

        text = input("Enter text to synthesize: ").strip()

        if text:
            print(f"\nGenerating speech for: '{text}'")
            audio_generator = voice_model.generate(text)
            audio_processor.stream_play(audio_generator)
        else:
            print("No text entered. Skipping...")

    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user.")


def main():
    """Run all demos."""
    print("\n" + "=" * 60)
    print("KNIK TTS LIBRARY - DEMO SUITE")
    print("=" * 60)

    demos = {
        "1": ("Streaming Playback", demo_streaming_playback),
        "2": ("Save Audio to File", demo_save_to_file),
        "3": ("Multiple Voice Comparison", demo_multiple_voices),
        "4": ("Save Audio Segments", demo_save_segments),
        "5": ("Custom Text Input", demo_custom_text),
        "all": ("Run All Demos", None),
    }

    print("\nAvailable demos:")
    for key, (name, _) in demos.items():
        print(f"  {key}. {name}")

    try:
        choice = input("\nSelect demo (1-5 or 'all'): ").strip().lower()

        if choice == "all":
            demo_streaming_playback()
            demo_save_to_file()
            demo_multiple_voices()
            demo_save_segments()
            demo_custom_text()
        elif choice in demos and demos[choice][1]:
            demos[choice][1]()
        else:
            print("Invalid choice. Running demo 1 as default...")
            demo_streaming_playback()

    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user.")

    print("\n" + "=" * 60)
    print("Demo complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
