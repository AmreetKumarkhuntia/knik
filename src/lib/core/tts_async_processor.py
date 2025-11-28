from typing import Generator, Tuple, Optional
from collections import deque
from pathlib import Path
from threading import Thread
import time
from .config import Config
from ..services.audio_processor import AudioProcessor
from ..services.voice_model import KokoroVoiceModel
from ..utils import printer


class TTSAsyncProcessor:
    text_processing_queue: None
    audio_processing_queue: None
    tts_processor: None
    audio_processor_class: None
    audio_processor: None
    should_process: False
    should_play: False
    is_async_playback_active: False
    sleep_duration: 0.1

    def __init__(self, sample_rate: int, voice_model: str = Config.DEFAULT_TTS, save_dir: Optional[str] = None, play_voice: bool = True, sleep_duration: int = 0.3):
        self.audio_processor = AudioProcessor(sample_rate)
        self.audio_processor_class = "kokoro"
        self.tts_processor = KokoroVoiceModel()
        self.should_process = True
        self.should_play = play_voice
        self.text_processing_queue = deque()
        self.audio_processing_queue = deque()
        self.save_dir: Optional[Path] = Path(save_dir) if save_dir else None
        self.is_async_playback_active = False
        self.sleep_duration = sleep_duration
        if self.save_dir is not None:
            self.save_dir.mkdir(parents=True, exist_ok=True)
    
    def play_async(self, text: str) -> None:
        self.text_processing_queue.append(text)
        printer.info(f"Text added to queue")
    
    def start_async_processing(self) -> None:
        printer.info("Starting async TTS processing...")
        self.should_process = True
        self.tts_processor.load()
        Thread(target=self.__text_processor__, daemon=True).start()
        Thread(target=self.__audio_processor__, daemon=True).start()
        printer.success("Async TTS processors started")    

    def set_save_dir(self, save_dir: Optional[str]) -> None:
        if not save_dir:
            self.save_dir = None
            return
        path = Path(save_dir)
        path.mkdir(parents=True, exist_ok=True)
        self.save_dir = path
    
    def set_voice(self, voice: str) -> None:
        if self.audio_processor:
            self.audio_processor.set_voice(voice)
            printer.info(f"Voice changed to: {voice}")
    
    def set_language(self, language: str) -> None:
        if self.audio_processor and language != self.language:
            self.language = language
            self.audio_processor.set_language(language)
    
    def is_audio_queue_empty(self) -> bool:
        return len(self.audio_processing_queue) == 0
    
    def is_text_queue_empty(self) -> bool:
        return len(self.text_processing_queue) == 0
    
    def is_processing_complete(self) -> bool:
        queues_empty = self.is_text_queue_empty() and self.is_audio_queue_empty()
        not_playing = not self.is_async_playback_active
        printer.info(f"tts processing queue is empty: '{queues_empty} & is not playing: {not_playing}")
        return queues_empty and not_playing
    
    def __text_processor__(self) -> None:
        printer.info("Text processor started")
        while self.should_process:
            if len(self.text_processing_queue) > 0:
                text = self.text_processing_queue.popleft()
                try:
                    audio, sample_rate = self.tts_processor.generate(text)
                    self.audio_processing_queue.append(audio)
                    printer.info(f"Audio generated")
                except Exception as e:
                    printer.error(f"Error processing text: {e}")
            time.sleep(self.sleep_duration)
        printer.info("Text processor stopped")
    
    def __audio_processor__(self) -> None:
        printer.info("Audio processor started")
        while self.should_process:
            if not self.audio_processor.is_playing():
                if len(self.audio_processing_queue) > 0:
                    self.is_async_playback_active = True
                    audio = self.audio_processing_queue.popleft()
                    if self.save_dir:
                        try:
                            timestamp = int(time.time() * 1000)
                            filepath = self.save_dir / f"segment_{timestamp}.wav"
                            self.audio_processor.save(audio, filepath)
                            printer.info(f"Audio saved: {filepath.name}")
                        except Exception as e:
                            printer.error(f"Failed to save audio: {e}")
                    if self.should_play:
                        printer.info("Playing audio...")
                        self.audio_processor.play(audio, blocking=True)
                        printer.info("Completed Playback")
                
                if len(self.audio_processing_queue) == 0 and len(self.text_processing_queue) == 0:
                    self.is_async_playback_active = False
            time.sleep(self.sleep_duration)
        printer.info("Audio processor stopped")