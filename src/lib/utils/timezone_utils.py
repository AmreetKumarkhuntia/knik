"""Timezone utilities for parsing and handling various timezone formats."""

import re
from datetime import datetime, timedelta, tzinfo
from datetime import timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def parse_timezone(timezone_str: str) -> tzinfo:
    """Parse timezone string into tzinfo object. Supports both IANA format and GMT/UTC offset format."""
    if not timezone_str:
        return ZoneInfo("UTC")

    try:
        return ZoneInfo(timezone_str)
    except ZoneInfoNotFoundError:
        pass

    offset_pattern = r"^(GMT|UTC)([+-])(\d{1,2})(?::(\d{2}))?$"
    match = re.match(offset_pattern, timezone_str, re.IGNORECASE)

    if match:
        prefix, sign, hours_str, minutes_str = match.groups()

        try:
            hours = int(hours_str)
            minutes = int(minutes_str) if minutes_str else 0

            if hours > 14 or hours < 0:
                raise ValueError(f"Invalid hour offset: {hours}. Must be between 0 and 14.")
            if minutes >= 60 or minutes < 0:
                raise ValueError(f"Invalid minute offset: {minutes}. Must be between 0 and 59.")

            total_offset = timedelta(hours=hours, minutes=minutes)
            if sign == "-":
                total_offset = -total_offset

            return dt_timezone(total_offset)

        except ValueError as e:
            raise ValueError(f"Invalid timezone offset format '{timezone_str}': {e}") from e

    raise ValueError(
        f"Invalid timezone: '{timezone_str}'. "
        f"Use IANA format (e.g., 'America/New_York', 'Asia/Kolkata') "
        f"or GMT/UTC offset (e.g., 'GMT+5:30', 'UTC-5')"
    )


def get_current_time_in_timezone(timezone_str: str = "UTC") -> datetime:
    """Get current datetime in the specified timezone."""
    tz = parse_timezone(timezone_str)
    return datetime.now(tz)


def validate_timezone(timezone_str: str) -> tuple[bool, str]:
    """Validate a timezone string. Returns (is_valid, error_message)."""
    try:
        parse_timezone(timezone_str)
        return True, ""
    except ValueError as e:
        return False, str(e)
