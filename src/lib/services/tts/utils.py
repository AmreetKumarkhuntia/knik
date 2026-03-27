"""
Text-to-speech text filtering utility.
"""

import re


def filter_tts_text(text: str) -> str:
    """
    Cleans up text for TTS processing by removing:
    - Emojis and other supplementary Unicode characters
    - Markdown characters like *, _, #, `, ~, >
    - URLs
    """
    if not text:
        return text
    # Remove URLs
    text = re.sub(r"http[s]?://\S+", "", text)

    # Remove emojis and other symbols
    text = re.sub(r"[\U00010000-\U0010ffff]", "", text)
    text = re.sub(r"[\u2600-\u27BF]", "", text)

    # Remove Markdown characters
    text = re.sub(r"[*_`#~>\[\]()]", "", text)

    # Remove multiple spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def is_speakable(text: str) -> bool:
    """
    Check whether *text* contains anything a TTS engine can actually
    vocalise after filtering.  Returns ``False`` for empty strings,
    pure punctuation / whitespace, or text that reduces to nothing
    after :func:`filter_tts_text`.
    """
    filtered = filter_tts_text(text)
    if not filtered:
        return False
    # Strip residual punctuation / whitespace — if nothing remains, skip TTS
    stripped = re.sub(r"[^\w]", "", filtered)
    return len(stripped) > 0
