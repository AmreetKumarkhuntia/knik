import re

from lib.services.ai_client.base_tool import BaseTool


TEXT_DEFINITIONS = [
    {
        "name": "word_count",
        "description": "Count words, characters, and lines in text",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "Text to analyze"}},
            "required": ["text"],
        },
    },
    {
        "name": "find_and_replace",
        "description": "Find and replace text in a string",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to process"},
                "find": {"type": "string", "description": "Text to find"},
                "replace": {"type": "string", "description": "Text to replace with"},
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether search is case-sensitive (default: true)",
                    "default": True,
                },
            },
            "required": ["text", "find", "replace"],
        },
    },
    {
        "name": "extract_emails",
        "description": "Extract email addresses from text",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "Text to extract emails from"}},
            "required": ["text"],
        },
    },
    {
        "name": "extract_urls",
        "description": "Extract URLs from text",
        "parameters": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "Text to extract URLs from"}},
            "required": ["text"],
        },
    },
    {
        "name": "text_case_convert",
        "description": "Convert text to different cases (upper, lower, title, capitalize, snake_case, camelCase, kebab-case)",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to convert"},
                "case_type": {
                    "type": "string",
                    "description": "Case type: upper, lower, title, capitalize, snake, camel, kebab",
                },
            },
            "required": ["text", "case_type"],
        },
    },
]
from lib.utils.printer import printer


class TextTool(BaseTool):
    @property
    def name(self) -> str:
        return "text"

    def get_definitions(self):
        return TEXT_DEFINITIONS

    def get_implementations(self):
        return {
            "word_count": self._word_count,
            "find_and_replace": self._find_and_replace,
            "extract_emails": self._extract_emails,
            "extract_urls": self._extract_urls,
            "text_case_convert": self._text_case_convert,
        }

    @staticmethod
    def _extract_pattern(text: str, pattern: str, pattern_name: str) -> str:
        matches = re.findall(pattern, text)
        return ", ".join(matches) if matches else f"No {pattern_name} found"

    @staticmethod
    def _word_count(text: str) -> str:
        printer.info(f"🔧 Counting words in text ({len(text)} characters)")
        words = len(text.split())
        chars = len(text)
        chars_no_spaces = len(text.replace(" ", ""))
        lines = len(text.splitlines())
        return f"Words: {words}, Characters: {chars}, Characters (no spaces): {chars_no_spaces}, Lines: {lines}"

    @staticmethod
    def _find_and_replace(text: str, find: str, replace: str, case_sensitive: bool = True) -> str:
        printer.info(f"🔧 Finding and replacing: '{find}' → '{replace}' (case_sensitive={case_sensitive})")
        if not case_sensitive:
            pattern = re.compile(re.escape(find), re.IGNORECASE)
            result = pattern.sub(replace, text)
        else:
            result = text.replace(find, replace)
        return result

    def _extract_emails(self, text: str) -> str:
        printer.info("🔧 Extracting emails from text")
        return self._extract_pattern(text, r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "email addresses")

    def _extract_urls(self, text: str) -> str:
        printer.info("🔧 Extracting URLs from text")
        return self._extract_pattern(
            text, r"http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+", "URLs"
        )

    @staticmethod
    def _to_snake_case(text: str) -> str:
        text = re.sub(r"(?<!^)(?=[A-Z])", "_", text).lower()
        return text.replace(" ", "_").replace("-", "_")

    @staticmethod
    def _to_camel_case(text: str) -> str:
        words = text.replace("_", " ").replace("-", " ").split()
        return words[0].lower() + "".join(word.capitalize() for word in words[1:]) if words else text

    @staticmethod
    def _to_kebab_case(text: str) -> str:
        text = re.sub(r"(?<!^)(?=[A-Z])", "-", text).lower()
        return text.replace(" ", "-").replace("_", "-")

    def _text_case_convert(self, text: str, case_type: str) -> str:
        printer.info(f"🔧 Converting text case to: {case_type}")
        converters = {
            "upper": str.upper,
            "lower": str.lower,
            "title": str.title,
            "capitalize": str.capitalize,
            "snake": self._to_snake_case,
            "camel": self._to_camel_case,
            "kebab": self._to_kebab_case,
        }
        converter = converters.get(case_type.lower())
        if converter:
            return converter(text)
        return f"Unknown case type: {case_type}. Use: {', '.join(converters.keys())}"
