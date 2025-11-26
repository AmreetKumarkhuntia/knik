"""
Utils module for Knik library.
Contains utility and helper modules.
"""

from .console_processor import ConsoleProcessor, CommandProcessor, BaseProcessor, create_processor
from .printer import (
    Printer,
    PrinterConfig,
    LogLevel,
    debug,
    info,
    success,
    warning,
    error,
    critical,
    header,
    separator,
    blank,
    configure,
    set_log_level,
    set_silent,
    set_verbose,
    get_printer,
    get_config,
)

__all__ = [
    'ConsoleProcessor', 
    'CommandProcessor', 
    'BaseProcessor', 
    'create_processor',
    'Printer',
    'PrinterConfig',
    'LogLevel',
    'debug',
    'info',
    'success',
    'warning',
    'error',
    'critical',
    'header',
    'separator',
    'blank',
    'configure',
    'set_log_level',
    'set_silent',
    'set_verbose',
    'get_printer',
    'get_config',
]
