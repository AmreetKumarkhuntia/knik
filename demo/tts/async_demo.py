import sys
import os
import time

# Add the src directory to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../src')))

from lib.core.tts_async_processor import TTSAsyncProcessor
from lib.core.config import Config
from lib.utils import printer

def main():
    printer.info("Starting Async TTS Demo")
    
    # Initialize the processor
    # Optionally save all generated async audio segments to a directory
    save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../async_tts_output"))
    processor = TTSAsyncProcessor(sample_rate=Config.SAMPLE_RATE, save_dir=save_dir)
    
    # # Start the processing threads
    processor.start_async_processing()
    
    # Add some text to the queue
    texts = [
        "Hello, this is a test of the asynchronous text to speech processor.",
        "It allows you to queue up multiple sentences.",
        "And they will be processed and played in the background.",
        "This is useful for keeping the user interface responsive.",
        "While the audio is being generated and played."
    ]
    
    for text in texts:
        printer.info(f"Queueing: {text}")
        processor.play_async(text)
        # Simulate some delay between adding items, though not strictly necessary
        time.sleep(0.5)
    
    printer.info("All texts queued. Waiting for playback to complete...")
    
    # Keep the main thread alive while background threads work
    # In a real app, this would be your main application loop
    try:
        while len(processor.text_processing_queue) > 0 or len(processor.audio_processing_queue) > 0:
            time.sleep(0.5)
            
        # Allow some time for the last audio segment to finish playing
        printer.info("Queues empty. Waiting for final audio...")
        time.sleep(3)
        
    except KeyboardInterrupt:
        printer.info("Interrupted by user")
        
    printer.info("Demo finished")


if __name__ == "__main__":
    main()
