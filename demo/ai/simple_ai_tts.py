"""
Simple AI + TTS Example
Ask AI a question and hear the response.
"""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import AIClient, AudioProcessor, KokoroVoiceModel, MockAIClient, printer


def main():
    """Simple AI + TTS workflow."""

    printer.header("AI + TTS - Simple Example", width=70)

    # Step 1: Initialize AI Client
    printer.blank()
    printer.info("1. Initializing AI client...")
    try:
        ai_client = AIClient()

        if not ai_client.is_configured():
            printer.warning("No Google Cloud project configured.")
            printer.info("Using mock AI client for demonstration.")
            printer.blank()
            printer.info("To use real Vertex AI:")
            printer.info("- Set GOOGLE_CLOUD_PROJECT environment variable")
            printer.info("- Ensure Google Cloud authentication is set up")
            printer.info("- Run: gcloud auth application-default login")
            printer.blank()
            ai_client = MockAIClient()
        else:
            printer.success(f"Vertex AI configured: {ai_client.get_info()}")
    except Exception as e:
        printer.warning(f"Error: {e}")
        printer.info("Using mock client.")
        printer.blank()
        ai_client = MockAIClient()

    # Step 2: Initialize TTS
    printer.blank()
    printer.info("2. Initializing text-to-speech...")
    voice_model = KokoroVoiceModel(voice="am_adam")  # Male voice
    audio_processor = AudioProcessor()
    printer.success("TTS ready!")

    # Step 3: Ask a question
    printer.blank()
    printer.info("3. Querying AI...")
    question = "What are the three laws of robotics?"
    printer.info(f"Question: {question}")

    # Get AI response
    response = ai_client.query(question, max_tokens=2048, temperature=0.7)
    printer.blank()
    printer.info(f"AI Response:\n   {response}")

    # Step 4: Convert to speech and play
    printer.blank()
    printer.info("4. Converting to speech and playing...")
    audio_generator = voice_model.generate(response)
    audio_processor.stream_play(audio_generator, show_progress=True)

    printer.blank()
    printer.separator(width=70)
    print("✅ Complete! AI query → TTS → Audio playback")
    print("=" * 70)

    # Show usage
    print("\n💡 How to use in your code:")
    print("""
    from src.lib import AIClient, VoiceModel, AudioProcessor

    # Initialize
    ai = AIClient()  # Or MockAIClient() for testing
    voice = VoiceModel(voice='am_adam')
    audio = AudioProcessor()

    # Query and speak
    response = ai.query("Your question here", max_tokens=2048)
    audio_gen = voice.generate(response)
    audio.stream_play(audio_gen)
    """)


if __name__ == "__main__":
    main()
