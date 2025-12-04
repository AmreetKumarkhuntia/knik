"""Test script for file operation MCP tools."""

import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from lib.mcp.implementations.file_impl import (
    append_to_file_impl,
    count_in_file_impl,
    file_info_impl,
    find_in_file_impl,
    list_directory_impl,
    read_file_impl,
    search_in_files_impl,
    write_file_impl,
)
from lib.utils.printer import printer


def test_read_file():
    """Test reading a file."""
    printer.header("Test 1: Read File")

    # Test full file read
    result = read_file_impl("README.md")
    if result.get("success"):
        printer.success(f"✓ Read {result['lines']} lines from {result['file_path']}")
        printer.info(f"First 100 chars: {result['content'][:100]}...")
    else:
        printer.error(f"✗ Error: {result.get('error')}")

    # Test line range read
    printer.info("\n📖 Reading lines 1-5:")
    result = read_file_impl("README.md", start_line=1, end_line=5)
    if result.get("success"):
        printer.success(f"✓ Read {result['lines_read']} lines (of {result['total_lines']} total)")
        print(result["content"])
    else:
        printer.error(f"✗ Error: {result.get('error')}")


def test_list_directory():
    """Test directory listing."""
    printer.header("\nTest 2: List Directory")

    # Non-recursive
    result = list_directory_impl("docs")
    if result.get("success"):
        printer.success(f"✓ Found {result['total_files']} files, {result['total_directories']} dirs")
        printer.info(f"Files: {[f['name'] for f in result['files'][:3]]}")
        printer.info(f"Dirs: {result['directories'][:3]}")
    else:
        printer.error(f"✗ Error: {result.get('error')}")

    # Recursive with pattern
    printer.info("\n📂 Recursive search for *.md files:")
    result = list_directory_impl("docs", recursive=True, pattern="*.md")
    if result.get("success"):
        printer.success(f"✓ Found {result['total_files']} markdown files")
        for f in result["files"][:5]:
            print(f"  - {f['name']} ({f['size']} bytes)")
    else:
        printer.error(f"✗ Error: {result.get('error')}")


def test_search_in_files():
    """Test searching across multiple files."""
    printer.header("\nTest 3: Search in Files")

    result = search_in_files_impl(
        directory_path="docs", pattern="MCP", file_pattern="*.md", case_sensitive=True, max_results=5
    )

    if result.get("success"):
        printer.success(f"✓ Found {result['total_matches']} matches")
        for match in result["matches"][:3]:
            print(f"  {match['file']}:{match['line']} - {match['content'][:60]}...")
    else:
        printer.error(f"✗ Error: {result.get('error')}")


def test_file_info():
    """Test getting file information."""
    printer.header("\nTest 4: File Info")

    result = file_info_impl("README.md")
    if result.get("success"):
        printer.success("✓ File info retrieved")
        print(f"  Name: {result['name']}")
        print(f"  Type: {result['type']}")
        print(f"  Size: {result['size_bytes']} bytes")
        print(f"  Lines: {result.get('lines', 'N/A')}")
        print(f"  Modified: {result['modified']}")
    else:
        printer.error(f"✗ Error: {result.get('error')}")


def test_write_and_append():
    """Test writing and appending to files."""
    printer.header("\nTest 5: Write & Append")

    test_file = "test_output.txt"

    # Write
    result = write_file_impl(test_file, "Hello, World!\nThis is line 2.\n")
    if result.get("success"):
        printer.success(f"✓ Wrote {result['lines_written']} lines to {test_file}")
    else:
        printer.error(f"✗ Write error: {result.get('error')}")

    # Append
    result = append_to_file_impl(test_file, "This is appended line 3.\n")
    if result.get("success"):
        printer.success(f"✓ Appended {result['bytes_written']} bytes")
    else:
        printer.error(f"✗ Append error: {result.get('error')}")

    # Read back
    result = read_file_impl(test_file)
    if result.get("success"):
        printer.info(f"📄 File contents:\n{result['content']}")

    # Cleanup
    Path(test_file).unlink(missing_ok=True)
    printer.info("🗑️  Test file cleaned up")


def test_find_in_file():
    """Test finding pattern in a specific file."""
    printer.header("\nTest 6: Find in File")

    # Without context
    result = find_in_file_impl(file_path="README.md", pattern="AI", case_sensitive=True, max_results=3)

    if result.get("success"):
        printer.success(f"✓ Found {result['total_matches']} matches")
        for match in result["matches"]:
            print(f"  Line {match['line']}: {match['content'][:70]}...")
    else:
        printer.error(f"✗ Error: {result.get('error')}")

    # With context
    printer.info("\n🔍 With context lines:")
    result = find_in_file_impl(
        file_path="README.md",
        pattern="Features",
        case_sensitive=True,
        max_results=1,
        show_context=True,
        context_lines=2,
    )

    if result.get("success") and result["matches"]:
        match = result["matches"][0]
        print("\n  Context before:")
        for ctx in match.get("context_before", []):
            print(f"    {ctx['line']}: {ctx['content']}")
        print(f"  >>> {match['line']}: {match['content']}")
        print("  Context after:")
        for ctx in match.get("context_after", []):
            print(f"    {ctx['line']}: {ctx['content']}")


def test_count_in_file():
    """Test counting pattern occurrences."""
    printer.header("\nTest 7: Count in File")

    result = count_in_file_impl(file_path="README.md", pattern="the", case_sensitive=False)

    if result.get("success"):
        printer.success(f"✓ Pattern 'the' appears {result['total_occurrences']} times")
        printer.info(f"Found on {result['lines_with_matches']} different lines")
        print("\n  Top lines with matches:")
        for detail in result["line_details"][:5]:
            print(f"    Line {detail['line']}: {detail['count']} occurrences")
    else:
        printer.error(f"✗ Error: {result.get('error')}")


def test_regex_search():
    """Test regex pattern matching."""
    printer.header("\nTest 8: Regex Search")

    result = find_in_file_impl(
        file_path="README.md",
        pattern=r"\b\d+\.\d+\b",  # Find version numbers like 1.5 or 82.0
        is_regex=True,
        max_results=5,
    )

    if result.get("success"):
        printer.success(f"✓ Found {result['total_matches']} version-like patterns")
        for match in result["matches"]:
            print(f"  Line {match['line']}: {match['content'][:70]}...")
    else:
        printer.error(f"✗ Error: {result.get('error')}")


def main():
    """Run all tests."""
    printer.header("🧪 File Operations MCP Tools Test Suite")

    try:
        test_read_file()
        test_list_directory()
        test_search_in_files()
        test_file_info()
        test_write_and_append()
        test_find_in_file()
        test_count_in_file()
        test_regex_search()

        printer.header("\n✅ All Tests Complete!")

    except Exception as e:
        printer.error(f"\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
