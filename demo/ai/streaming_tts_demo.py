"""
Demo: Streaming AI Response with Chunk-by-Chunk TTS
This demo shows how streaming significantly improves perceived responsiveness.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))

from lib import AIClient, KokoroVoiceModel, AudioProcessor, printer


def demo_without_streaming():
    """Traditional approach: wait for full response, then generate audio."""
    print("\n" + "="*60)
    print("Demo 1: Traditional Approach (No Streaming)")
    print("="*60)
    
    ai_client = AIClient(
            provider='vertex',
            project_id='dev-ai-gamma',
            location='us-east5',
            model_name='gemini-2.5-flash'
        )
    voice_model = KokoroVoiceModel()
    audio_processor = AudioProcessor()
    
    prompt = "Tell me about the benefits of streaming."
    
    printer.info("🤔 Waiting for complete AI response...")
    response = ai_client.query(prompt)
    
    print(f"\n✓ Response received: {response}\n")
    
    printer.info("🎙️ Generating voice for entire response...")
    audio, sample_rate = voice_model.synthesize(response)
    
    printer.info("🔊 Playing audio...")
    audio_processor.play(audio, blocking=True)
    
    printer.success("Complete! (Notice the delay before audio starts)")


def demo_with_streaming():
    """Modern approach: stream text and generate audio chunk-by-chunk."""
    print("\n" + "="*60)
    print("Demo 2: Streaming Approach")
    print("="*60)
    
    ai_client = AIClient(
            provider='vertex',
            project_id='dev-ai-gamma',
            location='us-east5',
            model_name='gemini-2.5-flash'
        )
    voice_model = KokoroVoiceModel()
    audio_processor = AudioProcessor()
    
    prompt = "Tell me about the benefits of streaming."
    
    printer.info("🤔 Streaming AI response...")
    
    # Stream response
    response_stream = ai_client.query_stream(prompt)
    
    print("\n💬 Text appears as it arrives: ", end="", flush=True)
    
    chunk_count = 0
    for chunk in response_stream:
        chunk_count += 1
        
        # Display text immediately
        print(chunk, end="", flush=True)
        
        # Generate and play audio for this chunk if it has content
        if chunk.strip():
            printer.info(f"🎙️ Generating audio for chunk {chunk_count}...")
            audio, sample_rate = voice_model.synthesize(chunk)
            
            printer.info(f"🔊 Playing chunk {chunk_count}...")
            audio_processor.play(audio, blocking=True)
    
    print()
    printer.success(f"Complete! Audio started much faster ({chunk_count} chunks)")


def demo_comparison():
    """Side-by-side comparison."""
    print("\n" + "="*70)
    print("Streaming vs Non-Streaming TTS Demo")
    print("="*70)
    print("\nThis demo compares two approaches:")
    print("1. Traditional: Wait for full response → Generate all audio → Play")
    print("2. Streaming: Stream response → Generate audio per chunk → Play immediately")
    print("\nNotice how streaming provides faster time-to-first-audio!\n")
    
    input("Press Enter to see traditional approach...")
    demo_without_streaming()
    
    input("\n\nPress Enter to see streaming approach...")
    demo_with_streaming()
    
    print("\n" + "="*70)
    print("Summary:")
    print("- Streaming approach starts playing audio much sooner")
    print("- Text appears progressively, providing better UX")
    print("- Overall perceived latency is much lower")
    print("="*70)


if __name__ == "__main__":
    try:
        demo_comparison()
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user.")
    except Exception as e:
        printer.error(f"Demo error: {e}")
        import traceback
        traceback.print_exc()
