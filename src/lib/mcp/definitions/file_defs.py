"""File system operation tool definitions for MCP."""

FILE_DEFINITIONS = [
    {
        "name": "read_file",
        "description": "Read the complete contents of a file or a specific line range. Useful for analyzing file contents, extracting information, or reading large files in chunks to save resources.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to read (absolute or relative to current directory)"
                },
                "encoding": {
                    "type": "string",
                    "description": "File encoding (default: utf-8)",
                    "default": "utf-8"
                },
                "start_line": {
                    "type": "integer",
                    "description": "Starting line number (1-indexed, inclusive). Use to read only part of a large file.",
                    "default": None
                },
                "end_line": {
                    "type": "integer",
                    "description": "Ending line number (1-indexed, inclusive). Use to read only part of a large file.",
                    "default": None
                }
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "list_directory",
        "description": "List all files and directories in a given path. Useful for discovering project structure, finding files, or auditing directories.",
        "parameters": {
            "type": "object",
            "properties": {
                "directory_path": {
                    "type": "string",
                    "description": "Path to the directory to list (absolute or relative)"
                },
                "recursive": {
                    "type": "boolean",
                    "description": "Whether to list files recursively in subdirectories",
                    "default": False
                },
                "pattern": {
                    "type": "string",
                    "description": "Optional glob pattern to filter files (e.g., '*.py', '*.md')",
                    "default": None
                }
            },
            "required": ["directory_path"]
        }
    },
    {
        "name": "search_in_files",
        "description": "Search for a pattern (text or regex) across multiple files in a directory. Perfect for finding TODOs, specific code patterns, or text occurrences.",
        "parameters": {
            "type": "object",
            "properties": {
                "directory_path": {
                    "type": "string",
                    "description": "Directory to search in"
                },
                "pattern": {
                    "type": "string",
                    "description": "Text or regex pattern to search for"
                },
                "file_pattern": {
                    "type": "string",
                    "description": "Glob pattern for files to search (e.g., '*.py', '*.md')",
                    "default": "*"
                },
                "is_regex": {
                    "type": "boolean",
                    "description": "Whether the pattern is a regex",
                    "default": False
                },
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether search is case sensitive",
                    "default": True
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of matches to return",
                    "default": 100
                }
            },
            "required": ["directory_path", "pattern"]
        }
    },
    {
        "name": "file_info",
        "description": "Get detailed information about a file or directory (size, modification time, permissions, type, line count for text files).",
        "parameters": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file or directory"
                }
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Use with caution - always confirm with user before modifying files.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path where the file should be written"
                },
                "content": {
                    "type": "string",
                    "description": "Content to write to the file"
                },
                "encoding": {
                    "type": "string",
                    "description": "File encoding (default: utf-8)",
                    "default": "utf-8"
                }
            },
            "required": ["file_path", "content"]
        }
    },
    {
        "name": "append_to_file",
        "description": "Append content to an existing file. Creates the file if it doesn't exist.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to append to"
                },
                "content": {
                    "type": "string",
                    "description": "Content to append"
                },
                "encoding": {
                    "type": "string",
                    "description": "File encoding (default: utf-8)",
                    "default": "utf-8"
                }
            },
            "required": ["file_path", "content"]
        }
    },
    {
        "name": "find_in_file",
        "description": "Search for a pattern within a specific file. Returns matching lines with optional context lines before/after. More focused than search_in_files for analyzing individual files.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to search in"
                },
                "pattern": {
                    "type": "string",
                    "description": "Text pattern or regex to search for"
                },
                "is_regex": {
                    "type": "boolean",
                    "description": "Whether the pattern is a regular expression",
                    "default": False
                },
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether the search should be case-sensitive",
                    "default": True
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of matches to return",
                    "default": 100
                },
                "show_context": {
                    "type": "boolean",
                    "description": "Whether to show context lines around matches",
                    "default": False
                },
                "context_lines": {
                    "type": "integer",
                    "description": "Number of context lines to show before and after each match",
                    "default": 2
                }
            },
            "required": ["file_path", "pattern"]
        }
    },
    {
        "name": "count_in_file",
        "description": "Count how many times a pattern appears in a file. Returns total count and per-line breakdown. Useful for statistics and analysis.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to analyze"
                },
                "pattern": {
                    "type": "string",
                    "description": "Text pattern or regex to count"
                },
                "is_regex": {
                    "type": "boolean",
                    "description": "Whether the pattern is a regular expression",
                    "default": False
                },
                "case_sensitive": {
                    "type": "boolean",
                    "description": "Whether the count should be case-sensitive",
                    "default": True
                }
            },
            "required": ["file_path", "pattern"]
        }
    }
]
