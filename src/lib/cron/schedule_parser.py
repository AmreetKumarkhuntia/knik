"""
Schedule parsing utilities for natural language schedule descriptions.

Provides functions to parse human-readable schedule descriptions (e.g.,
"every 5 minutes", "daily at 9am", "every Monday at 2pm") into concrete
datetime values and recurrence intervals.
"""

import re
from datetime import datetime, timedelta

import dateparser

from lib.utils.timezone_utils import parse_timezone


def parse_recurrence_seconds(schedule_description: str) -> int | None:
    """Parse natural language schedule to recurrence interval in seconds.

    Args:
        schedule_description: Natural language description like "every 5 minutes",
            "hourly", "daily", "weekly", etc.

    Returns:
        Recurrence interval in seconds, or None if no recurrence pattern is detected.
    """
    description_lower = schedule_description.lower()

    patterns = [
        (r"every\s+(\d+)\s+hours?", lambda m: int(m.group(1)) * 3600),
        (r"every\s+(\d+)\s+days?", lambda m: int(m.group(1)) * 86400),
        (r"every\s+(\d+)\s+minutes?", lambda m: int(m.group(1)) * 60),
        (r"every\s+(\d+)\s+weeks?", lambda m: int(m.group(1)) * 604800),
        (r"hourly", lambda m: 3600),
        (r"daily", lambda m: 86400),
        (r"weekly", lambda m: 604800),
    ]

    for pattern, converter in patterns:
        match = re.search(pattern, description_lower)
        if match:
            return converter(match)

    return None


def calculate_first_run(schedule_description: str, timezone: str = "UTC") -> datetime:
    """Calculate the first run time for a schedule based on natural language description.

    This function parses natural language schedule descriptions and calculates the next
    appropriate execution time. If the calculated time is in the past, it automatically
    moves to the next occurrence (e.g., tomorrow for daily schedules).

    Args:
        schedule_description: Natural language schedule description. Supported formats:
            - Simple intervals: "every 1 minute", "every 5 minutes", "hourly", "daily"
            - Time-of-day: "daily at 9am", "daily at 14:30", "daily at 09:00"
            - Weekday-based: "every Monday at 2pm", "every Friday at 17:00"
            - Relative times: "in 5 minutes", "tomorrow at 3pm"
        timezone: Timezone string in IANA format (e.g., "America/New_York", "Asia/Kolkata")
                 or GMT/UTC offset format (e.g., "GMT+5:30", "UTC-5"). Defaults to "UTC".

    Returns:
        Timezone-aware datetime for the first execution.

    Raises:
        ValueError: If schedule_description cannot be parsed or timezone is invalid.
    """
    # Parse timezone and get current time
    tz = parse_timezone(timezone)
    now = datetime.now(tz)

    description_lower = schedule_description.lower().strip()

    interval_patterns = [
        r"^every\s+(\d+)\s+minutes?$",
        r"^every\s+(\d+)\s+hours?$",
        r"^every\s+(\d+)\s+days?$",
        r"^every\s+(\d+)\s+weeks?$",
        r"^hourly$",
        r"^daily$",
        r"^weekly$",
    ]

    for pattern in interval_patterns:
        if re.match(pattern, description_lower):
            recurrence = parse_recurrence_seconds(schedule_description)
            if recurrence:
                first_run = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
                return first_run

    time_pattern = r"(?:daily|everyday)\s+at\s+(.+)"
    time_match = re.search(time_pattern, description_lower)

    if time_match:
        time_str = time_match.group(1).strip()

        parsed_time = dateparser.parse(
            time_str,
            settings={
                "TIMEZONE": timezone,
                "RETURN_AS_TIMEZONE_AWARE": True,
                "PREFER_DATES_FROM": "future",
            },
        )

        if parsed_time:
            target_hour = parsed_time.hour
            target_minute = parsed_time.minute
            target_time = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)

            if target_time <= now:
                target_time = target_time + timedelta(days=1)

            return target_time

    weekday_pattern = r"every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(.+)"
    weekday_match = re.search(weekday_pattern, description_lower)

    if weekday_match:
        weekday_str = weekday_match.group(1)
        time_str = weekday_match.group(2).strip()

        weekday_map = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        target_weekday = weekday_map[weekday_str]

        parsed_time = dateparser.parse(
            time_str,
            settings={
                "TIMEZONE": timezone,
                "RETURN_AS_TIMEZONE_AWARE": True,
            },
        )

        if parsed_time:
            target_hour = parsed_time.hour
            target_minute = parsed_time.minute
            current_weekday = now.weekday()
            days_ahead = target_weekday - current_weekday

            if days_ahead == 0:
                target_time = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
                if target_time <= now:
                    days_ahead = 7
            elif days_ahead < 0:
                days_ahead += 7

            target_date = now + timedelta(days=days_ahead)
            target_time = target_date.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)

            return target_time

    parsed_datetime = dateparser.parse(
        schedule_description,
        settings={
            "TIMEZONE": timezone,
            "RETURN_AS_TIMEZONE_AWARE": True,
            "PREFER_DATES_FROM": "future",
            "RELATIVE_BASE": now.replace(tzinfo=None),
        },
    )

    if parsed_datetime:
        if parsed_datetime <= now:
            recurrence = parse_recurrence_seconds(schedule_description)
            parsed_datetime = now + timedelta(seconds=recurrence) if recurrence else parsed_datetime + timedelta(days=1)

        return parsed_datetime

    raise ValueError(
        f"Could not parse schedule description: '{schedule_description}'. "
        f"Try formats like 'every 5 minutes', 'daily at 9am', 'every Monday at 2pm', "
        f"'hourly', 'in 10 minutes', or 'tomorrow at 3pm'"
    )
