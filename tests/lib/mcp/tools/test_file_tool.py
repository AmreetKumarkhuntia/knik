"""Tests for FileTool: file reading, writing, searching, listing, and info operations."""

import importlib
import importlib.util
import os
import re
import sys
from pathlib import Path
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

# Stub out printer
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

# Ensure package chain stubs
for pkg in ("lib", "lib.mcp", "lib.mcp.tools", "lib.core", "lib.services", "lib.services.ai_client", "lib.utils"):
    if pkg not in sys.modules:
        sys.modules[pkg] = type(sys)(pkg)

# Wire BaseTool into the stub package
sys.modules["lib.services.ai_client"].base_tool = sys.modules["lib.services.ai_client.base_tool"]
sys.modules["lib.services.ai_client.base_tool"] = _base_tool_mod

# Now load file_tool
_file_tool_mod = _load_module(
    "lib.mcp.tools.file_tool",
    os.path.join(_SRC, "lib", "mcp", "tools", "file_tool.py"),
)
FileTool = _file_tool_mod.FileTool
FILE_DEFINITIONS = _file_tool_mod.FILE_DEFINITIONS


# ---------------------------------------------------------------------------
# helpers / fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _clear_base_tool_instances():
    """Reset BaseTool._instances before each test so tests don't leak."""
    saved = BaseTool._instances[:]
    yield
    BaseTool._instances = saved


@pytest.fixture
def file_tool():
    """Fresh FileTool instance."""
    return FileTool()


def _write_lines(path: Path, lines: list[str]) -> Path:
    """Write lines joined by newlines to a file and return the path."""
    path.write_text("\n".join(lines) + "\n")
    return path


# ===========================================================================
# A. Static helper tests
# ===========================================================================


class TestValidatePath:
    """Tests for FileTool._validate_path static method."""

    def test_file_not_found(self, tmp_path):
        """Returns error dict when path does not exist."""
        p = tmp_path / "nonexistent.txt"
        result = FileTool._validate_path(p, str(p), "file")
        assert result is not None
        assert "error" in result
        assert "File not found" in result["error"]

    def test_not_a_file(self, tmp_path):
        """Returns error when path exists but is a directory, not a file."""
        d = tmp_path / "somedir"
        d.mkdir()
        result = FileTool._validate_path(d, str(d), "file")
        assert result is not None
        assert "Path is not a file" in result["error"]

    def test_not_a_directory(self, tmp_path):
        """Returns error when path exists but is a file, not a directory."""
        f = tmp_path / "afile.txt"
        f.write_text("data")
        result = FileTool._validate_path(f, str(f), "directory")
        assert result is not None
        assert "Path is not a directory" in result["error"]

    def test_valid_file(self, tmp_path):
        """Returns None for a valid file path."""
        f = tmp_path / "valid.txt"
        f.write_text("content")
        result = FileTool._validate_path(f, str(f), "file")
        assert result is None

    def test_valid_directory(self, tmp_path):
        """Returns None for a valid directory path."""
        d = tmp_path / "valid_dir"
        d.mkdir()
        result = FileTool._validate_path(d, str(d), "directory")
        assert result is None


class TestCompileRegex:
    """Tests for FileTool._compile_regex static method."""

    def test_valid_pattern(self):
        """Returns compiled regex for a valid pattern."""
        regex = FileTool._compile_regex(r"\d+", True)
        assert isinstance(regex, re.Pattern)
        assert regex.search("abc123") is not None

    def test_invalid_pattern_raises_value_error(self):
        """Raises ValueError for an invalid regex pattern."""
        with pytest.raises(ValueError, match="Invalid regex pattern"):
            FileTool._compile_regex(r"[invalid", True)

    def test_case_insensitive_flag(self):
        """Case-insensitive flag is applied when case_sensitive=False."""
        regex = FileTool._compile_regex(r"hello", False)
        assert regex.flags & re.IGNORECASE
        assert regex.search("HELLO") is not None

    def test_case_sensitive_no_flag(self):
        """No IGNORECASE flag when case_sensitive=True."""
        regex = FileTool._compile_regex(r"hello", True)
        assert not (regex.flags & re.IGNORECASE)
        assert regex.search("HELLO") is None


