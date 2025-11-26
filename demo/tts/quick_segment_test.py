"""
Quick test to see text segmentation in action.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import KokoroVoiceModel, AudioProcessor

# Initialize
voice_model = KokoroVoiceModel(voice='am_adam')
audio_processor = AudioProcessor()

# Different text examples - uncomment one to test

# Example 1: Short text (usually 1 segment)
# text = "Hello! I am the greatest."

# Example 2: Multiple clear sentences (usually multiple segments)
text = """
This is sentence one. This is sentence two. This is sentence three.
This is sentence four. This is sentence five.
"""

# Example 3: Long paragraph (definitely multiple segments)
# text = """
# Artificial intelligence has revolutionized many aspects of our daily lives.
# From voice assistants to recommendation systems, AI is everywhere.
# Machine learning algorithms process vast amounts of data.
# They identify patterns that humans might miss.
# Natural language processing enables computers to understand human speech.
# Computer vision allows machines to interpret visual information.
# The future of AI holds even more exciting possibilities.
# """

# Example 4: List format (typically one segment per item)
# text = """
# First: prepare the ingredients.
# Second: heat the pan.
# Third: cook the food.
# Fourth: serve and enjoy.
# """

print("=" * 70)
print("SEGMENTATION TEST")
print("=" * 70)
print(f"\nInput text:\n{text}\n")
print("=" * 70)
print("\nGenerating speech with segmentation info:\n")

# Generate and count segments
segment_count = 0
for graphemes, phonemes, audio in voice_model.generate(text):
    segment_count += 1
    duration = len(audio) / 24000
    print(f"Segment {segment_count}:")
    print(f"  Text: {graphemes}")
    print(f"  Duration: {duration:.2f}s")
    print()
    
    # Play the audio
    audio_processor.play(audio, blocking=True)

print("=" * 70)
print(f"Total segments generated: {segment_count}")
print("=" * 70)

print("\n💡 TIP: Text is split based on:")
print("  - Sentence boundaries (periods, exclamation marks, question marks)")
print("  - Natural pauses and punctuation")
print("  - Text length (very long sentences may be split)")
print("  - Phoneme processing by the model")
