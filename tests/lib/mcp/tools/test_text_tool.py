"""Tests for TextTool: word count, find/replace, email/URL extraction, case conversion."""

import importlib
import importlib.util
import os
import sys
from unittest.mock import MagicMock

import pytest


# ---------------------------------------------------------------------------
# Direct module loading — bypass __init__.py chains to avoid circular imports.
# ---------------------------------------------------------------------------

_SRC = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
_SRC = os.path.abspath(_SRC)

if _SRC not in sys.path:
    sys.path.insert(0, _SRC)


def _load_module(name: str, filepath: str):
    """Load a Python module from *filepath* without triggering its package __init__."""
    if name in sys.modules:
        return sys.modules[name]
    spec = importlib.util.spec_from_file_location(name, filepath)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


# Load BaseTool first (no heavy deps)
_base_tool_mod = _load_module(
    "lib.services.ai_client.base_tool",
    os.path.join(_SRC, "lib", "services", "ai_client", "base_tool.py"),
)
BaseTool = _base_tool_mod.BaseTool

# Stub out printer so text_tool import doesn't need the full lib tree
if "lib.utils.printer" not in sys.modules:
    _printer_stub = type(sys)("lib.utils.printer")
    _printer_stub.printer = MagicMock()
    sys.modules["lib.utils.printer"] = _printer_stub

# Stub Config
if "lib.core.config" not in sys.modules:
    _config_stub_mod = type(sys)("lib.core.config")

    class _StubConfig:
        browser_headless = True
        browser_profile_dir = "/tmp/test-browser-profile"

    _config_stub_mod.Config = _StubConfig
    sys.modules["lib.core.config"] = _config_stub_mod

# Ensure the package chain stubs exist for relative imports.
for pkg in ("lib", "lib.mcp", "lib.mcp.tools", "lib.core", "lib.services", "lib.services.ai_client", "lib.utils"):
    if pkg not in sys.modules:
        sys.modules[pkg] = type(sys)(pkg)

# Wire BaseTool into the stub package
sys.modules["lib.services.ai_client"].base_tool = sys.modules["lib.services.ai_client.base_tool"]
sys.modules["lib.services.ai_client.base_tool"] = _base_tool_mod

# Now load text_tool
_text_tool_mod = _load_module(
    "lib.mcp.tools.text_tool",
    os.path.join(_SRC, "lib", "mcp", "tools", "text_tool.py"),
)
TextTool = _text_tool_mod.TextTool
TEXT_DEFINITIONS = _text_tool_mod.TEXT_DEFINITIONS


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_base_tool_instances():
    """Reset BaseTool._instances before each test so tests don't leak."""
    saved = BaseTool._instances[:]
    yield
    BaseTool._instances = saved


@pytest.fixture
def tool():
    """Fresh TextTool instance."""
    return TextTool()


# ===========================================================================
# A. _extract_pattern (static helper)
# ===========================================================================


class TestExtractPattern:
    """Tests for the static _extract_pattern helper."""

    def test_single_match_returns_value(self):
        """A single regex match is returned as-is."""
        result = TextTool._extract_pattern("hello 123 world", r"\d+", "numbers")
        assert result == "123"

    def test_multiple_matches_comma_separated(self):
        """Multiple regex matches are joined with comma and space."""
        result = TextTool._extract_pattern("a1 b2 c3", r"[a-z]\d", "codes")
        assert result == "a1, b2, c3"

    def test_no_matches_returns_not_found_message(self):
        """When nothing matches, returns 'No {pattern_name} found'."""
        result = TextTool._extract_pattern("no digits here", r"\d+", "numbers")
        assert result == "No numbers found"

    def test_empty_text_returns_not_found(self):
        """Empty input text yields the not-found message."""
        result = TextTool._extract_pattern("", r"\d+", "digits")
        assert result == "No digits found"


# ===========================================================================
# B. _word_count
# ===========================================================================


class TestWordCount:
    """Tests for the _word_count static method."""

    def test_standard_text(self):
        """Verify correct word, char, chars-no-spaces, and line counts."""
        text = "Hello world foo"
        result = TextTool._word_count(text)
        assert "Words: 3" in result
        assert f"Characters: {len(text)}" in result
        assert f"Characters (no spaces): {len(text.replace(' ', ''))}" in result
        assert "Lines: 1" in result

    def test_empty_string(self):
        """Empty string yields zero words and zero lines."""
        result = TextTool._word_count("")
        assert "Words: 0" in result
        assert "Characters: 0" in result
        assert "Characters (no spaces): 0" in result
        # "".splitlines() returns [] which has length 0
        assert "Lines: 0" in result

    def test_single_word(self):
        """A single word without spaces."""
        result = TextTool._word_count("hello")
        assert "Words: 1" in result
        assert "Characters: 5" in result
        assert "Characters (no spaces): 5" in result
        assert "Lines: 1" in result

    def test_multiline_text(self):
        """Multi-line text counts lines correctly."""
        text = "line one\nline two\nline three"
        result = TextTool._word_count(text)
        assert "Words: 6" in result
        assert "Lines: 3" in result

    def test_only_spaces(self):
        """Text with only spaces has zero words but non-zero character count."""
        text = "     "
        result = TextTool._word_count(text)
        assert "Words: 0" in result
        assert "Characters: 5" in result
        assert "Characters (no spaces): 0" in result


