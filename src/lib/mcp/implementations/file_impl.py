"""File system operations for MCP tools."""

import re
from datetime import datetime
from pathlib import Path
from typing import Any

from ...utils.printer import printer


def _validate_path(path: Path, path_str: str, path_type: str = "file") -> dict[str, Any] | None:
    """Validate path existence and type. path_type can be 'file' or 'directory'."""
    if not path.exists():
        return {"error": f"{path_type.capitalize()} not found: {path_str}"}

    if path_type == "file" and not path.is_file():
        return {"error": f"Path is not a file: {path_str}"}

    if path_type == "directory" and not path.is_dir():
        return {"error": f"Path is not a directory: {path_str}"}

    return None


def _validate_file_path(path: Path, file_path: str) -> dict[str, Any] | None:
    return _validate_path(path, file_path, "file")


def _validate_dir_path(path: Path, dir_path: str) -> dict[str, Any] | None:
    return _validate_path(path, dir_path, "directory")


def _validate_line_range(start: int, end: int, total: int, start_line: int | None) -> dict[str, Any] | None:
    if start < 0 or start >= total:
        return {"error": f"Invalid start_line: {start_line} (file has {total} lines)"}
    if end < start or end > total:
        return {"error": f"Invalid end_line: {end} (must be between {start_line} and {total})"}
    return None


def _read_file_lines(path: Path, encoding: str) -> list[str]:
    with open(path, encoding=encoding) as f:
        return f.readlines()


def _build_file_response(
    path: Path, content: str, lines: list[str], start_line: int | None = None, end_line: int | None = None
) -> dict[str, Any]:
    response = {
        "success": True,
        "file_path": str(path.absolute()),
        "content": content,
        "size_bytes": path.stat().st_size,
    }

    if start_line is not None or end_line is not None:
        response.update(
            {
                "start_line": start_line or 1,
                "end_line": end_line or len(lines),
                "lines_read": len(content.splitlines()),
                "total_lines": len(lines),
            }
        )
    else:
        response["lines"] = len(lines)

    return response


def read_file_impl(
    file_path: str, encoding: str = "utf-8", start_line: int | None = None, end_line: int | None = None
) -> dict[str, Any]:
    range_info = f" (lines {start_line}-{end_line})" if start_line or end_line else ""
    printer.info(f"🔧 Reading file: {file_path}{range_info}")
    try:
        path = Path(file_path)
        error = _validate_file_path(path, file_path)
        if error:
            return error

        lines = _read_file_lines(path, encoding)
        total_lines = len(lines)

        if start_line is not None or end_line is not None:
            start = (start_line - 1) if start_line else 0
            end = end_line if end_line else total_lines

            error = _validate_line_range(start, end, total_lines, start_line)
            if error:
                return error

            content = "".join(lines[start:end])
        else:
            content = "".join(lines)

        return _build_file_response(path, content, lines, start_line, end_line)
    except Exception as e:
        return {"error": f"Error reading file: {str(e)}"}


def _format_file_info(item: Path, base_path: Path | None = None) -> dict[str, Any]:
    stat = item.stat()
    return {
        "name": str(item.relative_to(base_path)) if base_path else item.name,
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
    }


def _list_recursive(path: Path, pattern: str) -> tuple[list[dict[str, Any]], list[str]]:
    files = []
    directories = []
    pattern_str = pattern or "**/*"

    for item in path.glob(pattern_str):
        if item.is_file():
            files.append(_format_file_info(item, path))
        elif item.is_dir():
            directories.append(str(item.relative_to(path)))

    return files, directories


def _list_non_recursive(path: Path, pattern: str | None) -> tuple[list[dict[str, Any]], list[str]]:
    files = []
    directories = []

    for item in path.iterdir():
        if pattern and not item.match(pattern):
            continue

        if item.is_file():
            files.append(_format_file_info(item))
        elif item.is_dir():
            directories.append(item.name)

    return files, directories


def list_directory_impl(directory_path: str, recursive: bool = False, pattern: str | None = None) -> dict[str, Any]:
    mode = "recursively" if recursive else "non-recursively"
    pattern_info = f" with pattern '{pattern}'" if pattern else ""
    printer.info(f"🔧 Listing directory {mode}: {directory_path}{pattern_info}")
    try:
        path = Path(directory_path)
        error = _validate_dir_path(path, directory_path)
        if error:
            return error

        if recursive:
            files, directories = _list_recursive(path, pattern)
        else:
            files, directories = _list_non_recursive(path, pattern)

        return {
            "success": True,
            "directory": str(path.absolute()),
            "files": files,
            "directories": directories,
            "total_files": len(files),
            "total_directories": len(directories),
        }
    except Exception as e:
        return {"error": f"Error listing directory: {str(e)}"}


