import re
from datetime import datetime
from pathlib import Path
from typing import Any

from lib.services.ai_client.base_tool import BaseTool


FILE_DEFINITIONS = [
    {
        "name": "read_file",
        "description": "Read the complete contents of a file or a specific line range. Useful for analyzing file contents, extracting information, or reading large files in chunks to save resources.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to read (absolute or relative to current directory)",
                },
                "encoding": {"type": "string", "description": "File encoding (default: utf-8)", "default": "utf-8"},
                "start_line": {
                    "type": "integer",
                    "description": "Starting line number (1-indexed, inclusive). Use to read only part of a large file.",
                    "default": None,
                },
                "end_line": {
                    "type": "integer",
                    "description": "Ending line number (1-indexed, inclusive). Use to read only part of a large file.",
                    "default": None,
                },
            },
            "required": ["file_path"],
        },
    },
    {
        "name": "list_directory",
        "description": "List all files and directories in a given path. Useful for discovering project structure, finding files, or auditing directories.",
        "parameters": {
            "type": "object",
            "properties": {
                "directory_path": {
                    "type": "string",
                    "description": "Path to the directory to list (absolute or relative)",
                },
                "recursive": {
                    "type": "boolean",
                    "description": "Whether to list files recursively in subdirectories",
                    "default": False,
                },
                "pattern": {
                    "type": "string",
                    "description": "Optional glob pattern to filter files (e.g., '*.py', '*.md')",
                    "default": None,
                },
            },
            "required": ["directory_path"],
        },
    },
    {
        "name": "search_in_files",
        "description": "Search for a pattern (text or regex) across multiple files in a directory. Perfect for finding TODOs, specific code patterns, or text occurrences.",
        "parameters": {
            "type": "object",
            "properties": {
                "directory_path": {"type": "string", "description": "Directory to search in"},
                "pattern": {"type": "string", "description": "Text or regex pattern to search for"},
                "file_pattern": {
                    "type": "string",
                    "description": "Glob pattern for files to search (e.g., '*.py', '*.md')",
                    "default": "*",
                },
                "is_regex": {"type": "boolean", "description": "Whether the pattern is a regex", "default": False},
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether search is case sensitive",
                    "default": True,
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of matches to return",
                    "default": 100,
                },
            },
            "required": ["directory_path", "pattern"],
        },
    },
    {
        "name": "file_info",
        "description": "Get detailed information about a file or directory (size, modification time, permissions, type, line count for text files).",
        "parameters": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Path to the file or directory"}},
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Use with caution - always confirm with user before modifying files.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path where the file should be written"},
                "content": {"type": "string", "description": "Content to write to the file"},
                "encoding": {"type": "string", "description": "File encoding (default: utf-8)", "default": "utf-8"},
            },
            "required": ["file_path", "content"],
        },
    },
    {
        "name": "append_to_file",
        "description": "Append content to an existing file. Creates the file if it doesn't exist.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to the file to append to"},
                "content": {"type": "string", "description": "Content to append"},
                "encoding": {"type": "string", "description": "File encoding (default: utf-8)", "default": "utf-8"},
            },
            "required": ["file_path", "content"],
        },
    },
    {
        "name": "find_in_file",
        "description": "Search for a pattern within a specific file. Returns matching lines with optional context lines before/after. More focused than search_in_files for analyzing individual files.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to the file to search in"},
                "pattern": {"type": "string", "description": "Text pattern or regex to search for"},
                "is_regex": {
                    "type": "boolean",
                    "description": "Whether the pattern is a regular expression",
                    "default": False,
                },
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether the search should be case-sensitive",
                    "default": True,
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of matches to return",
                    "default": 100,
                },
                "show_context": {
                    "type": "boolean",
                    "description": "Whether to show context lines around matches",
                    "default": False,
                },
                "context_lines": {
                    "type": "integer",
                    "description": "Number of context lines to show before and after each match",
                    "default": 2,
                },
            },
            "required": ["file_path", "pattern"],
        },
    },
    {
        "name": "count_in_file",
        "description": "Count how many times a pattern appears in a file. Returns total count and per-line breakdown. Useful for statistics and analysis.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to the file to analyze"},
                "pattern": {"type": "string", "description": "Text pattern or regex to count"},
                "is_regex": {
                    "type": "boolean",
                    "description": "Whether the pattern is a regular expression",
                    "default": False,
                },
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether the count should be case-sensitive",
                    "default": True,
                },
            },
            "required": ["file_path", "pattern"],
        },
    },
]
from lib.utils.printer import printer


