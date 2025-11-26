"""
Audio processor module for handling audio playback, recording, and file I/O.
"""

from typing import Optional, Union
import numpy as np
import sounddevice as sd
import soundfile as sf
from pathlib import Path

from ..core.config import Config
from ..utils.printer import get_printer

printer = get_printer()


class AudioProcessor:
    """
    Handles audio processing operations including playback, saving, and streaming.
    
    This class provides utilities for playing audio through speakers, saving to files,
    and other audio processing operations.
    """
    
    def __init__(self, sample_rate: int = Config.SAMPLE_RATE):
        self.sample_rate = sample_rate
        self._is_playing = False
    
    def play(self, audio: np.ndarray, blocking: bool = True) -> None:
        if audio.size == 0:
            printer.warning("Cannot play empty audio array")
            return
        
        self._is_playing = True
        
        try:
            sd.play(audio, self.sample_rate)
            if blocking:
                sd.wait()
        except Exception as e:
            printer.error(f"Error during playback: {e}")
        finally:
            self._is_playing = False
    
    def stream_play(
        self, 
        audio_generator, 
        show_progress: bool = True,
        blocking: bool = True
    ) -> None:
        segment_count = 0
        
        for graphemes, phonemes, audio in audio_generator:
            if show_progress:
                printer.info(f"Playing segment {segment_count}: {graphemes}")
            
            self.play(audio, blocking)
            segment_count += 1
        
        if show_progress:
            printer.success(f"Playback complete! Played {segment_count} segment(s)")
    
    def save(
        self, 
        audio: np.ndarray, 
        filepath: Union[str, Path],
        format: Optional[str] = None
    ) -> None:
        if audio.size == 0:
            printer.warning("Cannot save empty audio array")
            return
        
        filepath = Path(filepath)
        
        try:
            sf.write(str(filepath), audio, self.sample_rate, format=format)
            printer.success(f"Saved audio to: {filepath} ({self.sample_rate}Hz)")
        except Exception as e:
            printer.error(f"Error saving audio: {e}")
    
    def save_segments(
        self, 
        audio_generator,
        output_dir: Union[str, Path] = ".",
        prefix: str = "segment",
        extension: str = "wav"
    ) -> list[Path]:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        saved_files = []
        
        for i, (graphemes, phonemes, audio) in enumerate(audio_generator):
            filename = f"{prefix}_{i}.{extension}"
            filepath = output_dir / filename
            
            self.save(audio, filepath)
            saved_files.append(filepath)
            
            printer.info(f"Segment {i}: {graphemes}")
        
        printer.success(f"Saved {len(saved_files)} segment(s) to {output_dir}")
        return saved_files
    
    def load(self, filepath: Union[str, Path]) -> np.ndarray:
        try:
            audio, file_sample_rate = sf.read(str(filepath))
            
            if file_sample_rate != self.sample_rate:
                printer.warning(f"File sample rate ({file_sample_rate}Hz) differs "
                      f"from processor sample rate ({self.sample_rate}Hz)")
            
            return audio
        except Exception as e:
            printer.error(f"Error loading audio: {e}")
            return np.array([])
    
    def stop(self) -> None:
        if self._is_playing:
            sd.stop()
            self._is_playing = False
            printer.info("Playback stopped")
    
    def is_playing(self) -> bool:
        return self._is_playing
    
    def get_devices(self) -> dict:
        return {
            'devices': sd.query_devices(),
            'default_output': sd.query_devices(kind='output')
        }
    
    def set_sample_rate(self, sample_rate: int) -> None:
        self.sample_rate = sample_rate
        printer.info(f"Sample rate changed to: {sample_rate}Hz")
