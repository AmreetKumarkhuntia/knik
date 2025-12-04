"""
Printer Utility Service

Centralized printing/logging service using loguru with custom formatting.
Provides consistent output formatting, color support, and configurable verbosity.
"""

import sys
from enum import Enum

from loguru import logger

# Import Config for environment variable support
from ..core.config import Config


# Remove default loguru handler immediately
logger.remove()


class LogLevel(Enum):
    """Log levels for output verbosity control."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    SILENT = "SILENT"


class PrinterConfig:
    """Global configuration for the printer utility."""

    def __init__(
        self,
        log_level: str | None = None,
        show_logs: bool | None = None,
        use_colors: bool | None = None,
        show_timestamps: bool = False,
    ):
        """
        Initialize printer configuration.

        Args:
            log_level: Minimum log level to display (DEBUG, INFO, WARNING, ERROR, CRITICAL)
                      If None, loads from KNIK_LOG_LEVEL env var or defaults to INFO
            show_logs: Whether to show any logs at all (master switch)
                      If None, loads from KNIK_SHOW_LOGS env var or defaults to True
            use_colors: Whether to use colors in output
                       If None, loads from KNIK_USE_COLORS env var or defaults to True
            show_timestamps: Whether to show timestamps in output
        """
        # Load from environment variables with fallback to defaults
        self.log_level = log_level if log_level is not None else Config.get_log_level()
        self.show_logs = show_logs if show_logs is not None else Config.get_show_logs()
        self.use_colors = use_colors if use_colors is not None else Config.get_use_colors()
        self.show_timestamps = show_timestamps


class Printer:
    """
    Centralized printer utility with log levels and formatting using loguru.

    Example:
        >>> from lib.utils import printer
        >>> printer.info("Application started")
        >>> printer.warning("Low memory")
        >>> printer.error("Failed to connect")
        >>> printer.debug("Variable x = 42")
    """

    def __init__(self, config: PrinterConfig | None = None):
        self.config = config or PrinterConfig()
        self._configure_logger()

    def _configure_logger(self):
        if self.config.show_logs:
            format_str = "<green>{time:HH:mm:ss}</green> | <cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{level: <8}</level> | <level>{message}</level>"

            if not self.config.use_colors:
                format_str = "{time:HH:mm:ss} | {function}:{line} | {level: <8} | {message}"

            # Always use stderr for logs to keep stdout clean for conversation
            self._handler_id = logger.add(
                sys.stderr,
                format=format_str,
                level=self.config.log_level,
                colorize=self.config.use_colors,
                diagnose=False,  # Disable diagnostic info
                backtrace=False,  # Disable backtrace
            )

    def debug(self, message: str):
        if self.config.show_logs:
            logger.opt(depth=1).debug(message)

    def info(self, message: str):
        if self.config.show_logs:
            logger.opt(depth=1).info(message)

    def success(self, message: str):
        if self.config.show_logs:
            logger.opt(depth=1).success(message)

    def warning(self, message: str):
        if self.config.show_logs:
            logger.opt(depth=1).warning(message)

    def error(self, message: str):
        if self.config.show_logs:
            logger.opt(depth=1).error(message)

    def critical(self, message: str):
        if self.config.show_logs:
            logger.opt(depth=1).critical(message)

    def header(self, message: str, char: str = "=", width: int = 60):
        if not self.config.show_logs:
            return
        border = char * width
        print(border)
        print(message)
        print(border)

    def separator(self, char: str = "=", width: int = 60):
        if not self.config.show_logs:
            return
        print(char * width)

    def blank(self, count: int = 1):
        if not self.config.show_logs:
            return
        for _ in range(count):
            print()

    def configure(
        self,
        log_level: str | None = None,
        show_logs: bool | None = None,
        use_colors: bool | None = None,
        show_timestamps: bool | None = None,
    ):
        """
        Update printer configuration.

        Args:
            log_level: New log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            show_logs: Whether to show logs
            use_colors: Whether to use colors
            show_timestamps: Whether to show timestamps
        """
        import contextlib

        # Remove existing handler before reconfiguring
        if hasattr(self, "_handler_id"):
            with contextlib.suppress(ValueError):
                logger.remove(self._handler_id)

        if log_level is not None:
            self.config.log_level = log_level
        if show_logs is not None:
            self.config.show_logs = show_logs
        if use_colors is not None:
            self.config.use_colors = use_colors
        if show_timestamps is not None:
            self.config.show_timestamps = show_timestamps

        # Re-configure logger with new settings
        self._configure_logger()

    def set_log_level(self, level: str):
        self.configure(log_level=level)

    def set_silent(self):
        self.configure(show_logs=False)

    def set_verbose(self):
        self.configure(log_level="DEBUG")

    def get_config(self) -> PrinterConfig:
        return self.config


# Global printer instance
logger.remove()  # Remove default handler before creating printer
printer = Printer()


# Export everything
__all__ = [
    "Printer",
    "PrinterConfig",
    "LogLevel",
    "printer",
]
