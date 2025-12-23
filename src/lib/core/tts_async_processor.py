import time
from collections import deque
from pathlib import Path
from threading import Thread
from typing import Callable

from ..services.audio_processor import AudioProcessor
from ..services.voice_model import KokoroVoiceModel
from ..utils import printer
from .config import Config


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
    audio_ready_callback: Callable | None

    def __init__(
        self,
        sample_rate: int,
        voice_model: str = Config.DEFAULT_TTS,
        save_dir: str | None = None,
        play_voice: bool = True,
        sleep_duration: int = 0.3,
        audio_ready_callback: Callable[[bytes, int], None] | None = None,
    ):
        self.audio_processor = AudioProcessor(sample_rate)
        self.audio_processor_class = "kokoro"
        self.tts_processor = KokoroVoiceModel()
        self.should_process = True
        self.should_play = play_voice
        self.text_processing_queue = deque()
        self.audio_processing_queue = deque()
        self.save_dir: Path | None = Path(save_dir) if save_dir else None
        self.is_async_playback_active = False
        self.is_generating = False  # Track if TTS generation is in progress
        self.sleep_duration = sleep_duration
        self.audio_ready_callback = audio_ready_callback
        if self.save_dir is not None:
            self.save_dir.mkdir(parents=True, exist_ok=True)

    def play_async(self, text: str) -> None:
        self.text_processing_queue.append(text)
        printer.info("Text added to queue")

    def start_async_processing(self) -> None:
        printer.info("Starting async TTS processing...")
        self.should_process = True
        self.tts_processor.load()
        Thread(target=self.__text_processor__, daemon=True).start()
        Thread(target=self.__audio_processor__, daemon=True).start()
        printer.success("Async TTS processors started")

    def set_save_dir(self, save_dir: str | None) -> None:
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
        not_generating = not self.is_generating
        printer.debug(f"tts processing queue is empty: '{queues_empty}' & is not playing: {not_playing} & not generating: {not_generating}")
        return queues_empty and not_playing and not_generating

    def set_audio_ready_callback(self, callback: Callable[[bytes, int], None] | None) -> None:
        """Set callback to be called when audio is ready (before playback)"""
        self.audio_ready_callback = callback

    def __text_processor__(self) -> None:
        printer.info("Text processor started")
        while self.should_process:
            if len(self.text_processing_queue) > 0:
                text = self.text_processing_queue.popleft()
                try:
                    self.is_generating = True
                    audio, sample_rate = self.tts_processor.generate(text)
                    self.audio_processing_queue.append((audio, sample_rate))
                    printer.debug("Audio generated")
                except Exception as e:
                    printer.error(f"Error processing text: {e}")
                finally:
                    self.is_generating = False
            time.sleep(self.sleep_duration)
        printer.info("Text processor stopped")

    def __audio_processor__(self) -> None:
        printer.info("Audio processor started")
        while self.should_process:
            if not self.audio_processor.is_playing():
                if len(self.audio_processing_queue) > 0:
                    self.is_async_playback_active = True
                    audio, sample_rate = self.audio_processing_queue.popleft()

                    # Call callback if set (for streaming to frontend)
                    if self.audio_ready_callback:
                        try:
                            self.audio_ready_callback(audio, sample_rate)
                        except Exception as e:
                            printer.error(f"Audio callback error: {e}")

                    if self.save_dir:
                        try:
                            timestamp = int(time.time() * 1000)
                            filepath = self.save_dir / f"segment_{timestamp}.wav"
                            self.audio_processor.save(audio, filepath)
                            printer.info(f"Audio saved: {filepath.name}")
                        except Exception as e:
                            printer.error(f"Failed to save audio: {e}")

                    if self.should_play:
                        printer.debug("Playing audio...")
                        self.audio_processor.play(audio, blocking=True)
                        printer.debug("Completed Playback")

                if len(self.audio_processing_queue) == 0 and len(self.text_processing_queue) == 0:
                    self.is_async_playback_active = False
            time.sleep(self.sleep_duration)
        printer.info("Audio processor stopped")