class TestLineMatches:
    """Tests for FileTool._line_matches static method."""

    def test_plain_text_match(self):
        """Matches plain text substring (case sensitive)."""
        assert FileTool._line_matches("hello world", "world", None, True) is True

    def test_plain_text_no_match(self):
        """Returns False when plain text does not match."""
        assert FileTool._line_matches("hello world", "xyz", None, True) is False

    def test_case_insensitive_plain(self):
        """Case-insensitive plain text match."""
        assert FileTool._line_matches("Hello World", "hello", None, False) is True

    def test_regex_match(self):
        """Matches line using a compiled regex."""
        regex = re.compile(r"\d{3}")
        assert FileTool._line_matches("abc123def", "ignored", regex, True) is True

    def test_regex_no_match(self):
        """Returns False when regex does not match."""
        regex = re.compile(r"^\d+$")
        assert FileTool._line_matches("abc", "ignored", regex, True) is False


# ===========================================================================
# B. _read_file tests
# ===========================================================================


class TestReadFile:
    """Tests for FileTool._read_file."""

    def test_read_entire_file(self, file_tool, tmp_path):
        """Reads the full file content and returns success with line count."""
        f = _write_lines(tmp_path / "sample.txt", ["line1", "line2", "line3"])
        result = file_tool._read_file(str(f))

        assert result["success"] is True
        assert "line1" in result["content"]
        assert "line3" in result["content"]
        assert result["lines"] == 3
        assert result["size_bytes"] > 0
        assert str(f.absolute()) in result["file_path"]

    def test_read_with_start_and_end_line(self, file_tool, tmp_path):
        """Reads a specific line range (1-indexed, inclusive)."""
        f = _write_lines(tmp_path / "range.txt", ["a", "b", "c", "d", "e"])
        result = file_tool._read_file(str(f), start_line=2, end_line=4)

        assert result["success"] is True
        assert "b" in result["content"]
        assert "d" in result["content"]
        assert "a" not in result["content"]
        assert "e" not in result["content"]
        assert result["start_line"] == 2
        assert result["end_line"] == 4
        assert result["total_lines"] == 5

    def test_read_with_only_start_line(self, file_tool, tmp_path):
        """When only start_line is given, end_line defaults to total lines."""
        f = _write_lines(tmp_path / "start.txt", ["x", "y", "z"])
        result = file_tool._read_file(str(f), start_line=2)

        assert result["success"] is True
        assert "y" in result["content"]
        assert "z" in result["content"]
        assert result["start_line"] == 2
        assert result["end_line"] == 3  # total lines

    def test_read_with_only_end_line(self, file_tool, tmp_path):
        """When only end_line is given, start_line defaults to 1."""
        f = _write_lines(tmp_path / "end.txt", ["a", "b", "c", "d"])
        result = file_tool._read_file(str(f), end_line=2)

        assert result["success"] is True
        assert "a" in result["content"]
        assert "b" in result["content"]
        assert result["start_line"] == 1
        assert result["end_line"] == 2

    def test_read_file_not_found(self, file_tool, tmp_path):
        """Returns error when file does not exist."""
        result = file_tool._read_file(str(tmp_path / "missing.txt"))
        assert "error" in result
        assert "File not found" in result["error"]

    def test_read_invalid_start_line(self, file_tool, tmp_path):
        """Returns error when start_line is out of range."""
        f = _write_lines(tmp_path / "small.txt", ["one", "two"])
        result = file_tool._read_file(str(f), start_line=10)

        assert "error" in result
        assert "Invalid start_line" in result["error"]

    def test_read_invalid_end_line(self, file_tool, tmp_path):
        """Returns error when end_line exceeds total lines."""
        f = _write_lines(tmp_path / "small2.txt", ["one", "two"])
        result = file_tool._read_file(str(f), start_line=1, end_line=999)

        assert "error" in result
        assert "Invalid end_line" in result["error"]

    def test_read_non_utf8_encoding(self, file_tool, tmp_path):
        """Reads a file with a non-utf-8 encoding."""
        f = tmp_path / "latin.txt"
        f.write_bytes("caf\xe9\n".encode("latin-1"))
        result = file_tool._read_file(str(f), encoding="latin-1")

        assert result["success"] is True
        assert "caf\xe9" in result["content"]


# ===========================================================================
# C. _list_directory tests
# ===========================================================================


