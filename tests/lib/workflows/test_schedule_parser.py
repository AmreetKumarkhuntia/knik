"""Which descriptions recur, and when a recurring schedule runs next."""

from datetime import UTC, datetime, timedelta

import pytest

from lib.workflows.schedule_parser import calculate_next_run, parse_recurrence_seconds


@pytest.mark.parametrize(
    ("description", "seconds"),
    [
        ("every 5 minutes", 300),
        ("hourly", 3600),
        ("daily at 9am", 86400),
        ("everyday at 9am", 86400),
        ("every Monday at 2pm", 604800),
        ("every friday at 17:00", 604800),
        ("in 5 minutes", None),
        ("tomorrow at 3pm", None),
        ("at 5pm", None),
    ],
)
def test_recurrence_of_each_supported_format(description, seconds):
    assert parse_recurrence_seconds(description) == seconds


def _utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=UTC)


def test_next_run_counts_from_the_due_time_not_from_now():
    due = _utc(2026, 5, 1, 10, 0)

    assert calculate_next_run(due, 300, now=due + timedelta(seconds=7)) == _utc(2026, 5, 1, 10, 5)


def test_missed_intervals_are_skipped_not_replayed():
    due = _utc(2026, 5, 1, 10, 0)

    assert calculate_next_run(due, 300, now=_utc(2026, 5, 1, 13, 2)) == _utc(2026, 5, 1, 13, 5)
    # An occurrence exactly at `now` is the one being run, so the next is one interval later.
    assert calculate_next_run(due, 300, now=_utc(2026, 5, 1, 10, 10)) == _utc(2026, 5, 1, 10, 15)


def test_daily_runs_keep_their_wall_clock_time_across_daylight_saving_changes():
    # 9:00 in New York is 14:00 UTC before the clocks go forward on 2026-03-08 and 13:00 UTC after.
    due = _utc(2026, 3, 7, 14, 0)
    assert calculate_next_run(due, 86400, "America/New_York", now=due) == _utc(2026, 3, 8, 13, 0)

    # 9:00 is 13:00 UTC before the clocks go back on 2026-11-01 and 14:00 UTC after; at 13:30 UTC on
    # the 1st that day's 9:00 has not happened yet.
    due = _utc(2026, 10, 31, 13, 0)
    assert calculate_next_run(due, 86400, "America/New_York", now=_utc(2026, 11, 1, 13, 30)) == _utc(2026, 11, 1, 14, 0)


def test_weekly_runs_keep_their_wall_clock_time_across_daylight_saving_changes():
    monday_2pm_cet = _utc(2026, 3, 23, 13, 0)

    assert calculate_next_run(monday_2pm_cet, 604800, "Europe/Berlin", now=monday_2pm_cet) == _utc(2026, 3, 30, 12, 0)


def test_sub_day_intervals_are_exact_whatever_the_timezone():
    # Across the 2026-03-08 change "every 6 hours" is still six real hours, not 06:00/12:00 local.
    due = _utc(2026, 3, 8, 5, 0)

    assert calculate_next_run(due, 21600, "America/New_York", now=due) == _utc(2026, 3, 8, 11, 0)


def test_fixed_offset_timezones_step_in_whole_days():
    due = _utc(2026, 5, 1, 3, 30)

    assert calculate_next_run(due, 86400, "GMT+5:30", now=due) == _utc(2026, 5, 2, 3, 30)


@pytest.mark.parametrize("seconds", [0, -86400])
def test_a_recurrence_that_never_moves_forward_is_rejected(seconds):
    with pytest.raises(ValueError, match="must be positive"):
        calculate_next_run(_utc(2026, 5, 1), seconds, now=_utc(2026, 5, 2))
