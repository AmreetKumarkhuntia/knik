from pathlib import Path

import numpy as np
import sounddevice as sd
import soundfile as sf

from ..core.config import Config
from ..utils.printer import printer


class AudioProcessor:
    sample_rate = None
    _is_playing = False

    def __init__(self, sample_rate: int = Config.SAMPLE_RATE):
        self.sample_rate = sample_rate
        self._is_playing = False

        try:
            self.stream = sd.OutputStream(samplerate=self.sample_rate, channels=1, dtype="float32", blocksize=0)
            self.stream.start()
            printer.success("Audio output stream initialized")
        except Exception as e:
            printer.error(f"Failed to initialize audio stream: {e}")
            raise e

    def play(self, audio: np.ndarray, blocking: bool = True) -> None:
        if audio.size == 0:
            printer.warning("Cannot play empty audio")
            return

        try:
            self._is_playing = True
            audio32 = audio.astype("float32")
            self.stream.write(audio32)

            if blocking:
                sd.wait()

        except Exception as e:
            printer.error(f"Playback error: {e}")
        finally:
            printer.info("Completed playback of segment")
            self._is_playing = False

    def stream_play(self, audio_generator, show_progress: bool = True, blocking: bool = True) -> None:
        count = 0

        for g, _p, audio in audio_generator:
            if show_progress:
                printer.info(f"Playing segment {count}: {g}")
            self.play(audio, blocking)
            count += 1

        if show_progress:
            printer.success(f"Played {count} segment(s)")

    def save(self, audio: np.ndarray, filepath: str | Path, format: str | None = None) -> None:
        if audio.size == 0:
            printer.warning("Cannot save empty audio")
            return

        filepath = Path(filepath)

        try:
            sf.write(str(filepath), audio, self.sample_rate, format=format)
            printer.success(f"Saved audio to: {filepath}")
        except Exception as e:
            printer.error(f"Error saving audio: {e}")

    def save_segments(
        self, audio_generator, output_dir: str | Path = ".", prefix: str = "segment", extension: str = "wav"
    ) -> list[Path]:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        saved = []

        for i, (g, _p, audio) in enumerate(audio_generator):
            filepath = output_dir / f"{prefix}_{i}.{extension}"
            self.save(audio, filepath)
            saved.append(filepath)
            printer.info(f"Segment {i}: {g}")

        printer.success(f"Saved {len(saved)} segments")
        return saved

    def load(self, filepath: str | Path) -> np.ndarray:
        try:
            audio, sr = sf.read(str(filepath))

            if sr != self.sample_rate:
                printer.warning(f"File sample rate {sr} differs from {self.sample_rate}")

            return audio
        except Exception as e:
            printer.error(f"Error loading audio: {e}")
            return np.array([])

    def stop(self) -> None:
        try:
            sd.stop()
            self._is_playing = False
            printer.info("Playback stopped")
        except Exception as e:
            printer.error(f"Error stopping playback: {e}")

    def is_playing(self) -> bool:
        return self._is_playing

    def get_devices(self) -> dict:
        return {"devices": sd.query_devices(), "default_output": sd.query_devices(kind="output")}

    def set_sample_rate(self, sample_rate: int) -> None:
        self.sample_rate = sample_rate
        printer.info(f"Sample rate set to {sample_rate}")