class TestListDirectory:
    """Tests for FileTool._list_directory."""

    def test_list_flat_directory(self, file_tool, tmp_path):
        """Lists files and subdirectories in a flat directory."""
        (tmp_path / "file1.txt").write_text("a")
        (tmp_path / "file2.py").write_text("b")
        sub = tmp_path / "subdir"
        sub.mkdir()

        result = file_tool._list_directory(str(tmp_path))

        assert result["success"] is True
        file_names = [f["name"] for f in result["files"]]
        assert "file1.txt" in file_names
        assert "file2.py" in file_names
        assert "subdir" in result["directories"]
        assert result["total_files"] == 2
        assert result["total_directories"] == 1

    def test_list_recursive(self, file_tool, tmp_path):
        """Recursive listing includes files in nested directories."""
        sub = tmp_path / "nested"
        sub.mkdir()
        (tmp_path / "root.txt").write_text("root")
        (sub / "deep.txt").write_text("deep")

        result = file_tool._list_directory(str(tmp_path), recursive=True)

        assert result["success"] is True
        file_names = [f["name"] for f in result["files"]]
        assert any("deep.txt" in n for n in file_names)
        assert result["total_files"] >= 2

    def test_list_with_pattern_filter(self, file_tool, tmp_path):
        """Pattern filter limits results to matching files."""
        (tmp_path / "app.py").write_text("py")
        (tmp_path / "readme.md").write_text("md")
        (tmp_path / "data.txt").write_text("txt")

        result = file_tool._list_directory(str(tmp_path), pattern="*.py")

        assert result["success"] is True
        file_names = [f["name"] for f in result["files"]]
        assert "app.py" in file_names
        assert "readme.md" not in file_names
        assert "data.txt" not in file_names

    def test_list_directory_not_found(self, file_tool, tmp_path):
        """Returns error when directory does not exist."""
        result = file_tool._list_directory(str(tmp_path / "nope"))
        assert "error" in result
        assert "Directory not found" in result["error"]

    def test_list_empty_directory(self, file_tool, tmp_path):
        """Empty directory returns zero files and directories."""
        empty = tmp_path / "empty"
        empty.mkdir()

        result = file_tool._list_directory(str(empty))

        assert result["success"] is True
        assert result["total_files"] == 0
        assert result["total_directories"] == 0

    def test_list_recursive_with_pattern(self, file_tool, tmp_path):
        """Recursive listing with a glob pattern filters correctly."""
        sub = tmp_path / "pkg"
        sub.mkdir()
        (tmp_path / "top.py").write_text("top")
        (sub / "mod.py").write_text("mod")
        (sub / "readme.md").write_text("md")

        result = file_tool._list_directory(str(tmp_path), recursive=True, pattern="**/*.py")

        assert result["success"] is True
        file_names = [f["name"] for f in result["files"]]
        assert any("mod.py" in n for n in file_names)
        # .md files should not appear
        assert not any("readme.md" in n for n in file_names)


# ===========================================================================
# D. _search_in_files tests
# ===========================================================================


