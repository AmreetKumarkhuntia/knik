import re


def filter_tts_text(text: str) -> str:
    if not text:
        return text

    # Remove URLs
    text = re.sub(r'http[s]?://\S+', '', text)

    # Remove emojis and other symbols
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    text = re.sub(r'[\u2600-\u27BF]', '', text)

    # Remove Markdown characters
    text = re.sub(r'[*_`#~>\[\]()]', '', text)

    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()

    return text

texts = [
    "Hello world! 😊 Check this out: https://example.com/foo",
    "Here is some **bold** and *italic* text.",
    "### A Header With Emojis 🚀",
    "`Code block` with [link](https://test.com)"
]

for t in texts:
    print(repr(filter_tts_text(t)))
