import re

from ...utils.printer import printer


def _extract_pattern(text: str, pattern: str, pattern_name: str) -> str:
    """Helper to extract patterns from text."""
    matches = re.findall(pattern, text)
    return ", ".join(matches) if matches else f"No {pattern_name} found"


def word_count(text: str) -> str:
    printer.info(f"🔧 Counting words in text ({len(text)} characters)")
    words = len(text.split())
    chars = len(text)
    chars_no_spaces = len(text.replace(" ", ""))
    lines = len(text.splitlines())

    return f"Words: {words}, Characters: {chars}, Characters (no spaces): {chars_no_spaces}, Lines: {lines}"


def find_and_replace(text: str, find: str, replace: str, case_sensitive: bool = True) -> str:
    printer.info(f"🔧 Finding and replacing: '{find}' → '{replace}' (case_sensitive={case_sensitive})")
    if not case_sensitive:
        pattern = re.compile(re.escape(find), re.IGNORECASE)
        result = pattern.sub(replace, text)
    else:
        result = text.replace(find, replace)

    return result


def extract_emails(text: str) -> str:
    printer.info("🔧 Extracting emails from text")
    return _extract_pattern(text, r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "email addresses")


def extract_urls(text: str) -> str:
    printer.info("🔧 Extracting URLs from text")
    return _extract_pattern(
        text, r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+", "URLs"
    )


def _to_snake_case(text: str) -> str:
    text = re.sub(r"(?<!^)(?=[A-Z])", "_", text).lower()
    return text.replace(" ", "_").replace("-", "_")


def _to_camel_case(text: str) -> str:
    words = text.replace("_", " ").replace("-", " ").split()
    return words[0].lower() + "".join(word.capitalize() for word in words[1:]) if words else text


def _to_kebab_case(text: str) -> str:
    text = re.sub(r"(?<!^)(?=[A-Z])", "-", text).lower()
    return text.replace(" ", "-").replace("_", "-")


_CASE_CONVERTERS = {
    "upper": str.upper,
    "lower": str.lower,
    "title": str.title,
    "capitalize": str.capitalize,
    "snake": _to_snake_case,
    "camel": _to_camel_case,
    "kebab": _to_kebab_case,
}


def text_case_convert(text: str, case_type: str) -> str:
    printer.info(f"🔧 Converting text case to: {case_type}")
    converter = _CASE_CONVERTERS.get(case_type.lower())

    if converter:
        return converter(text)

    return f"Unknown case type: {case_type}. Use: {', '.join(_CASE_CONVERTERS.keys())}"


TEXT_IMPLEMENTATIONS = {
    "word_count": word_count,
    "find_and_replace": find_and_replace,
    "extract_emails": extract_emails,
    "extract_urls": extract_urls,
    "text_case_convert": text_case_convert,
}