# ===========================================================================
# C. _find_and_replace
# ===========================================================================


class TestFindAndReplace:
    """Tests for the _find_and_replace static method."""

    def test_case_sensitive_replace(self):
        """Default case-sensitive replacement works correctly."""
        result = TextTool._find_and_replace("Hello World", "World", "Python")
        assert result == "Hello Python"

    def test_case_insensitive_replace(self):
        """Case-insensitive flag replaces regardless of casing."""
        result = TextTool._find_and_replace("Hello WORLD world World", "world", "Python", case_sensitive=False)
        assert result == "Hello Python Python Python"

    def test_no_match_returns_unchanged(self):
        """When the search string isn't found, text is returned unchanged."""
        text = "Hello World"
        result = TextTool._find_and_replace(text, "xyz", "abc")
        assert result == text

    def test_multiple_occurrences_all_replaced(self):
        """All occurrences are replaced, not just the first."""
        result = TextTool._find_and_replace("aaa bbb aaa", "aaa", "ccc")
        assert result == "ccc bbb ccc"

    def test_empty_find_string(self):
        """An empty find string triggers Python's str.replace behaviour (inserts between chars)."""
        result = TextTool._find_and_replace("ab", "", "-")
        # str.replace("", "-") inserts "-" between every character and at start/end
        assert result == "-a-b-"

    def test_replace_with_empty_string(self):
        """Replacing with empty string effectively deletes the matched text."""
        result = TextTool._find_and_replace("Hello World", "World", "")
        assert result == "Hello "


# ===========================================================================
# D. _extract_emails
# ===========================================================================


class TestExtractEmails:
    """Tests for the _extract_emails instance method."""

    def test_single_email(self, tool):
        """Extracts a single email address from text."""
        result = tool._extract_emails("Contact us at user@example.com for info.")
        assert result == "user@example.com"

    def test_multiple_emails(self, tool):
        """Extracts multiple email addresses separated by commas."""
        text = "Send to alice@foo.com and bob@bar.org please."
        result = tool._extract_emails(text)
        assert "alice@foo.com" in result
        assert "bob@bar.org" in result
        # Both should be comma-separated
        parts = [p.strip() for p in result.split(",")]
        assert len(parts) == 2

    def test_no_emails(self, tool):
        """Returns not-found message when no emails are present."""
        result = tool._extract_emails("No email addresses here.")
        assert result == "No email addresses found"

    def test_edge_case_email_formats(self, tool):
        """Emails with dots, plus signs, and percent in local part are matched."""
        text = "first.last@domain.com and user+tag@sub.domain.co.uk"
        result = tool._extract_emails(text)
        assert "first.last@domain.com" in result
        assert "user+tag@sub.domain.co.uk" in result

    def test_invalid_email_not_matched(self, tool):
        """Strings that look like emails but are invalid should not match."""
        # Missing TLD (single char after dot)
        result = tool._extract_emails("bad@addr.x is not valid and @missing.com too")
        # "@missing.com" has no local part so should not match
        # "bad@addr.x" has only 1-char TLD which fails the {2,} requirement
        assert "No email addresses found" in result or "bad@addr.x" not in result


# ===========================================================================
# E. _extract_urls
# ===========================================================================


class TestExtractUrls:
    """Tests for the _extract_urls instance method."""

    def test_single_http_url(self, tool):
        """Extracts a single http URL."""
        result = tool._extract_urls("Visit http://example.com for details.")
        assert "http://example.com" in result

    def test_single_https_url(self, tool):
        """Extracts a single https URL."""
        result = tool._extract_urls("Visit https://example.com for details.")
        assert "https://example.com" in result

    def test_multiple_urls(self, tool):
        """Extracts multiple URLs separated by commas."""
        text = "See http://foo.com and https://bar.org for more."
        result = tool._extract_urls(text)
        assert "http://foo.com" in result
        assert "https://bar.org" in result
        parts = [p.strip() for p in result.split(",")]
        assert len(parts) == 2

    def test_no_urls(self, tool):
        """Returns not-found message when no URLs are present."""
        result = tool._extract_urls("Just plain text without any links.")
        assert result == "No URLs found"

    def test_url_with_path_and_query(self, tool):
        """URLs with paths and query parameters are extracted."""
        text = "Go to https://example.com/path/to/page?q=search&lang=en for results."
        result = tool._extract_urls(text)
        assert "https://example.com/path/to/page?q=search&lang=en" in result


# ===========================================================================
# F. Case converter helpers (_to_snake_case, _to_camel_case, _to_kebab_case)
# ===========================================================================


