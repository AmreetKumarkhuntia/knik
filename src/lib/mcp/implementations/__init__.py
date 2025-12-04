from .file_impl import (
    append_to_file_impl,
    count_in_file_impl,
    file_info_impl,
    find_in_file_impl,
    list_directory_impl,
    read_file_impl,
    search_in_files_impl,
    write_file_impl,
)
from .shell_impl import SHELL_IMPLEMENTATIONS
from .text_impl import TEXT_IMPLEMENTATIONS
from .utils_impl import UTILS_IMPLEMENTATIONS


FILE_IMPLEMENTATIONS = {
    "read_file": read_file_impl,
    "list_directory": list_directory_impl,
    "search_in_files": search_in_files_impl,
    "file_info": file_info_impl,
    "write_file": write_file_impl,
    "append_to_file": append_to_file_impl,
    "find_in_file": find_in_file_impl,
    "count_in_file": count_in_file_impl,
}

ALL_IMPLEMENTATIONS = {**UTILS_IMPLEMENTATIONS, **TEXT_IMPLEMENTATIONS, **SHELL_IMPLEMENTATIONS, **FILE_IMPLEMENTATIONS}

__all__ = [
    "ALL_IMPLEMENTATIONS",
    "UTILS_IMPLEMENTATIONS",
    "TEXT_IMPLEMENTATIONS",
    "SHELL_IMPLEMENTATIONS",
    "FILE_IMPLEMENTATIONS",
]
