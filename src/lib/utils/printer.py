"""
Printer Utility Service

Centralized printing/logging service using loguru with custom formatting.
Provides consistent output formatting, color support, and configurable verbosity.
"""

from enum import Enum
from typing import Optional
import sys
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
        log_level: Optional[str] = None,
        show_logs: Optional[bool] = None,
        use_colors: Optional[bool] = None,
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
    
    def __init__(self, config: Optional[PrinterConfig] = None):
        """
        Initialize printer with configuration.
        
        Args:
            config: PrinterConfig instance. If None, uses default config.
        """
        self.config = config or PrinterConfig()
        self._configure_logger()
    
    def _configure_logger(self):
        """Configure loguru logger based on config."""
        # Only add handler if logs should be shown
        if self.config.show_logs:
            # Configure format with function name and line number
            format_str = "<green>{time:HH:mm:ss}</green> | <cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{level: <8}</level> | <level>{message}</level>"
            
            if not self.config.use_colors:
                format_str = "{time:HH:mm:ss} | {function}:{line} | {level: <8} | {message}"
            
            self._handler_id = logger.add(
                sys.stdout,
                format=format_str,
                level=self.config.log_level,
                colorize=self.config.use_colors,
                diagnose=False,  # Disable diagnostic info
                backtrace=False,  # Disable backtrace
            )
    
    def debug(self, message: str):
        """Print debug message (lowest priority)."""
        logger.opt(depth=1).debug(message)
    
    def info(self, message: str):
        """Print informational message."""
        logger.opt(depth=1).info(message)
    
    def success(self, message: str):
        """Print success message."""
        logger.opt(depth=1).success(message)
    
    def warning(self, message: str):
        """Print warning message."""
        logger.opt(depth=1).warning(message)
    
    def error(self, message: str):
        """Print error message."""
        logger.opt(depth=1).error(message)
    
    def critical(self, message: str):
        """Print critical error message."""
        logger.opt(depth=1).critical(message)
    
    def header(self, message: str, char: str = "=", width: int = 60):
        """
        Print a header with decorative borders.
        
        Args:
            message: Header text
            char: Character to use for border
            width: Width of the border
        """
        if not self.config.show_logs:
            return
        border = char * width
        print(border)
        print(message)
        print(border)
    
    def separator(self, char: str = "=", width: int = 60):
        """Print a separator line."""
        if not self.config.show_logs:
            return
        print(char * width)
    
    def blank(self, count: int = 1):
        """Print blank line(s)."""
        if not self.config.show_logs:
            return
        for _ in range(count):
            print()
    
    def configure(
        self,
        log_level: Optional[str] = None,
        show_logs: Optional[bool] = None,
        use_colors: Optional[bool] = None,
        show_timestamps: Optional[bool] = None,
    ):
        """
        Update printer configuration.
        
        Args:
            log_level: New log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            show_logs: Whether to show logs
            use_colors: Whether to use colors
            show_timestamps: Whether to show timestamps
        """
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
        """Set the minimum log level to display."""
        self.configure(log_level=level)
    
    def set_silent(self):
        """Disable all output."""
        self.configure(show_logs=False)
    
    def set_verbose(self):
        """Enable verbose output (DEBUG level)."""
        self.configure(log_level="DEBUG")
    
    def get_config(self) -> PrinterConfig:
        """Get current configuration."""
        return self.config


# Global printer instance
logger.remove()  # Remove default handler before creating printer
_global_printer = Printer()


# Convenience functions that use the global printer
def debug(message: str):
    """Print debug message using global printer."""
    logger.opt(depth=1).debug(message)


def info(message: str):
    """Print info message using global printer."""
    logger.opt(depth=1).info(message)


def success(message: str):
    """Print success message using global printer."""
    logger.opt(depth=1).success(message)


def warning(message: str):
    """Print warning message using global printer."""
    logger.opt(depth=1).warning(message)


def error(message: str):
    """Print error message using global printer."""
    logger.opt(depth=1).error(message)


def critical(message: str):
    """Print critical error message using global printer."""
    logger.opt(depth=1).critical(message)


def header(message: str, char: str = "=", width: int = 60):
    """Print header using global printer."""
    _global_printer.header(message, char, width)


def separator(char: str = "=", width: int = 60):
    """Print separator using global printer."""
    _global_printer.separator(char, width)


def blank(count: int = 1):
    """Print blank line(s) using global printer."""
    _global_printer.blank(count)


def configure(**kwargs):
    """Configure global printer."""
    _global_printer.configure(**kwargs)


def set_log_level(level: str):
    """Set log level for global printer."""
    _global_printer.set_log_level(level)


def set_silent():
    """Disable all output for global printer."""
    _global_printer.set_silent()


def set_verbose():
    """Enable verbose output for global printer."""
    _global_printer.set_verbose()


def get_printer() -> Printer:
    """Get the global printer instance."""
    return _global_printer


def get_config() -> PrinterConfig:
    """Get global printer configuration."""
    return _global_printer.get_config()


# Export everything
__all__ = [
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
