"""
Demo script to show when text gets split into multiple segments.
"""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import AudioProcessor, KokoroVoiceModel


def test_single_segment():
    """Short text - typically single segment."""
    print("\n" + "=" * 60)
    print("TEST 1: Short Text (Single Segment)")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="am_adam")
    audio_processor = AudioProcessor()

    text = "Hello! I am the greatest of all."

    print(f"Text: '{text}'")
    print()

    audio_generator = voice_model.generate(text)
    audio_processor.stream_play(audio_generator)


def test_multiple_sentences():
    """Multiple sentences - may create multiple segments."""
    print("\n" + "=" * 60)
    print("TEST 2: Multiple Sentences (Multiple Segments)")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="am_adam")
    audio_processor = AudioProcessor()

    text = """Hello! This is the first sentence.
    This is the second sentence.
    And here is a third one.
    Finally, we have a fourth sentence."""

    print(f"Text: '{text}'")
    print()

    audio_generator = voice_model.generate(text)
    audio_processor.stream_play(audio_generator)


def test_long_paragraph():
    """Long paragraph - definitely multiple segments."""
    print("\n" + "=" * 60)
    print("TEST 3: Long Paragraph (Multiple Segments)")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="am_adam")
    audio_processor = AudioProcessor()

    text = """
    The weather today is absolutely beautiful. The sun is shining brightly in the sky.
    Birds are singing their melodious songs. Children are playing in the park.
    People are walking their dogs along the tree-lined streets.
    It's a perfect day to be outside and enjoy nature.
    The temperature is just right, not too hot and not too cold.
    Everyone seems to be in a good mood today.
    """

    print(f"Text: '{text}'")
    print()

    audio_generator = voice_model.generate(text)
    audio_processor.stream_play(audio_generator)


def test_with_pauses():
    """Text with explicit pauses and punctuation."""
    print("\n" + "=" * 60)
    print("TEST 4: Text with Pauses (Multiple Segments)")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="am_adam")
    audio_processor = AudioProcessor()

    text = """
    Listen carefully.
    I will now explain something important.
    First, we need to understand the basics.
    Second, we apply what we learned.
    Third, we practice until perfect.
    Finally, we master the skill.
    Are you ready? Let's begin!
    """

    print(f"Text: '{text}'")
    print()

    audio_generator = voice_model.generate(text)
    audio_processor.stream_play(audio_generator)


def test_segment_info():
    """Show detailed segment information."""
    print("\n" + "=" * 60)
    print("TEST 5: Detailed Segment Analysis")
    print("=" * 60)

    voice_model = KokoroVoiceModel(voice="am_adam")

    text = """
    The quick brown fox jumps over the lazy dog.
    This is a classic sentence used for testing.
    It contains every letter of the alphabet.
    Isn't that interesting?
    """

    print(f"Text: '{text}'")
    print("\nSegment Details:")
    print("-" * 60)

    segment_count = 0
    total_samples = 0

    for graphemes, phonemes, audio in voice_model.generate(text):
        segment_count += 1
        duration = len(audio) / 24000  # Duration in seconds
        total_samples += len(audio)

        print(f"\nSegment {segment_count}:")
        print(f"  Graphemes: {graphemes}")
        print(f"  Phonemes: {phonemes}")
        print(f"  Audio samples: {len(audio):,}")
        print(f"  Duration: {duration:.2f} seconds")

    total_duration = total_samples / 24000
    print("\n" + "=" * 60)
    print(f"Total segments: {segment_count}")
    print(f"Total duration: {total_duration:.2f} seconds")
    print("=" * 60)


def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("KOKORO SEGMENTATION ANALYSIS")
    print("Understanding when text gets split into multiple segments")
    print("=" * 70)

    tests = {
        "1": ("Short Text (Single Segment)", test_single_segment),
        "2": ("Multiple Sentences", test_multiple_sentences),
        "3": ("Long Paragraph", test_long_paragraph),
        "4": ("Text with Pauses", test_with_pauses),
        "5": ("Detailed Segment Analysis", test_segment_info),
        "all": ("Run All Tests", None),
    }

    print("\nAvailable tests:")
    for key, (name, _) in tests.items():
        print(f"  {key}. {name}")

    try:
        choice = input("\nSelect test (1-5 or 'all'): ").strip().lower()

        if choice == "all":
            test_single_segment()
            test_multiple_sentences()
            test_long_paragraph()
            test_with_pauses()
            test_segment_info()
        elif choice in tests and tests[choice][1]:
            tests[choice][1]()
        else:
            print("Invalid choice. Running test 5 as default...")
            test_segment_info()

    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\nError: {e}")

    print("\n" + "=" * 70)
    print("Analysis complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
