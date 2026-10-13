"""Tests for the pure text, time and encoding helpers in lib.utils (used by workflows and tools)."""

import asyncio
import datetime

import pytest

from lib.utils import encoding_ops, text_ops, time_ops


def run(coro):
    return asyncio.run(coro)


class TestTextOps:
    def test_format(self):
        assert run(text_ops.string_format("{a}-{b}", a="x", b=2)) == "x-2"

    def test_format_missing_key_returns_error_dict(self):
        assert run(text_ops.string_format("{missing}")) == {"error": "String format failed: 'missing'"}

    @pytest.mark.parametrize(
        ("coro_factory", "expected"),
        [
            (lambda: text_ops.string_replace("a-b-c", "-", "+"), "a+b+c"),
            (lambda: text_ops.string_concat("a", "b", "c"), "abc"),
            (lambda: text_ops.string_join(", ", "a", "b"), "a, b"),
            (lambda: text_ops.string_split("a,b,c", ","), ["a", "b", "c"]),
            (lambda: text_ops.string_to_lower("AbC"), "abc"),
            (lambda: text_ops.string_to_upper("AbC"), "ABC"),
            (lambda: text_ops.string_strip("  x  "), "x"),
            (lambda: text_ops.string_length("hello"), "5"),
            (lambda: text_ops.string_reverse("hello"), "olleh"),
        ],
    )
    def test_string_helpers(self, coro_factory, expected):
        assert run(coro_factory()) == expected


class TestTimeOps:
    def test_current_timestamp_is_iso(self):
        assert datetime.datetime.fromisoformat(run(time_ops.current_timestamp()))

    def test_current_date(self):
        assert run(time_ops.get_current_date()) == datetime.date.today().strftime("%Y-%m-%d")

    def test_current_time_in_timezone(self):
        assert datetime.datetime.strptime(run(time_ops.get_current_time("UTC")), "%Y-%m-%d %H:%M:%S")

    def test_current_time_invalid_timezone_returns_error_string(self):
        assert run(time_ops.get_current_time("Not/AZone")).startswith("Error: ")


class TestEncodingOps:
    def test_encode_str(self):
        assert run(encoding_ops.base64_encode("hello")) == "aGVsbG8="

    def test_encode_bytes(self):
        assert run(encoding_ops.base64_encode(b"\x00\xff")) == "AP8="

    def test_round_trip(self):
        assert run(encoding_ops.base64_decode(run(encoding_ops.base64_encode("knik ✓")))) == "knik ✓"