def _compile_search_regex(pattern: str, case_sensitive: bool, is_regex: bool) -> re.Pattern | None:
    if not is_regex:
        return None

    flags = 0 if case_sensitive else re.IGNORECASE
    try:
        return re.compile(pattern, flags)
    except re.error as e:
        raise ValueError(f"Invalid regex pattern: {str(e)}") from e


def _line_matches_pattern(line: str, pattern: str, regex: re.Pattern | None, case_sensitive: bool) -> bool:
    if regex:
        return regex.search(line) is not None

    if case_sensitive:
        return pattern in line

    return pattern.lower() in line.lower()


def _search_file(
    file_path: Path, base_path: Path, pattern: str, regex: re.Pattern | None, case_sensitive: bool
) -> list[dict[str, Any]]:
    matches = []
    try:
        with open(file_path, encoding="utf-8", errors="ignore") as f:
            for line_num, line in enumerate(f, 1):
                if _line_matches_pattern(line, pattern, regex, case_sensitive):
                    matches.append(
                        {"file": str(file_path.relative_to(base_path)), "line": line_num, "content": line.strip()}
                    )
    except Exception:
        pass

    return matches


def search_in_files_impl(
    directory_path: str,
    pattern: str,
    file_pattern: str = "*",
    is_regex: bool = False,
    case_sensitive: bool = True,
    max_results: int = 100,
) -> dict[str, Any]:
    printer.info(f"🔧 Searching in files: pattern='{pattern}', directory={directory_path}, file_pattern={file_pattern}")
    try:
        path = Path(directory_path)
        error = _validate_dir_path(path, directory_path)
        if error:
            return error

        try:
            regex = _compile_search_regex(pattern, case_sensitive, is_regex)
        except ValueError as e:
            return {"error": str(e)}

        all_matches = []
        for file_path in path.rglob(file_pattern):
            if not file_path.is_file():
                continue

            file_matches = _search_file(file_path, path, pattern, regex, case_sensitive)
            all_matches.extend(file_matches)

            if len(all_matches) >= max_results:
                return {
                    "success": True,
                    "matches": all_matches[:max_results],
                    "total_matches": max_results,
                    "max_results_reached": True,
                }

        return {
            "success": True,
            "matches": all_matches,
            "total_matches": len(all_matches),
            "max_results_reached": False,
        }
    except Exception as e:
        return {"error": f"Error searching files: {str(e)}"}


def _get_line_count(path: Path) -> int | None:
    if not path.is_file():
        return None

    try:
        with open(path, encoding="utf-8") as f:
            return len(f.readlines())
    except Exception:
        return None


def file_info_impl(path: str) -> dict[str, Any]:
    printer.info(f"🔧 Getting file/directory info for: {path}")
    try:
        p = Path(path)
        if not p.exists():
            return {"error": f"Path not found: {path}"}

        stat = p.stat()
        is_file = p.is_file()

        info = {
            "success": True,
            "path": str(p.absolute()),
            "name": p.name,
            "type": "file" if is_file else "directory",
            "size_bytes": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        }

        if is_file:
            line_count = _get_line_count(p)
            if line_count is not None:
                info["lines"] = line_count

        return info
    except Exception as e:
        return {"error": f"Error getting file info: {str(e)}"}


def _ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _write_to_file(path: Path, content: str, mode: str, encoding: str) -> dict[str, Any]:
    _ensure_parent_dir(path)

    with open(path, mode, encoding=encoding) as f:
        f.write(content)

    response = {"success": True, "file_path": str(path.absolute()), "bytes_written": len(content.encode(encoding))}

    if mode == "w":
        response["lines_written"] = len(content.splitlines())

    return response


def write_file_impl(file_path: str, content: str, encoding: str = "utf-8") -> dict[str, Any]:
    printer.info(f"🔧 Writing to file: {file_path} ({len(content)} bytes)")
    try:
        return _write_to_file(Path(file_path), content, "w", encoding)
    except Exception as e:
        return {"error": f"Error writing file: {str(e)}"}


