"""
Common time/timestamp functions.

Provides async time utilities shared between the scheduler workflow engine
and MCP tool layer.
"""

from datetime import datetime

from lib.utils.timezone_utils import get_current_time_in_timezone


async def current_timestamp() -> str:
    """Get current ISO 8601 timestamp."""
    return datetime.now().isoformat()


async def get_current_time(timezone: str = "UTC") -> str:
    """Get the current date and time in the specified timezone.

    Args:
        timezone: IANA timezone string (e.g. "America/New_York", "UTC").

    Returns:
        Formatted datetime string, or error string on invalid timezone.
    """
    try:
        now = get_current_time_in_timezone(timezone)
        return now.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError as e:
        return f"Error: {str(e)}"


async def get_current_date() -> str:
    """Get current date in YYYY-MM-DD format."""
    return datetime.now().strftime("%Y-%m-%d")