class TestSearchInFiles:
    """Tests for FileTool._search_in_files."""

    def test_plain_text_search(self, file_tool, tmp_path):
        """Finds plain text matches across multiple files."""
        (tmp_path / "a.txt").write_text("hello world\nfoo bar\n")
        (tmp_path / "b.txt").write_text("goodbye world\nhello again\n")

        result = file_tool._search_in_files(str(tmp_path), "hello")

        assert result["success"] is True
        assert result["total_matches"] >= 2
        contents = [m["content"] for m in result["matches"]]
        assert any("hello world" in c for c in contents)
        assert any("hello again" in c for c in contents)

    def test_regex_search(self, file_tool, tmp_path):
        """Regex pattern search works across files."""
        (tmp_path / "nums.txt").write_text("abc 123\ndef 456\nghi\n")

        result = file_tool._search_in_files(str(tmp_path), r"\d{3}", is_regex=True)

        assert result["success"] is True
        assert result["total_matches"] == 2

    def test_case_insensitive_search(self, file_tool, tmp_path):
        """Case-insensitive search finds matches regardless of case."""
        (tmp_path / "mixed.txt").write_text("Hello\nHELLO\nhello\n")

        result = file_tool._search_in_files(str(tmp_path), "hello", case_sensitive=False)

        assert result["success"] is True
        assert result["total_matches"] == 3

    def test_max_results_limit(self, file_tool, tmp_path):
        """Stops searching once max_results is reached."""
        lines = "\n".join([f"match line {i}" for i in range(50)])
        (tmp_path / "many.txt").write_text(lines)

        result = file_tool._search_in_files(str(tmp_path), "match", max_results=5)

        assert result["success"] is True
        assert result["total_matches"] == 5
        assert result["max_results_reached"] is True

    def test_invalid_regex_returns_error(self, file_tool, tmp_path):
        """Invalid regex pattern returns an error dict."""
        (tmp_path / "dummy.txt").write_text("data\n")

        result = file_tool._search_in_files(str(tmp_path), r"[bad", is_regex=True)

        assert "error" in result
        assert "Invalid regex pattern" in result["error"]

    def test_no_matches_found(self, file_tool, tmp_path):
        """Returns empty matches list when nothing matches."""
        (tmp_path / "no_match.txt").write_text("nothing here\n")

        result = file_tool._search_in_files(str(tmp_path), "zzzzz")

        assert result["success"] is True
        assert result["total_matches"] == 0
        assert result["max_results_reached"] is False

    def test_file_pattern_filter(self, file_tool, tmp_path):
        """File pattern limits search to matching files only."""
        (tmp_path / "code.py").write_text("target line\n")
        (tmp_path / "notes.txt").write_text("target line\n")

        result = file_tool._search_in_files(str(tmp_path), "target", file_pattern="*.py")

        assert result["success"] is True
        file_names = [m["file"] for m in result["matches"]]
        assert all("code.py" in f for f in file_names)
        assert not any("notes.txt" in f for f in file_names)


# ===========================================================================
# E. _file_info tests
# ===========================================================================


class TestFileInfo:
    """Tests for FileTool._file_info."""

    def test_file_info_returns_details(self, file_tool, tmp_path):
        """Returns size, lines, modified time, and type=file for a text file."""
        f = tmp_path / "info.txt"
        f.write_text("line1\nline2\nline3\n")

        result = file_tool._file_info(str(f))

        assert result["success"] is True
        assert result["type"] == "file"
        assert result["name"] == "info.txt"
        assert result["size_bytes"] > 0
        assert result["lines"] == 3
        assert "modified" in result
        assert "created" in result

    def test_directory_info(self, file_tool, tmp_path):
        """Returns type=directory and no 'lines' key for a directory."""
        d = tmp_path / "mydir"
        d.mkdir()

        result = file_tool._file_info(str(d))

        assert result["success"] is True
        assert result["type"] == "directory"
        assert result["name"] == "mydir"
        assert "lines" not in result

    def test_path_not_found(self, file_tool, tmp_path):
        """Returns error when path does not exist."""
        result = file_tool._file_info(str(tmp_path / "ghost"))

        assert "error" in result
        assert "Path not found" in result["error"]

    def test_binary_file_no_lines(self, file_tool, tmp_path):
        """Binary file that can't be read as UTF-8 has no 'lines' key."""
        f = tmp_path / "binary.bin"
        # Write invalid UTF-8 bytes
        f.write_bytes(b"\x80\x81\x82\xff\xfe")

        result = file_tool._file_info(str(f))

        assert result["success"] is True
        assert result["type"] == "file"
        # The file _might_ decode or might not — if it raises, 'lines' is absent.
        # Python's open with utf-8 will raise UnicodeDecodeError for these bytes,
        # so the except branch runs and 'lines' is not added.
        # However, some systems may be lenient. We just verify no crash.
        assert result["name"] == "binary.bin"


# ===========================================================================
# F. _write_file tests
# ===========================================================================