def append_to_file_impl(file_path: str, content: str, encoding: str = "utf-8") -> dict[str, Any]:
    printer.info(f"🔧 Appending to file: {file_path} ({len(content)} bytes)")
    try:
        return _write_to_file(Path(file_path), content, "a", encoding)
    except Exception as e:
        return {"error": f"Error appending to file: {str(e)}"}


def _get_context_lines(lines: list[str], line_num: int, context_lines: int, direction: str) -> list[dict[str, Any]]:
    if direction == "before":
        start = max(0, line_num - context_lines - 1)
        end = line_num - 1
    else:
        start = line_num
        end = min(len(lines), line_num + context_lines)

    return [{"line": i + 1, "content": lines[i].rstrip()} for i in range(start, end)]


def _build_match_info(
    line_num: int, line: str, lines: list[str], show_context: bool, context_lines: int
) -> dict[str, Any]:
    match_info = {"line": line_num, "content": line.rstrip()}

    if show_context and context_lines > 0:
        match_info["context_before"] = _get_context_lines(lines, line_num, context_lines, "before")
        match_info["context_after"] = _get_context_lines(lines, line_num, context_lines, "after")

    return match_info


def _count_pattern_in_line(line: str, pattern: str, regex: re.Pattern | None, case_sensitive: bool) -> int:
    if regex:
        return len(regex.findall(line))

    if case_sensitive:
        return line.count(pattern)

    return line.lower().count(pattern.lower())


def _process_file_lines(
    path: Path,
    pattern: str,
    regex: re.Pattern | None,
    case_sensitive: bool,
    mode: str,
    max_results: int = 100,
    show_context: bool = False,
    context_lines: int = 2,
) -> tuple[list, int, bool]:
    """Unified line processing for find and count operations."""
    with open(path, encoding="utf-8", errors="ignore") as f:
        lines = f.readlines() if mode == "find" else f

    results = []
    total_count = 0
    max_reached = False

    line_iterator = enumerate(lines, 1) if mode == "find" else enumerate(lines, 1)

    for line_num, line in line_iterator:
        if mode == "find":
            if _line_matches_pattern(line, pattern, regex, case_sensitive):
                match_info = _build_match_info(line_num, line, lines, show_context, context_lines)
                results.append(match_info)

                if len(results) >= max_results:
                    max_reached = True
                    break
        else:
            count = _count_pattern_in_line(line, pattern, regex, case_sensitive)
            if count > 0:
                total_count += count
                results.append({"line": line_num, "count": count})

    return results, total_count, max_reached


def find_in_file_impl(
    file_path: str,
    pattern: str,
    is_regex: bool = False,
    case_sensitive: bool = True,
    max_results: int = 100,
    show_context: bool = False,
    context_lines: int = 2,
) -> dict[str, Any]:
    try:
        path = Path(file_path)
        error = _validate_file_path(path, file_path)
        if error:
            return error

        try:
            regex = _compile_search_regex(pattern, case_sensitive, is_regex)
        except ValueError as e:
            return {"error": str(e)}

        matches, _, max_reached = _process_file_lines(
            path, pattern, regex, case_sensitive, "find", max_results, show_context, context_lines
        )

        return {
            "success": True,
            "file_path": str(path.absolute()),
            "pattern": pattern,
            "matches": matches,
            "total_matches": len(matches),
            "max_results_reached": max_reached,
        }
    except Exception as e:
        return {"error": f"Error searching file: {str(e)}"}


def count_in_file_impl(
    file_path: str, pattern: str, is_regex: bool = False, case_sensitive: bool = True
) -> dict[str, Any]:
    printer.info(f"🔧 Counting pattern '{pattern}' in file: {file_path}")
    try:
        path = Path(file_path)
        error = _validate_file_path(path, file_path)
        if error:
            return error

        try:
            regex = _compile_search_regex(pattern, case_sensitive, is_regex)
        except ValueError as e:
            return {"error": str(e)}

        lines_with_matches, total_count, _ = _process_file_lines(path, pattern, regex, case_sensitive, "count")

        return {
            "success": True,
            "file_path": str(path.absolute()),
            "pattern": pattern,
            "total_occurrences": total_count,
            "lines_with_matches": len(lines_with_matches),
            "line_details": lines_with_matches[:50],
        }
    except Exception as e:
        return {"error": f"Error counting in file: {str(e)}"}
