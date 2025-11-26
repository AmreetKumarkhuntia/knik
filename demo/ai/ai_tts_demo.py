"""
AI + TTS Integration Demo
Query AI (Vertex AI / Gemini) and speak the response using TTS.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.lib import KokoroVoiceModel, AudioProcessor, AIClient, MockAIClient, Config


def demo_basic_ai_query():
    """Demo 1: Basic AI query with TTS response."""
    print("\n" + "=" * 70)
    print("DEMO 1: Basic AI Query + TTS Response")
    print("=" * 70)
    
    # Initialize AI client (will use mock if not configured)
    try:
        ai_client = AIClient(
            provider='vertex',
            project_id='dev-ai-gamma',
            location='us-east5',
            model_name='gemini-2.5-flash'
        )
        if not ai_client.is_configured():
            print("⚠️  Vertex AI not configured. Using mock responses.")
            print("To use real AI: Set GOOGLE_CLOUD_PROJECT environment variable\n")
            ai_client = MockAIClient()
    except Exception as e:
        print(f"⚠️  Cannot initialize Vertex AI: {e}")
        print("Using mock client instead.\n")
        ai_client = MockAIClient()
    
    # Initialize TTS
    voice_model = KokoroVoiceModel(voice='af_heart')
    audio_processor = AudioProcessor()
    
    # Ask a question
    question = "What is artificial intelligence in simple terms? Create a short para for a child to understand"
    system_instruction = """
        Avoid all markdown or special characters.
        Use plain text only.
        Write in a clear, linear flow suitable for text to speech.
        Do not use bullets, stars, underscores, hashes, or decorative formatting.
        Keep responses simple, direct, and easy to read aloud.
    """
    print(f"Question: {question}\n")
    
    # Get AI response
    print("Querying AI...")
    # Use higher token count to account for thinking mode if enabled
    response = ai_client.query(question, max_tokens=2048, temperature=0.7, system_instruction = system_instruction)
    print(f"AI Response: {response}\n")
    
    # Speak the response
    print("Speaking response...")
    audio_generator = voice_model.generate(response)
    audio_processor.stream_play(audio_generator, show_progress=False)
    
    print("\n✅ Demo complete!")


def demo_interactive_ai_conversation():
    """Demo 2: Interactive conversation with AI + TTS."""
    print("\n" + "=" * 70)
    print("DEMO 2: Interactive AI Conversation")
    print("=" * 70)
    
    # Initialize components
    try:
        ai_client = AIClient()
        if not ai_client.is_configured():
            ai_client = MockAIClient()
            print("⚠️  Using mock AI (set GOOGLE_CLOUD_PROJECT for real AI)\n")
    except:
        ai_client = MockAIClient()
    
    voice_model = KokoroVoiceModel(voice='am_adam')
    audio_processor = AudioProcessor()
    
    print("Available voices:", list(Config.VOICES.values()))
    print("\nAsk questions and hear AI responses!")
    print("Type 'quit' to exit, 'voice' to change voice\n")
    
    while True:
        try:
            # Get user input
            question = input("You: ").strip()
            
            if not question:
                continue
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break
            
            if question.lower() == 'voice':
                new_voice = input("Enter voice name: ").strip()
                if new_voice in Config.VOICES.values():
                    voice_model.set_voice(new_voice)
                    print(f"✅ Voice changed to: {new_voice}")
                else:
                    print("❌ Invalid voice name")
                continue
            
            # Query AI
            print("AI: ", end="", flush=True)
            response = ai_client.query(question, max_tokens=2048, temperature=0.7)
            print(response)
            
            # Speak response
            audio_generator = voice_model.generate(response)
            audio_processor.stream_play(audio_generator, show_progress=False)
            print()
            
        except KeyboardInterrupt:
            print("\n\nInterrupted by user. Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


def demo_ai_context_conversation():
    """Demo 3: AI conversation with context/history."""
    print("\n" + "=" * 70)
    print("DEMO 3: AI Conversation with Context")
    print("=" * 70)
    
    try:
        ai_client = AIClient()
        if not ai_client.is_configured():
            ai_client = MockAIClient()
            print("⚠️  Using mock AI\n")
    except:
        ai_client = MockAIClient()
    
    voice_model = KokoroVoiceModel(voice='af_bella')
    audio_processor = AudioProcessor()
    
    # Conversation context
    context = []
    
    questions = [
        "What is the capital of France?",
        "What is it famous for?",  # Should understand "it" refers to Paris
        "How many people live there?"  # Should understand context
    ]
    
    print("Having a contextual conversation...\n")
    
    for question in questions:
        print(f"You: {question}")
        
        # Query with context
        print("AI: ", end="", flush=True)
        response = ai_client.query(
            question, 
            context=context if context else None,
            max_tokens=200,
            temperature=0.7
        )
        print(response)
        
        # Add to context
        context.append({"role": "user", "text": question})
        context.append({"role": "model", "text": response})
        
        # Speak response
        audio_generator = voice_model.generate(response)
        audio_processor.stream_play(audio_generator, show_progress=False)
        print()


def demo_ai_with_system_instruction():
    """Demo 4: AI with system instruction (personality)."""
    print("\n" + "=" * 70)
    print("DEMO 4: AI with Custom Personality")
    print("=" * 70)
    
    try:
        ai_client = AIClient()
        if not ai_client.is_configured():
            ai_client = MockAIClient()
            print("⚠️  Using mock AI\n")
    except:
        ai_client = MockAIClient()
    
    voice_model = KokoroVoiceModel(voice='am_leo')
    audio_processor = AudioProcessor()
    
    # System instruction for pirate personality
    system_instruction = (
        "You are a friendly pirate assistant. "
        "Answer questions in a pirate accent and style, "
        "but keep responses under 50 words."
    )
    
    questions = [
        "What is the weather like today?",
        "How do I make coffee?",
        "Tell me a fun fact."
    ]
    
    print("AI with pirate personality!\n")
    
    for question in questions:
        print(f"You: {question}")
        print("Pirate AI: ", end="", flush=True)
        
        response = ai_client.query(
            question,
            max_tokens=150,
            temperature=0.9,
            system_instruction=system_instruction
        )
        
        print(response)
        
        # Speak with pirate voice!
        audio_generator = voice_model.generate(response)
        audio_processor.stream_play(audio_generator, show_progress=False)
        print()


def demo_save_ai_responses():
    """Demo 5: Save AI responses to audio files."""
    print("\n" + "=" * 70)
    print("DEMO 5: Save AI Responses to Files")
    print("=" * 70)
    
    try:
        ai_client = AIClient()
        if not ai_client.is_configured():
            ai_client = MockAIClient()
            print("⚠️  Using mock AI\n")
    except:
        ai_client = MockAIClient()
    
    voice_model = KokoroVoiceModel(voice='af_sarah')
    audio_processor = AudioProcessor()
    
    questions = [
        "Explain machine learning in one sentence.",
        "What is quantum computing?",
        "Define artificial intelligence."
    ]
    
    output_dir = Path("output/ai_responses")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Saving responses to: {output_dir}\n")
    
    for i, question in enumerate(questions):
        print(f"Question {i+1}: {question}")
        
        # Get AI response
        response = ai_client.query(question, max_tokens=2048, temperature=0.7)
        print(f"AI: {response}\n")
        
        # Synthesize complete audio
        audio, sample_rate = voice_model.synthesize(response)
        
        # Save to file
        filename = f"ai_response_{i+1}.wav"
        filepath = output_dir / filename
        audio_processor.save(audio, filepath)
    
    print(f"\n✅ Saved {len(questions)} responses to {output_dir}")


def main():
    """Run AI + TTS demos."""
    print("\n" + "=" * 70)
    print("AI + TTS INTEGRATION DEMOS")
    print("=" * 70)
    
    demos = {
        '1': ('Basic AI Query + TTS', demo_basic_ai_query),
        '2': ('Interactive Conversation', demo_interactive_ai_conversation),
        '3': ('Contextual Conversation', demo_ai_context_conversation),
        '4': ('Custom AI Personality', demo_ai_with_system_instruction),
        '5': ('Save Responses to Files', demo_save_ai_responses),
        'all': ('Run All Demos (except interactive)', None)
    }
    
    print("\nAvailable demos:")
    for key, (name, _) in demos.items():
        print(f"  {key}. {name}")
    
    print("\n💡 Note: Set GOOGLE_CLOUD_PROJECT environment variable to use real AI.")
    print("   Otherwise, mock responses will be used.\n")
    
    try:
        choice = input("Select demo (1-5 or 'all'): ").strip().lower()
        
        if choice == 'all':
            demo_basic_ai_query()
            demo_ai_context_conversation()
            demo_ai_with_system_instruction()
            demo_save_ai_responses()
        elif choice in demos and demos[choice][1]:
            demos[choice][1]()
        else:
            print("Invalid choice. Running demo 1...")
            demo_basic_ai_query()
            
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user.")
    
    print("\n" + "=" * 70)
    print("Demo complete!")
    print("=" * 70)


if __name__ == "__main__":
    main()