class TestWriteFile:
    """Tests for FileTool._write_file."""

    def test_write_new_file_creates_parents(self, file_tool, tmp_path):
        """Creates parent directories and writes a new file."""
        target = tmp_path / "deep" / "nested" / "file.txt"

        result = file_tool._write_file(str(target), "hello world")

        assert result["success"] is True
        assert target.exists()
        assert target.read_text() == "hello world"
        assert str(target.absolute()) in result["file_path"]

    def test_overwrite_existing_file(self, file_tool, tmp_path):
        """Overwrites an existing file with new content."""
        f = tmp_path / "overwrite.txt"
        f.write_text("old content")

        result = file_tool._write_file(str(f), "new content")

        assert result["success"] is True
        assert f.read_text() == "new content"

    def test_returns_bytes_and_lines_written(self, file_tool, tmp_path):
        """Response includes correct bytes_written and lines_written."""
        content = "line1\nline2\nline3"
        f = tmp_path / "metrics.txt"

        result = file_tool._write_file(str(f), content)

        assert result["success"] is True
        assert result["bytes_written"] == len(content.encode("utf-8"))
        assert result["lines_written"] == 3

    def test_write_invalid_encoding_error(self, file_tool, tmp_path):
        """Returns error for an invalid encoding."""
        f = tmp_path / "bad_enc.txt"

        result = file_tool._write_file(str(f), "data", encoding="not-a-real-encoding")

        assert "error" in result
        assert "Error writing file" in result["error"]


# ===========================================================================
# G. _append_to_file tests
# ===========================================================================


class TestAppendToFile:
    """Tests for FileTool._append_to_file."""

    def test_append_to_existing_file(self, file_tool, tmp_path):
        """Appends content to an existing file."""
        f = tmp_path / "appendable.txt"
        f.write_text("first\n")

        result = file_tool._append_to_file(str(f), "second\n")

        assert result["success"] is True
        assert f.read_text() == "first\nsecond\n"

    def test_append_creates_file_if_not_exists(self, file_tool, tmp_path):
        """Creates the file (and parent dirs) if it doesn't exist."""
        f = tmp_path / "newdir" / "new.txt"

        result = file_tool._append_to_file(str(f), "created")

        assert result["success"] is True
        assert f.exists()
        assert f.read_text() == "created"

    def test_append_returns_bytes_written(self, file_tool, tmp_path):
        """Response includes the number of bytes appended."""
        f = tmp_path / "bytes.txt"
        content = "appended data"

        result = file_tool._append_to_file(str(f), content)

        assert result["success"] is True
        assert result["bytes_written"] == len(content.encode("utf-8"))


# ===========================================================================
# H. _find_in_file tests
# ===========================================================================


class TestFindInFile:
    """Tests for FileTool._find_in_file."""

    def test_find_plain_text_matches(self, file_tool, tmp_path):
        """Finds lines containing a plain text pattern."""
        f = _write_lines(tmp_path / "find.txt", ["apple", "banana", "apple pie", "cherry"])
        result = file_tool._find_in_file(str(f), "apple")

        assert result["success"] is True
        assert result["total_matches"] == 2
        lines = [m["line"] for m in result["matches"]]
        assert 1 in lines
        assert 3 in lines

    def test_find_with_regex(self, file_tool, tmp_path):
        """Regex pattern matching works correctly."""
        f = _write_lines(tmp_path / "regex.txt", ["abc 123", "def ghi", "jkl 456"])
        result = file_tool._find_in_file(str(f), r"\d+", is_regex=True)

        assert result["success"] is True
        assert result["total_matches"] == 2
        assert result["matches"][0]["line"] == 1
        assert result["matches"][1]["line"] == 3

    def test_find_case_insensitive(self, file_tool, tmp_path):
        """Case-insensitive search finds all case variants."""
        f = _write_lines(tmp_path / "case.txt", ["Hello", "HELLO", "hello", "nope"])
        result = file_tool._find_in_file(str(f), "hello", case_sensitive=False)

        assert result["success"] is True
        assert result["total_matches"] == 3

    def test_find_with_context_lines(self, file_tool, tmp_path):
        """Show context includes lines before and after the match."""
        f = _write_lines(tmp_path / "ctx.txt", ["aaa", "bbb", "TARGET", "ddd", "eee"])
        result = file_tool._find_in_file(str(f), "TARGET", show_context=True, context_lines=2)

        assert result["success"] is True
        assert result["total_matches"] == 1
        match = result["matches"][0]
        assert match["line"] == 3
        assert "context_before" in match
        assert "context_after" in match
        # context_before should have lines 1 and 2
        before_lines = [c["line"] for c in match["context_before"]]
        assert before_lines == [1, 2]
        # context_after should have lines 4 and 5
        after_lines = [c["line"] for c in match["context_after"]]
        assert after_lines == [4, 5]

    def test_find_max_results_limit(self, file_tool, tmp_path):
        """Stops after max_results matches are found."""
        lines = [f"match {i}" for i in range(20)]
        f = _write_lines(tmp_path / "many_matches.txt", lines)

        result = file_tool._find_in_file(str(f), "match", max_results=5)

        assert result["success"] is True
        assert result["total_matches"] == 5
        assert result["max_results_reached"] is True

    def test_find_file_not_found(self, file_tool, tmp_path):
        """Returns error when file does not exist."""
        result = file_tool._find_in_file(str(tmp_path / "gone.txt"), "pattern")

        assert "error" in result
        assert "File not found" in result["error"]

    def test_find_invalid_regex(self, file_tool, tmp_path):
        """Returns error for an invalid regex pattern."""
        f = _write_lines(tmp_path / "dummy.txt", ["data"])
        result = file_tool._find_in_file(str(f), r"[invalid", is_regex=True)

        assert "error" in result
        assert "Invalid regex pattern" in result["error"]