class FileTool(BaseTool):
    @property
    def name(self) -> str:
        return "file"

    def get_definitions(self):
        return FILE_DEFINITIONS

    def get_implementations(self):
        return {
            "read_file": self._read_file,
            "list_directory": self._list_directory,
            "search_in_files": self._search_in_files,
            "file_info": self._file_info,
            "write_file": self._write_file,
            "append_to_file": self._append_to_file,
            "find_in_file": self._find_in_file,
            "count_in_file": self._count_in_file,
        }

    # --- helpers ---

    @staticmethod
    def _validate_path(path: Path, path_str: str, path_type: str = "file") -> dict[str, Any] | None:
        if not path.exists():
            return {"error": f"{path_type.capitalize()} not found: {path_str}"}
        if path_type == "file" and not path.is_file():
            return {"error": f"Path is not a file: {path_str}"}
        if path_type == "directory" and not path.is_dir():
            return {"error": f"Path is not a directory: {path_str}"}
        return None

    @staticmethod
    def _compile_regex(pattern: str, case_sensitive: bool) -> re.Pattern:
        flags = 0 if case_sensitive else re.IGNORECASE
        try:
            return re.compile(pattern, flags)
        except re.error as e:
            raise ValueError(f"Invalid regex pattern: {e}") from e

    @staticmethod
    def _line_matches(line: str, pattern: str, regex: re.Pattern | None, case_sensitive: bool) -> bool:
        if regex:
            return regex.search(line) is not None
        return pattern in line if case_sensitive else pattern.lower() in line.lower()

    # --- implementations ---

    def _read_file(
        self,
        file_path: str,
        encoding: str = "utf-8",
        start_line: int | None = None,
        end_line: int | None = None,
    ) -> dict[str, Any]:
        range_info = f" (lines {start_line}-{end_line})" if start_line or end_line else ""
        printer.info(f"Reading file: {file_path}{range_info}")
        try:
            path = Path(file_path)
            err = self._validate_path(path, file_path, "file")
            if err:
                return err

            with open(path, encoding=encoding) as f:
                lines = f.readlines()
            total = len(lines)

            if start_line is not None or end_line is not None:
                start = (start_line - 1) if start_line else 0
                end = end_line if end_line else total
                if start < 0 or start >= total:
                    return {"error": f"Invalid start_line: {start_line} (file has {total} lines)"}
                if end < start or end > total:
                    return {"error": f"Invalid end_line: {end_line} (must be between {start_line} and {total})"}
                content = "".join(lines[start:end])
            else:
                content = "".join(lines)

            response: dict[str, Any] = {
                "success": True,
                "file_path": str(path.absolute()),
                "content": content,
                "size_bytes": path.stat().st_size,
            }
            if start_line is not None or end_line is not None:
                response.update(
                    {
                        "start_line": start_line or 1,
                        "end_line": end_line or total,
                        "lines_read": len(content.splitlines()),
                        "total_lines": total,
                    }
                )
            else:
                response["lines"] = total
            return response
        except Exception as e:
            return {"error": f"Error reading file: {e}"}

    def _list_directory(
        self, directory_path: str, recursive: bool = False, pattern: str | None = None
    ) -> dict[str, Any]:
        printer.info(f"Listing directory: {directory_path}")
        try:
            path = Path(directory_path)
            err = self._validate_path(path, directory_path, "directory")
            if err:
                return err

            files = []
            directories = []

            def _info(item: Path, base: Path | None = None) -> dict[str, Any]:
                stat = item.stat()
                return {
                    "name": str(item.relative_to(base)) if base else item.name,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                }

            if recursive:
                glob_pat = pattern or "**/*"
                for item in path.glob(glob_pat):
                    if item.is_file():
                        files.append(_info(item, path))
                    elif item.is_dir():
                        directories.append(str(item.relative_to(path)))
            else:
                for item in path.iterdir():
                    if pattern and not item.match(pattern):
                        continue
                    if item.is_file():
                        files.append(_info(item))
                    elif item.is_dir():
                        directories.append(item.name)

            return {
                "success": True,
                "directory": str(path.absolute()),
                "files": files,
                "directories": directories,
                "total_files": len(files),
                "total_directories": len(directories),
            }
        except Exception as e:
            return {"error": f"Error listing directory: {e}"}

    def _search_in_files(
        self,
        directory_path: str,
        pattern: str,
        file_pattern: str = "*",
        is_regex: bool = False,
        case_sensitive: bool = True,
        max_results: int = 100,
    ) -> dict[str, Any]:
        printer.info(f"Searching '{pattern}' in {directory_path}")
        try:
            path = Path(directory_path)
            err = self._validate_path(path, directory_path, "directory")
            if err:
                return err

            regex = None
            if is_regex:
                try:
                    regex = self._compile_regex(pattern, case_sensitive)
                except ValueError as e:
                    return {"error": str(e)}

            matches = []
            for file_path in path.rglob(file_pattern):
                if not file_path.is_file():
                    continue
                try:
                    with open(file_path, encoding="utf-8", errors="ignore") as f:
                        for line_num, line in enumerate(f, 1):
                            if self._line_matches(line, pattern, regex, case_sensitive):
                                matches.append(
                                    {
                                        "file": str(file_path.relative_to(path)),
                                        "line": line_num,
                                        "content": line.strip(),
                                    }
                                )
                            if len(matches) >= max_results:
                                return {
                                    "success": True,
                                    "matches": matches,
                                    "total_matches": max_results,
                                    "max_results_reached": True,
                                }
                except Exception:
                    pass

            return {
                "success": True,
                "matches": matches,
                "total_matches": len(matches),
                "max_results_reached": False,
            }
        except Exception as e:
            return {"error": f"Error searching files: {e}"}

    def _file_info(self, path: str) -> dict[str, Any]:
        printer.info(f"Getting info for: {path}")
        try:
            p = Path(path)
            if not p.exists():
                return {"error": f"Path not found: {path}"}
            stat = p.stat()
            is_file = p.is_file()
            info: dict[str, Any] = {
                "success": True,
                "path": str(p.absolute()),
                "name": p.name,
                "type": "file" if is_file else "directory",
                "size_bytes": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            }
            if is_file:
                try:
                    with open(p, encoding="utf-8") as f:
                        info["lines"] = len(f.readlines())
                except Exception:
                    pass
            return info
        except Exception as e:
            return {"error": f"Error getting file info: {e}"}

    def _write_file(self, file_path: str, content: str, encoding: str = "utf-8") -> dict[str, Any]:
        printer.info(f"Writing to file: {file_path} ({len(content)} bytes)")
        try:
            path = Path(file_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w", encoding=encoding) as f:
                f.write(content)
            return {
                "success": True,
                "file_path": str(path.absolute()),
                "bytes_written": len(content.encode(encoding)),
                "lines_written": len(content.splitlines()),
            }
        except Exception as e:
            return {"error": f"Error writing file: {e}"}

    def _append_to_file(self, file_path: str, content: str, encoding: str = "utf-8") -> dict[str, Any]:
        printer.info(f"Appending to file: {file_path} ({len(content)} bytes)")
        try:
            path = Path(file_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "a", encoding=encoding) as f:
                f.write(content)
            return {
                "success": True,
                "file_path": str(path.absolute()),
                "bytes_written": len(content.encode(encoding)),
            }
        except Exception as e:
            return {"error": f"Error appending to file: {e}"}

    def _find_in_file(
        self,
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
            err = self._validate_path(path, file_path, "file")
            if err:
                return err

            regex = None
            if is_regex:
                try:
                    regex = self._compile_regex(pattern, case_sensitive)
                except ValueError as e:
                    return {"error": str(e)}

            with open(path, encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            matches = []
            max_reached = False
            for line_num, line in enumerate(lines, 1):
                if self._line_matches(line, pattern, regex, case_sensitive):
                    match_info: dict[str, Any] = {"line": line_num, "content": line.rstrip()}
                    if show_context and context_lines > 0:
                        before_start = max(0, line_num - context_lines - 1)
                        match_info["context_before"] = [
                            {"line": i + 1, "content": lines[i].rstrip()} for i in range(before_start, line_num - 1)
                        ]
                        after_end = min(len(lines), line_num + context_lines)
                        match_info["context_after"] = [
                            {"line": i + 1, "content": lines[i].rstrip()} for i in range(line_num, after_end)
                        ]
                    matches.append(match_info)
                    if len(matches) >= max_results:
                        max_reached = True
                        break

            return {
                "success": True,
                "file_path": str(path.absolute()),
                "pattern": pattern,
                "matches": matches,
                "total_matches": len(matches),
                "max_results_reached": max_reached,
            }
        except Exception as e:
            return {"error": f"Error searching file: {e}"}

    def _count_in_file(
        self, file_path: str, pattern: str, is_regex: bool = False, case_sensitive: bool = True
    ) -> dict[str, Any]:
        printer.info(f"Counting '{pattern}' in: {file_path}")
        try:
            path = Path(file_path)
            err = self._validate_path(path, file_path, "file")
            if err:
                return err

            regex = None
            if is_regex:
                try:
                    regex = self._compile_regex(pattern, case_sensitive)
                except ValueError as e:
                    return {"error": str(e)}

            total_count = 0
            lines_with_matches = []
            with open(path, encoding="utf-8", errors="ignore") as f:
                for line_num, line in enumerate(f, 1):
                    if regex:
                        count = len(regex.findall(line))
                    elif case_sensitive:
                        count = line.count(pattern)
                    else:
                        count = line.lower().count(pattern.lower())
                    if count > 0:
                        total_count += count
                        lines_with_matches.append({"line": line_num, "count": count})

            return {
                "success": True,
                "file_path": str(path.absolute()),
                "pattern": pattern,
                "total_occurrences": total_count,
                "lines_with_matches": len(lines_with_matches),
                "line_details": lines_with_matches[:50],
            }
        except Exception as e:
            return {"error": f"Error counting in file: {e}"}