class TestCaseConverters:
    """Tests for the static case conversion helpers."""

    # --- _to_snake_case ---

    def test_snake_from_camel_case(self):
        """camelCase is converted to snake_case."""
        assert TextTool._to_snake_case("camelCase") == "camel_case"

    def test_snake_from_spaces(self):
        """Words separated by spaces are joined with underscores."""
        assert TextTool._to_snake_case("hello world") == "hello_world"

    def test_snake_from_kebab_case(self):
        """kebab-case is converted to snake_case."""
        assert TextTool._to_snake_case("kebab-case-string") == "kebab_case_string"

    # --- _to_camel_case ---

    def test_camel_from_snake_case(self):
        """snake_case is converted to camelCase."""
        assert TextTool._to_camel_case("snake_case_string") == "snakeCaseString"

    def test_camel_from_spaces(self):
        """Space-separated words are converted to camelCase."""
        assert TextTool._to_camel_case("hello world foo") == "helloWorldFoo"

    def test_camel_from_kebab_case(self):
        """kebab-case is converted to camelCase."""
        assert TextTool._to_camel_case("kebab-case-string") == "kebabCaseString"

    def test_camel_empty_words(self):
        """When splitting produces no words (empty string), returns original text."""
        assert TextTool._to_camel_case("") == ""

    # --- _to_kebab_case ---

    def test_kebab_from_camel_case(self):
        """camelCase is converted to kebab-case."""
        assert TextTool._to_kebab_case("camelCase") == "camel-case"

    def test_kebab_from_spaces(self):
        """Space-separated words are joined with hyphens."""
        assert TextTool._to_kebab_case("hello world") == "hello-world"

    def test_kebab_from_snake_case(self):
        """snake_case is converted to kebab-case."""
        assert TextTool._to_kebab_case("snake_case_string") == "snake-case-string"

    def test_snake_from_pascal_case(self):
        """PascalCase is converted to snake_case with leading lowercase."""
        result = TextTool._to_snake_case("PascalCaseString")
        assert result == "pascal_case_string"

    def test_kebab_from_pascal_case(self):
        """PascalCase is converted to kebab-case with leading lowercase."""
        result = TextTool._to_kebab_case("PascalCaseString")
        assert result == "pascal-case-string"


# ===========================================================================
# G. _text_case_convert (dispatcher)
# ===========================================================================


class TestTextCaseConvert:
    """Tests for the _text_case_convert dispatcher method."""

    def test_upper(self, tool):
        """Converts text to UPPER CASE."""
        assert tool._text_case_convert("hello world", "upper") == "HELLO WORLD"

    def test_lower(self, tool):
        """Converts text to lower case."""
        assert tool._text_case_convert("HELLO WORLD", "lower") == "hello world"

    def test_title(self, tool):
        """Converts text to Title Case."""
        assert tool._text_case_convert("hello world", "title") == "Hello World"

    def test_capitalize(self, tool):
        """Capitalizes the first character only."""
        assert tool._text_case_convert("hello world", "capitalize") == "Hello world"

    def test_snake(self, tool):
        """Dispatches to snake_case converter."""
        assert tool._text_case_convert("helloWorld", "snake") == "hello_world"

    def test_camel(self, tool):
        """Dispatches to camelCase converter."""
        assert tool._text_case_convert("hello_world", "camel") == "helloWorld"

    def test_kebab(self, tool):
        """Dispatches to kebab-case converter."""
        assert tool._text_case_convert("helloWorld", "kebab") == "hello-world"

    def test_unknown_case_type(self, tool):
        """Unknown case type returns error message listing valid options."""
        result = tool._text_case_convert("hello", "SCREAMING_SNAKE")
        assert "Unknown case type: SCREAMING_SNAKE" in result
        assert "upper" in result
        assert "lower" in result
        assert "snake" in result
        assert "camel" in result
        assert "kebab" in result


# ===========================================================================
# H. Definitions and implementations
# ===========================================================================


class TestDefinitionsAndImplementations:
    """Verify tool registration and metadata."""

    def test_definitions_count(self, tool):
        """get_definitions returns exactly 5 tool schemas."""
        defs = tool.get_definitions()
        assert len(defs) == 5

    def test_definitions_names(self, tool):
        """All expected tool names are present in definitions."""
        names = {d["name"] for d in tool.get_definitions()}
        assert names == {
            "word_count",
            "find_and_replace",
            "extract_emails",
            "extract_urls",
            "text_case_convert",
        }

    def test_implementations_count(self, tool):
        """get_implementations returns exactly 5 callables."""
        impls = tool.get_implementations()
        assert len(impls) == 5

    def test_implementations_keys_match_definitions(self, tool):
        """Implementation keys match definition names."""
        impl_keys = set(tool.get_implementations().keys())
        def_names = {d["name"] for d in tool.get_definitions()}
        assert impl_keys == def_names

    def test_name_property(self, tool):
        """The name property returns 'text'."""
        assert tool.name == "text"

    def test_implementations_are_callable(self, tool):
        """Every value in get_implementations is callable."""
        for name, fn in tool.get_implementations().items():
            assert callable(fn), f"Implementation '{name}' is not callable"