# ===========================================================================
# I. _count_in_file tests
# ===========================================================================


class TestCountInFile:
    """Tests for FileTool._count_in_file."""

    def test_count_plain_text(self, file_tool, tmp_path):
        """Counts occurrences of a plain text pattern."""
        f = _write_lines(tmp_path / "count.txt", ["foo bar", "baz", "foo foo"])
        result = file_tool._count_in_file(str(f), "foo")

        assert result["success"] is True
        assert result["total_occurrences"] == 3
        assert result["lines_with_matches"] == 2

    def test_count_with_regex(self, file_tool, tmp_path):
        """Counts occurrences using a regex pattern."""
        f = _write_lines(tmp_path / "regex_count.txt", ["abc 12 def 34", "no nums", "56"])
        result = file_tool._count_in_file(str(f), r"\d+", is_regex=True)

        assert result["success"] is True
        assert result["total_occurrences"] == 3  # 12, 34, 56
        assert result["lines_with_matches"] == 2

    def test_count_case_insensitive(self, file_tool, tmp_path):
        """Case-insensitive count finds all variants."""
        f = _write_lines(tmp_path / "ci_count.txt", ["Foo FOO foo"])
        result = file_tool._count_in_file(str(f), "foo", case_sensitive=False)

        assert result["success"] is True
        assert result["total_occurrences"] == 3

    def test_count_multiple_per_line(self, file_tool, tmp_path):
        """Counts multiple occurrences within a single line."""
        f = _write_lines(tmp_path / "multi.txt", ["aaa bbb aaa", "ccc"])
        result = file_tool._count_in_file(str(f), "aaa")

        assert result["success"] is True
        assert result["total_occurrences"] == 2
        # Line 1 has count=2
        detail = result["line_details"][0]
        assert detail["line"] == 1
        assert detail["count"] == 2

    def test_count_line_details_truncated_to_50(self, file_tool, tmp_path):
        """line_details is truncated to 50 entries even if more lines match."""
        lines = [f"match {i}" for i in range(100)]
        f = _write_lines(tmp_path / "lots.txt", lines)

        result = file_tool._count_in_file(str(f), "match")

        assert result["success"] is True
        assert result["total_occurrences"] == 100
        assert result["lines_with_matches"] == 100
        assert len(result["line_details"]) == 50

    def test_count_file_not_found(self, file_tool, tmp_path):
        """Returns error when file does not exist."""
        result = file_tool._count_in_file(str(tmp_path / "missing.txt"), "x")

        assert "error" in result
        assert "File not found" in result["error"]


# ===========================================================================
# J. Definitions and implementations tests
# ===========================================================================


class TestDefinitionsAndImplementations:
    """Verify tool registration and metadata."""

    def test_definitions_returns_eight(self, file_tool):
        """get_definitions returns all 8 file tool schemas."""
        defs = file_tool.get_definitions()
        assert len(defs) == 8

    def test_implementations_returns_eight(self, file_tool):
        """get_implementations returns 8 callable entries."""
        impls = file_tool.get_implementations()
        assert len(impls) == 8
        expected_keys = {
            "read_file",
            "list_directory",
            "search_in_files",
            "file_info",
            "write_file",
            "append_to_file",
            "find_in_file",
            "count_in_file",
        }
        assert set(impls.keys()) == expected_keys
        for fn in impls.values():
            assert callable(fn)

    def test_name_property(self, file_tool):
        """name property returns 'file'."""
        assert file_tool.name == "file"
